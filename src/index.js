const request = require('request-promise-native');
const crypto = require('crypto');

// "platforms": [
//   {
//     "platform": "HomebridgeHomeWizardLite",
//     "name": "display-name",
//     "room": "room-name",
//     "username": "user@domain.tld",
//     "password": "password",
//     "hub": "test-hub-name",
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

    this.log = log;
    this.accessories = [];

    this.username = config['username'];
    this.password = config['password'];
    this.hub = config['hub'];

    this.sessionId = null;
    this.sessionTimestamp = null;

    this.switches = [];

    if (api) {
        platform.api = api;

        platform.api.on('didFinishLaunching', function () {
            platform.log('Platform API loaded!');

            if (platform.accessories.length > 0) {
                platform.log('Accessories restored from cache!');

                platform.authenticate(platform.username, platform.password)
                    .then(() => {
                        //Token stored, ready to be used later!
                    }).catch((error) => {
                        platform.log('Authentication failed: ' + JSON.stringify(error, null, 4));
                    });
            } else {
                platform.authenticate(platform.username, platform.password)
                    .then(() => {
                        platform.log('Getting devices and registering accessories');
                        return platform.getHubAndSwitchIdsByHubName(platform.hub);
                    })
                    .then(() => {
                        platform.switches.forEach(sw => {
                            platform.log('Creating accessory: ' + sw.name + ' :' + sw.id);
                            platform.addAccessory(platform.switches.indexOf(sw));
                        });
                        platform.log('Accessories created!');
                    })
                    .catch((error) => {
                        platform.sessionId = null;
                        platform.sessionTimestamp = null;

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
                platform.authenticate(platform.username, platform.password)
                    .then(() => {
                        return platform.setSwitchState(id, hubId, value);
                    })
                    .then(() => {
                        accessory.context.isOn = value;

                        platform.log('SUCCESS: ' + accessory.displayName + ' has been turned ' + (value ? 'ON' : 'OFF'));
                        return callback();
                    })
                    .catch((error) => {
                        platform.sessionId = null;
                        platform.sessionTimestamp = null;

                        platform.log('ERROR: ' + accessory.displayName + ' could not be turned ' + (value ? 'ON' : 'OFF') + ' details: ' + error);
                        return callback({error: 'Could not set switch state', details: error});
                    });
            });

        accessory.on('identify', function(paired, callback) {
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
    },

    authenticate: function (username, password) {
        const platform = this;

        if (platform.sessionId === null || !platform.isSessionStillValid(platform.sessionTimestamp)) {
            const credentials = platform.getBasicAuthHeader(username, password);
            const opts = {
                uri: 'https://cloud.homewizard.com/account/login',
                headers: {
                    'Authorization': credentials
                },
                json: true
            };

            return request.get(opts)
                .then((response) => {
                    platform.log('Authenticated, session set');
                    platform.sessionId = response.session;
                    platform.sessionTimestamp = Date.now();
                    return Promise.resolve();
                });
        } else {
            platform.log('Preauthenticated, skipping new authentication');
            return Promise.resolve();
        }
    },
    getBasicAuthHeader: function (username, password) {
        const passHash = crypto.createHash('sha1');
        passHash.update(password);

        return 'Basic ' + Buffer.from(username + ':' + passHash.digest('hex')).toString('base64');
    },
    isSessionStillValid: function (sessionTimestamp) {
        const platform = this;

        //Validity duration is somewhere between 1 and 1,5 hours, for now set at 1 hour!
        if ((sessionTimestamp + (3600 * 1000)) >= Date.now()) {
            return true;
        }
        platform.log('WARNING: Authentication expired, a new session must be created!');
        return false;
    },
    getHubAndSwitchIdsByHubName: function (hubName) {
        const platform = this;

        if (!platform.switches || platform.switches.length === 0) {
            const opt = {
                uri: 'https://plug.homewizard.com/plugs',
                headers: {
                    'X-Session-Token': platform.sessionId
                },
                json: true,
            };
            return request.get(opt)
                .then((response) => {
                    response.some((hub) => {
                        if (hub.name === hubName) {
                            platform.log('Hub ' + hubName + ' found, id: ' + hub.id);

                            hub.devices.forEach((device) => {
                                platform.log('Found ' + device.name + ', id:' + device.id);
                                platform.switches.push({name: device.name, id: device.id, hubId: hub.id});
                            });
                            return true;
                        }
                    });
                    return Promise.resolve();
                });
        } else {
            platform.log('Hub and switch IDs already known, skipping lookup');
            return Promise.resolve();
        }
    },
    setSwitchState: function (switchId, hubId, turnOn) {
        const platform = this;

        const opt = {
            uri: 'https://plug.homewizard.com/plugs/' + hubId + '/devices/' + switchId + '/action',
            headers: {
                'X-Session-Token': platform.sessionId,
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: {
                'action': turnOn ? 'On' : 'Off'
            },
            json: true
        };
        return request.post(opt);
    },
};