const HomeWizard = require("./homewizard").HomeWizard;

const request = require('request-promise-native');

beforeEach(() => {
    console.log('resetting modules!');
    jest.resetModules();
    jest.setTimeout(10000);
});


test('HomeWizard-authentication-username-and-password-valid', done => {
    const requestMock = mockAuthenticationGetRequestResolve(false);

    const homeWizard = new HomeWizard((message) => console.log(message));
    homeWizard.authenticate('valid@example.com', 'validPassword')
        .then((session) => {
            console.log(session);

            expect(session).not.toBeNull();
            expect(session.token).not.toBeNull();
            expect(session.timestamp).not.toBeNull();
            expect(requestMock).toBeCalledTimes(1);

            requestMock.mockReset();
            done();
        })
        .catch((error) => {
            fail('Authentication should succeed!');
        });
});
test('HomeWizard-authentication-unreachable-first-time', done => {
    const requestMock = mockAuthenticationGetRequestReject(1);

    const homeWizard = new HomeWizard((message) => console.log(message));
    homeWizard.authenticate('dummy-username', 'dummy-password')
        .then((session) => {
            console.log(session);

            expect(session).not.toBeNull();
            expect(session.token).not.toBeNull();
            expect(session.timestamp).not.toBeNull();
            expect(requestMock).toBeCalledTimes(2);

            requestMock.mockReset();
            done();
        })
        .catch((error) => {
            fail('Authentication should succeed!');
        });
});
test('HomeWizard-authentication-username-and-password-null', done => {
    const homeWizard = new HomeWizard((message) => console.log(message));
    homeWizard.authenticate(null, null)
        .then((session) => {
            fail('Authentication should not succeed when the username and password are null');
        })
        .catch((error) => {
            expect(error).not.toBeNull();
            done();
        });
});
test('HomeWizard-authentication-unreachable', done => {
    const requestMock = mockAuthenticationGetRequestReject();

    const homeWizard = new HomeWizard((message) => console.log(message));
    homeWizard.authenticate('dummy-username', 'dummy-password')
        .then((session) => {
            fail('Authentication should not succeed when the service is unreachable');
        })
        .catch((error) => {
            expect(error).not.toBeNull();
            expect(requestMock).toBeCalledTimes(3);

            requestMock.mockReset();
            done();
        });
});
test('HomeWizard-authentication-non-valid-credentials', done => {
    const requestMock = mockAuthenticationGetRequestResolve(true);

    const homeWizard = new HomeWizard((message) => console.log(message));
    homeWizard.authenticate('dummy-username', 'dummy-password')
        .then((session) => {
            fail('Authentication should not succeed when the username and password are bogus data');
        })
        .catch((error) => {
            expect(error).not.toBeNull();
            expect(requestMock).toBeCalledTimes(1);

            requestMock.mockReset();
            done();
        });
});


test('HomeWizard-getHubAndSwitchIdsByHubName-hub-with-5-switches', done => {
    const requestMock = mockPlugsGetRequestResolve();
    const session = {
        token: 'dummy-token',
        timestamp: Date.now()
    };

    const homeWizard = new HomeWizard((message) => console.log(message));
    homeWizard.getHubAndSwitchIdsByHubName(session, 'dummy-name')
        .then((switches) => {
            expect(switches).not.toBeNull();
            expect(switches.length).toEqual(5);
            expect(requestMock).toBeCalledTimes(1);

            requestMock.mockReset();
            done();
        })
        .catch((error) => {
            fail('Switches should be returned!');
        });
});
test('HomeWizard-getHubAndSwitchIdsByHubName-hub-with-5-switches-unreachable-first-time', done => {
    const requestMock = mockPlugsGetRequestReject(1);
    const session = {
        token: 'dummy-token',
        timestamp: Date.now()
    };

    const homeWizard = new HomeWizard((message) => console.log(message));
    homeWizard.getHubAndSwitchIdsByHubName(session, 'dummy-name')
        .then((switches) => {
            expect(switches).not.toBeNull();
            expect(switches.length).toEqual(5);
            expect(requestMock).toBeCalledTimes(2);

            requestMock.mockReset();
            done();
        })
        .catch((error) => {
            fail('Switches should be returned!');
        });
});
test('HomeWizard-getHubAndSwitchIdsByHubName-unreachable', done => {
    const requestMock = mockPlugsGetRequestReject();
    const session = {
        token: 'dummy-token',
        timestamp: Date.now()
    };

    const homeWizard = new HomeWizard((message) => console.log(message));
    homeWizard.getHubAndSwitchIdsByHubName(session, 'dummy-name')
        .then((switches) => {
            fail('getHubAndSwitchIdsByHubName should not return data when the service is unreachable');
        })
        .catch((error) => {
            expect(error).not.toBeNull();
            expect(requestMock).toBeCalledTimes(3);

            requestMock.mockReset();
            done();
        });
});


