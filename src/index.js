const request = require('request-promise-native');
const crypto = require('crypto');

let Service, Characteristic;

// "accessories": [
//   {
//     "accessory": "HomebridgeHomeWizardLite",
//     "username": "user@domain.tld",
//     "password": "password",
//     "hub": "test-hub-name",
//     "switch": "test-switch-name"
//   }
// ]

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-homewizard-flamingo', 'HomebridgeHomeWizardLite', HomebridgeHomeWizardLite);
};

function HomebridgeHomeWizardLite(log, config) {
    this.log = log;

    this.username = config['username'];
    this.password = config['password'];

    this.hub = config['hub'];
    this.switch = config['switch'];

    this.sessionId = null;
    this.hubId = null;
    this.switchId = null;
}

HomebridgeHomeWizardLite.prototype = {
    setPowerState: function (powerOn, next) {
        const me = this;

        me.authenticate(me.username, me.password)
            .then(() => {
                return me.getSwitchIdByHubAndSwitchNames(me.hub, me.switch);
            })
            .then(() => {
                return me.setSwitchState(powerOn);
            })
            .then(() => {
                return next();
            })
            .catch((error) => {
                return next({error: 'Could not set switch state', details: error});
            });
    },

    authenticate: function (username, password) {
        const me = this;

        if (me.sessionId === null) {
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
                    me.sessionId = response.session;
                    console.log(me.sessionId);
                    return Promise.resolve();
                });
        } else {
            return new Promise.resolve();
        }
    },

    getBasicAuthHeader: function (username, password) {
        const passHash = crypto.createHash('sha1');
        passHash.update(password);

        return 'Basic ' + Buffer.from(username + ':' + passHash.digest('hex')).toString('base64');
    },

    getSwitchIdByHubAndSwitchNames: function (hubName, switchName) {
        const me = this;

        if (me.hubId === null && me.switchId === null) {
            const opt = {
                uri: 'https://plug.homewizard.com/plugs',
                headers: {
                    'X-Session-Token': me.sessionId
                },
                json: true,
            };
            return request.get(opt)
                .then((response) => {
                    response.some((hub) => {
                        if(hub.name === hubName) {
                            me.hubId = hub.id;

                            hub.devices.some((device) => {
                                if (device.name === switchName) {
                                    me.switchId = device.id;
                                    return true;
                                }
                            });
                            return true;
                        }
                    });
                    return Promise.resolve();
                });
        } else {
            return Promise.resolve();
        }
    },

    setSwitchState: function (turnOn) {
        const me = this;

        const opt = {
            uri: 'https://plug.homewizard.com/plugs/' + me.hubId + '/devices/' + me.switchId + '/action',
            headers: {
                'X-Session-Token': me.sessionId,
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: {
                'action': turnOn ? 'On' : 'Off'
            },
            json: true
        };
        return request.post(opt);
    },

    getServices: function () {
        const me = this;
        const informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, "HomeWizard")
            .setCharacteristic(Characteristic.Model, "SmartSwitch")
            .setCharacteristic(Characteristic.SerialNumber, "1234-5678");

        const switchService = new Service.Switch(me.name);
        switchService.getCharacteristic(Characteristic.On)
            .on('get', this.getPowerState.bind(this))
            .on('set', this.setPowerState.bind(this));

        this.informationService = informationService;
        this.switchService = switchService;
        return [informationService, switchService];
    }
};