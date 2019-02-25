const request = require('request-promise-native');

////////////////////////////////////////////
/// Mock request calls to HomeWizard API ///
////////////////////////////////////////////
module.exports.RequestMocking = function() {
    const me = this;

    me.mockAuthenticationGetRequest = function (succeedAfterAttempt = -1, responseContainsError = false) {
        const mock = jest.spyOn(request, 'get');

        let count = 0;
        if(succeedAfterAttempt === -1) {
            mock.mockImplementation((opts) => {
                console.log('Mock called');

                return Promise.reject('dummy-fail');
            });
        } else {
            mock.mockImplementation((opts) => {
                console.log('Mock called');

                if(count++ < succeedAfterAttempt) {
                    return Promise.reject('dummy-fail');
                } else {
                    if (responseContainsError) {
                        return Promise.resolve({error: 110, message: 'dummy-fail'});
                    }
                    return Promise.resolve({session: 'dummy-session-token'});
                }
            });
        }
        return mock;
    };

    me.mockPlugsGetRequest = function (succeedAfterAttempt = -1) {
        const mock = jest.spyOn(request, 'get');

        let count = 0;
        if(succeedAfterAttempt === -1) {
            mock.mockImplementation((opts) => {
                console.log('Mock called');

                return Promise.reject('dummy-fail');
            });
        } else {
            mock.mockImplementation((opts) => {
                console.log('Mock called');

                if(count++ < succeedAfterAttempt) {
                    return Promise.reject('dummy-fail');
                } else {
                    return Promise.resolve(me.getPlugsReplyData());
                }
            });
        }
        return mock;
    };
    me.getPlugsReplyData = function () {
        const reply = [{
            id: 'dummy-id',
            identifier: 'dummy-identifier',
            name: 'dummy-name',
            latitude: 0,
            longitude: 0,
            devices: []
        }];
        for(let i = 0; i < 5; i++) {
            const device = {
                id: 'id-' + (i + 1),
                typeName: 'flamingo_switch',
                name: 'switch' + (i +  1),
                code: null,
                iconUrl: 'dummy-icon'
            };
            reply[0].devices.push(device);
        }
        return reply;
    };

    me.mockSwitchStatePostRequest = function (succeedAfterAttempt = -1, responseContainsError  = false) {
        const mock = jest.spyOn(request, 'post');

        let count = 0;
        if(succeedAfterAttempt === -1) {
            mock.mockImplementation((opts) => {
                console.log('Mock called');

                return Promise.reject('dummy-fail');
            });
        } else {
            mock.mockImplementation((opts) => {
                console.log('Mock called');

                if(count++ < succeedAfterAttempt) {
                    return Promise.reject('dummy-fail');
                } else {
                    if (responseContainsError) {
                        return Promise.resolve({status: 'Failed'});
                    }
                    return Promise.resolve({status: 'Success'});
                }
            });
        }
        return mock;
    };
};