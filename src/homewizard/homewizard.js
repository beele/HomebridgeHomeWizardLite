const request = require('request-promise-native');
const crypto = require('crypto');

module.exports.HomeWizard = function (logger) {
    const me = this;
    me.log = logger;

    me.retry = function retry(maxRetries, fn) {
        return fn().catch(function (err) {
            if (maxRetries <= 0) {
                throw err;
            }
            console.log('failed, retrying!');
            return retry(maxRetries - 1, fn);
        });
    };

    me.authenticate = function (username, password) {
        if (!username || !password) {
            return Promise.reject('Username and password should be filled in!');
        } else {
            const credentials = me.getBasicAuthHeader(username, password);
            const opts = {
                uri: 'https://cloud.homewizard.com/account/login',
                headers: {
                    'Authorization': credentials
                },
                json: true
            };
            return me
                .retry(3, () => {
                    return request.get(opts);
                })
                .then((response) => {
                    console.log(response);
                    if (response.error && response.error === 110) {
                        return Promise.reject(response);
                    } else {
                        me.log('Authenticated, session set');
                        return Promise.resolve({
                            token: response.session,
                            timestamp: Date.now()
                        });
                    }
                });
        }
    };

    me.getBasicAuthHeader = function (username, password) {
        const passHash = crypto.createHash('sha1');
        passHash.update(password);

        return 'Basic ' + Buffer.from(username + ':' + passHash.digest('hex')).toString('base64');
    };

    me.isSessionStillValid = function (sessionTimestamp) {
        //Validity duration is somewhere between 1 and 1,5 hours, for now set at 1 hour!
        if ((sessionTimestamp + (3600 * 1000)) >= Date.now()) {
            return Promise.resolve(true);
        }
        me.log('WARNING: Session expired, a new session must be created!');
        return Promise.reject('Session expired');
    };

    me.getHubAndSwitchIdsByHubName = function (session, hubName) {
        const switches = [];

        const opt = {
            uri: 'https://plug.homewizard.com/plugs',
            headers: {
                'X-Session-Token': session.token
            },
            json: true,
        };
        return request.get(opt)
            .then((response) => {
                response.some((hub) => {
                    if (hub.name === hubName) {
                        me.log('Hub ' + hubName + ' found, id: ' + hub.id);

                        hub.devices.forEach((device) => {
                            me.log('Found ' + device.name + ', id:' + device.id);
                            switches.push({name: device.name, id: device.id, hubId: hub.id});
                        });
                        return true;
                    }
                });
                return Promise.resolve(switches);
            });
    };

    me.setSwitchState = function (session, switchId, hubId, turnOn) {
        const opt = {
            uri: 'https://plug.homewizard.com/plugs/' + hubId + '/devices/' + switchId + '/action',
            headers: {
                'X-Session-Token': session.token,
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: {
                'action': turnOn ? 'On' : 'Off'
            },
            json: true
        };
        return request.post(opt);
    };
};