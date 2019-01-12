const request = require('request-promise-native');
const crypto = require('crypto');

let Service, Characteristic;

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
    log("SamplePlatform Init");
    const platform = this;

    this.log = log;
    this.accessories = [];

    this.username = config['username'];
    this.password = config['password'];
    this.hub = config['hub'];

    this.sessionId = null;
    this.sessionTimestamp = null;

    this.hubId = null;
    this.switches = [];

    if (api) {
        this.api = api;

        this.api.on('didFinishLaunching', function () {
            platform.log("DidFinishLaunching");

            platform.authenticate(platform.username, platform.password)
                .then(() => {
                    return platform.getHubAndSwitchIdsByHubName(platform.hub);
                })
                .then(() => {

                    this.switches.forEach(sw => {
                        platform.createAccessory(sw.name, sw.id);
                    });

                    this.log('Accessories created!');
                })
                .catch((error) => {
                    this.sessionId = null;
                    this.sessionTimestamp = null;

                    this.log('ERROR: hub and switch ids could not be fetched, and the corresponding accessories could not be created! details: ' + error);
                });
        }.bind(this));
    }
}

HomeWizardPlatform.prototype = {
    configureAccessory: function (accessory) {
        platform.log('Function configureAccessory is not implemented!');
    },
    addAccessory: function (accessoryName) {
        platform.log('Function configureAccessory is not implemented!');
    },
    updateAccessoriesReachability: function () {
        for (const index in this.accessories) {
            const accessory = this.accessories[index];
            accessory.updateReachability(false);
        }
    },
    removeAccessory: function () {
        this.api.unregisterPlatformAccessories("homebridge-homewizard-lite", "HomeWizard-Lite", this.accessories);
        this.accessories = [];
    },

    createAccessory: function (accessoryName, switchId) {
        const platform = this;
        const uuid = UUIDGen.generate(accessoryName);
        const newAccessory = new Accessory(accessoryName, uuid);

        newAccessory.context.switchId = switchId;
        newAccessory.on('identify', function (paired, callback) {
            platform.log(newAccessory.displayName, "Identify!!!");
            callback();
        });

        newAccessory.addService(Service.Switch, accessoryName)
            .getCharacteristic(Characteristic.On)
            .on('set', function (value, next) {
                platform.authenticate(platform.username, platform.password)
                    .then(() => {
                        return platform.setSwitchState(newAccessory.switchId, value);
                    })
                    .then(() => {
                        platform.isOn = value;

                        this.log('SUCCESS: ' + newAccessory.displayName + ' has been turned ' + (value ? 'ON' : 'OFF'));
                        return next();
                    })
                    .catch((error) => {
                        this.sessionId = null;
                        this.sessionTimestamp = null;

                        this.log('ERROR: ' + newAccessory.displayName + ' could not be turned ' + (value ? 'ON' : 'OFF') + ' details: ' + error);
                        return next({error: 'Could not set switch state', details: error});
                    });
            });

        this.api.registerPlatformAccessories('homebridge-homewizard-lite', 'HomeWizard-Lite', [newAccessory]);
    },

    authenticate: function (username, password) {
        const platform = this;

        if (platform.sessionId === null || !platform.isSessionStillValid(platform.sessionTimestamp)) {
            const credentials = this.getBasicAuthHeader(username, password);
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

        if (platform.hubId === null) {
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
                            platform.hubId = hub.id;

                            hub.devices.forEach((device) => {
                                platform.log('Switch ' + device.name + ', id:' + device.id);
                                platform.switches.push({name: device.name, id: device.id});
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

    setSwitchState: function (switchId, turnOn) {
        const platform = this;

        const opt = {
            uri: 'https://plug.homewizard.com/plugs/' + platform.hubId + '/devices/' + switchId + '/action',
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