test('HomeWizard-setSwitchState-switch-found-successful', done => {
    const requestMock = mockSwitchStatePostRequestResolve(false);
    const session = {
        token: 'dummy-token',
        timestamp: Date.now()
    };

    const homeWizard = new HomeWizard((message) => console.log(message));
    homeWizard.setSwitchState(session, 'dummy-switchId', 'dummy-hubId', true)
        .then((result) => {
            expect(result).not.toBeNull();
            expect(result.status).toEqual('Success');
            expect(requestMock).toBeCalledTimes(1);

            requestMock.mockReset();
            done();
        })
        .catch((error) => {
            fail('setSwitchState should return a success message');
        });
});
test('HomeWizard-setSwitchState-switch-found-successful-unreachable-first-time', done => {
    const requestMock = mockSwitchStatePostRequestReject(1);
    const session = {
        token: 'dummy-token',
        timestamp: Date.now()
    };

    const homeWizard = new HomeWizard((message) => console.log(message));
    homeWizard.setSwitchState(session, 'dummy-switchId', 'dummy-hubId', true)
        .then((result) => {
            expect(result).not.toBeNull();
            expect(result.status).toEqual('Success');
            expect(requestMock).toBeCalledTimes(2);

            requestMock.mockReset();
            done();
        })
        .catch((error) => {
            fail('setSwitchState should return a success message');
        });
});
test('HomeWizard-setSwitchState-unreachable-or-switch-not-found', done => {
    const requestMock = mockSwitchStatePostRequestReject();
    const session = {
        token: 'dummy-token',
        timestamp: Date.now()
    };

    const homeWizard = new HomeWizard((message) => console.log(message));
    homeWizard.setSwitchState(session, 'dummt-switchId', 'dummy-hubId', true)
        .then((result) => {
            fail('setSwitchState should not return data when the service is unreachable');
        })
        .catch((error) => {
            expect(error).not.toBeNull();
            expect(requestMock).toBeCalledTimes(3);

            requestMock.mockReset();
            done();
        });
});
test('HomeWizard-setSwitchState-switch-found-not-successful', done => {
    const requestMock = mockSwitchStatePostRequestResolve(true);
    const session = {
        token: 'dummy-token',
        timestamp: Date.now()
    };

    const homeWizard = new HomeWizard((message) => console.log(message));
    homeWizard.setSwitchState(session, 'dummy-switchId', 'dummy-hubId', true)
        .then((result) => {
            expect(result).not.toBeNull();
            expect(result).not.toEqual('Success');
            expect(requestMock).toBeCalledTimes(1);

            requestMock.mockReset();
            done();
        })
        .catch((error) => {
            fail('setSwitchState should return a failure message');
        });
});



////////////////////////////////////////////
/// Mock request calls to HomeWizard API ///
////////////////////////////////////////////
function mockAuthenticationGetRequestReject(succeedAfterAttempt = -1) {
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
                return Promise.resolve({session: 'dummy-session-token'});
            }
        });
    }
    return mock;
}
function mockAuthenticationGetRequestResolve(responseContainsError) {
    const mock = jest.spyOn(request, 'get');
    mock.mockImplementation((opts) => {
        console.log('Mock called');

        if (responseContainsError) {
            return Promise.resolve({error: 110, message: 'dummy-fail'});
        } else {
            return Promise.resolve({session: 'dummy-session-token'});
        }
    });
    return mock;
}


function mockPlugsGetRequestReject(succeedAfterAttempt = -1) {
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
                return Promise.resolve(getPlugsReplyData());
            }
        });
    }
    return mock;
}
function mockPlugsGetRequestResolve() {
    const mock = jest.spyOn(request, 'get');
    mock.mockImplementation((opts) => {
        console.log('Mock called');

        return Promise.resolve(getPlugsReplyData());
    });
    return mock;
}
function getPlugsReplyData() {
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
}


function mockSwitchStatePostRequestReject(succeedAfterAttempt = -1) {
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
                return Promise.resolve({status: 'Success'});
            }
        });
    }
    return mock;
}
function mockSwitchStatePostRequestResolve(responseContainsError) {
    const mock = jest.spyOn(request, 'post');
    mock.mockImplementation((opts) => {
        console.log('Mock called');

        if (responseContainsError) {
            //Actual response is unknown!
            return Promise.resolve({status: 'Failed'})
        } else {
            return Promise.resolve({status: 'Success'});
        }
    });
    return mock;
}