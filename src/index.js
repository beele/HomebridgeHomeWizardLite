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
        "hubs": ["test-hub-name-1", "test-hub-name-2"],
        "delay": "delay-in-milliseconds",
        "retries": "number-of-retries"
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

    this.hubs = config['hubs'];
    this.flows = new Flows(
        new HomeWizard(
            config['delay'],
            config['retries'],
            log
        ),
        log,
        config['username'],
        config['password']
    );

    if (api) {
        platform.api = api;

        platform.api.on('didFinishLaunching', function () {
            platform.log('Platform API loaded!');

            const switchesPerHub = [];
            for (const hub of platform.hubs) {
                switchesPerHub.push(platform.flows.processSwitchesFlow(hub));
            }

            if (platform.accessories.length > 0) {
                platform.log('Accessories restored from cache!');

                Promise
                    .all(switchesPerHub)
                    .then((arrayWithSwitchesPerHub) => {
                        const allSwitches = Array.prototype.concat.apply([], arrayWithSwitchesPerHub);

                        const toAdd = allSwitches.filter(function (sw) {
                            return !platform.accessories.some(function (accessory) {
                                return sw.id === accessory.context.id && sw.hubId === accessory.context.hubId;
                            });
                        });
                        const toRemove = platform.accessories.filter(function (accessory) {
                            return !allSwitches.some(function (sw) {
                                return accessory.context.id === sw.id && accessory.context.hubId === sw.hubId;
                            });
                        });
                        toRemove.forEach((accessory) => {
                            platform.removeAccessory(accessory);
                        });
                        toAdd.forEach((sw) => {
                            platform.addAccessory(sw);
                        });

                        platform.log('Done!');
                    });
            } else {
                platform.log('No Accessories in cache, creating...');

                Promise
                    .all(switchesPerHub)
                    .then((arrayWithSwitchesPerHub) => {
                        const allSwitches = Array.prototype.concat.apply([], arrayWithSwitchesPerHub);
                        for (const sw of allSwitches) {
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

        const uuid = UUIDGen.generate(sw.id);
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

    removeAccessory: function (accessory) {
        const platform = this;
        platform.log('Deleting for accessory: ' + accessory.displayName);

        if (accessory) {
            platform.api.unregisterPlatformAccessories('homebridge-homewizard-lite', 'HomeWizard-Lite', [accessory]);
            platform.accessories.splice(platform.accessories.indexOf(accessory), 1);
        }
    }
};
