const request = require('request-promise-native');
const crypto = require('crypto');

module.exports.HomeWizard = function (logger) {
    const me = this;
    me.log = logger;

    me.pause = (duration) => new Promise(res => setTimeout(res, duration));
    me.backoff = (retries, fn, delay = 1000) =>
        fn().catch(err => retries > 1
            ? me.pause(delay).then(() => me.backoff(retries - 1, fn, delay * 2))
            : Promise.reject(err));

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
                .backoff(3, () => {
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

    me.isSessionStillValid = function (session) {
        //Validity duration is somewhere between 1 and 1,5 hours, for now set at 1 hour!
        if ((session.timestamp + (3600 * 1000)) >= Date.now()) {
            return Promise.resolve(session);
        }
        me.log('WARNING: Session expired, a new session must be created!');
        return Promise.reject('Session expired');
    };

    me.getHubAndSwitchIdsByHubName = function (session, hubName) {
        const switches = [];

        const opts = {
            uri: 'https://plug.homewizard.com/plugs',
            headers: {
                'X-Session-Token': session.token
            },
            json: true,
        };

        return me
            .backoff(3, () => {
                return request.get(opts);
            })
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
        return me
            .backoff(3, () => {
                return request.post(opt);
            });
    };
};