const request = require('request-promise-native');
const crypto = require('crypto');

module.exports.HomeWizard = function (initialBackoffDelay, maxRetries, logger) {
    const me = this;
    me.log = logger;
    me.initialBackoffDelay = initialBackoffDelay;
    me.maxRetries = maxRetries;

    me.pause = (duration) => new Promise(res => setTimeout(res, duration));
    me.backoff = (retries, fn, delay = me.initialBackoffDelay) =>
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
                .backoff(me.maxRetries, () => {
                    me.log('Trying to get an authenticated session...');
                    return request.get(opts);
                })
                .then((response) => {
                    if (response.error && response.error === 110) {
                        return Promise.reject(response);
                    } else {
                        me.log('Authenticated, returning session');
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
        if (session) {
            if ((session.timestamp + (3600 * 1000)) >= Date.now()) {
                return Promise.resolve(session);
            } else {
                me.log('WARNING: Session expired, a new session must be created!');
            }
        } else {
            me.log('WARNING: No previous session found, a new session must be created!');
        }
        return Promise.reject('No valid session');
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
            .backoff(me.maxRetries, () => {
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
            .backoff(me.maxRetries, () => {
                me.log('Trying to set switch state for ' + switchId + '...');
                return request.post(opt);
            });
    };
};