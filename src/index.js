const request = require('request-promise-native');
const crypto = require('crypto');
const HomeWizard = require("./homewizard/homewizard").HomeWizard;

// "platforms": [
//   {
//     "platform": "HomeWizard-Lite",
//     "name": "display-name",
//     "room": "room-name",
//     "username": "user@domain.tld",
//     "password": "password",
//     "hub": "test-hub-name"
//   }
// ]

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

    this.homeWizard = new HomeWizard(log);

    this.log = log;
    this.accessories = [];

    this.username = config['username'];
    this.password = config['password'];
    this.hub = config['hub'];

    this.session = null;
    this.switches = [];

    if (api) {
        platform.api = api;

        platform.api.on('didFinishLaunching', function () {
            platform.log('Platform API loaded!');

            if (platform.accessories.length > 0) {
                platform.log('Accessories restored from cache!');

                platform.homeWizard.isSessionStillValid(platform.session)
                    .catch((reason) => {
                        return platform.homeWizard.authenticate(platform.username, platform.password);
                    })
                    .catch((error) => {
                        platform.log('Authentication failed: ' + JSON.stringify(error, null, 4));
                        return Promise.resolve(null);
                    })
                    .finally((session) => {
                        platform.session = session;
                    });
            } else {
                platform.log('No Accessories in cache, creating...');

                //TODO: Remove duplicate code!
                platform.homeWizard.isSessionStillValid(platform.session)
                    .catch((reason) => {
                        return platform.homeWizard.authenticate(platform.username, platform.password);
                    })
                    .catch((error) => {
                        platform.log('Authentication failed: ' + JSON.stringify(error, null, 4));
                        return Promise.resolve(null);
                    })
                    .finally((session) => {
                        platform.session = session;

                        if (platform.session === null) {
                            return Promise.reject('A valid session could not be obtained!');
                        } else {
                            return platform.homeWizard.getHubAndSwitchIdsByHubName(platform.session, platform.hub);
                        }
                    })
                    .then((switches) => {
                        switches.forEach(sw => {
                            platform.log('Creating accessory: ' + sw.name + ' :' + sw.id);
                            platform.switches.push(sw);
                            platform.addAccessory(switches.indexOf(sw));
                        });
                        platform.log('Accessories created!');
                    })
                    .catch((error) => {
                        platform.session = null;
                        platform.log('ERROR: hub and switch ids could not be fetched, and the corresponding accessories could not be created! details: ' + error);
                    });
            }
        }.bind(this));
    }
}

HomeWizardPlatform.prototype = {
    addAccessory: function (index) {
        const platform = this;

        const sw = platform.switches[index];
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

                platform.homeWizard.isSessionStillValid(platform.session)
                    .catch((reason) => {
                        return platform.homeWizard.authenticate(platform.username, platform.password);
                    })
                    .catch((error) => {
                        platform.log('Authentication failed: ' + JSON.stringify(error, null, 4));
                        return Promise.resolve(null);
                    })
                    .finally((session) => {
                        platform.session = session;

                        if (session === null) {
                            return Promise.reject('A valid session could not be obtained!');
                        } else {
                            return platform.homeWizard.setSwitchState(session, id, hubId, value);
                        }
                    })
                    .then((result) => {
                        accessory.context.isOn = value;

                        platform.log('SUCCESS: ' + accessory.displayName + ' has been turned ' + (value ? 'ON' : 'OFF'));
                        return callback();
                    })
                    .catch((error) => {
                        platform.session = null;

                        platform.log('ERROR: ' + accessory.displayName + ' could not be turned ' + (value ? 'ON' : 'OFF') + ' details: ' + error);
                        return callback({error: 'Could not set switch state', details: error});
                    });
            });

        accessory.on('identify', function (paired, callback) {
            platform.log(accessory.displayName, "Identify!!!");
            callback();
        });
    },
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