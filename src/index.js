const Flows = require("./homewizard/flows").Flows;
const HomeWizard = require("./homewizard/homewizard").HomeWizard;

/*
Configuration example

"platforms": [
    {
        "platform": "HomeWizard-Lite",
        "name": "display-name",
        "room": "room-name",
        "username": "user@domain.tld",
        "password": "password",
        "hub": "test-hub-name"
    }
]
*/

let Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
    Accessory = homebridge.platformAccessory;

    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform('homebridge-homewizard-lite', 'HomeWizard-Lite', HomeWizardPlatform, true);
};

function HomeWizardPlatform(log, config, api) {
    log('HomeWizard-Lite Platform Init');
    const platform = this;

    this.log = log;
    this.accessories = [];

    this.hub = config['hub'];
    this.flows = new Flows(new HomeWizard(1000, 5, log), log, config['username'], config['password']);

    if (api) {
        platform.api = api;

        platform.api.on('didFinishLaunching', function () {
            platform.log('Platform API loaded!');

            if (platform.accessories.length > 0) {
                platform.log('Accessories restored from cache!');
                platform.flows.authenticationFlow()
                    .then((session) => {
                        platform.log('Authenticated, session stored!')
                    })
            } else {
                platform.log('No Accessories in cache, creating...');
                platform.flows.processSwitchesFlow(platform.hub)
                    .then((switches) => {
                        for (const sw of switches) {
                            platform.addAccessory(sw);
                        }
                    })
                    .catch((error) => {
                        platform.log("Could not get switches: " + error);
                    });
            }
        }.bind(this));
    }
}

HomeWizardPlatform.prototype = {
    addAccessory: function (sw) {
        const platform = this;

        const uuid = UUIDGen.generate(sw.name);
        const newAccessory = new Accessory(sw.name, uuid);

        newAccessory.context = {id: sw.id, hubId: sw.hubId, isOn: 0};
        newAccessory.addService(Service.Switch, sw.name);

        platform.api.registerPlatformAccessories('homebridge-homewizard-lite', 'HomeWizard-Lite', [newAccessory]);
        platform.configureAccessory(newAccessory);
    },
    configureAccessory: function (accessory) {
        const platform = this;
        platform.accessories.push(accessory);

        const id = accessory.context.id;
        const hubId = accessory.context.hubId;
        platform.log('Configuring ' + id);

        accessory.getService(Service.AccessoryInformation)
            .setCharacteristic(Characteristic.Manufacturer, 'HomeWizard')
            .setCharacteristic(Characteristic.Model, 'SmartSwitch')
            .setCharacteristic(Characteristic.SerialNumber, id);

        accessory.getService(Service.Switch)
            .getCharacteristic(Characteristic.On)
            .on('get', (callback) => {
                callback(null, accessory.context.isOn);
            })
            .on('set', (value, callback) => {
                platform.flows.setSwitchStateFlow(id, hubId, value)
                    .then((result) => {
                        accessory.context.isOn = result;
                        return callback();
                    })
                    .catch((error) => {
                        return callback({error: 'Could not set switch state', details: error});
                    });
            });

        accessory.on('identify', function (paired, callback) {
            platform.log(accessory.displayName, "Identify!!!");
            callback();
        });
    },

    //TODO: When restoring from cache, check available vs cached switches, delete ones that are no longer available and create new ones!
    removeAccessory: function (name) {
        const platform = this;
        platform.log('Delete requested for: ' + name);

        let switchToRemove;
        platform.accessories.forEach(value => {
            if (value.displayName === name) {
                switchToRemove = value;
            }
        });

        if (switchToRemove) {
            platform.api.unregisterPlatformAccessories('homebridge-homewizard-lite', 'HomeWizard-Lite', [switchToRemove]);
            platform.accessories.splice(platform.accessories.indexOf(switchToRemove), 1);
        }
    }
};