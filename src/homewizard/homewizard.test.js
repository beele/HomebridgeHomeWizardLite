const HomeWizard = require("./homewizard").HomeWizard;
const RequestMocking = require("./mocking/request-mocking").RequestMocking;

const Mocks = new RequestMocking();

beforeEach(() => {
    console.log('resetting modules!');
    jest.resetModules();
    jest.resetAllMocks();
    jest.setTimeout(10000);
});

test('HomeWizard-getBasicAuthHeader-username-password-not-null', done => {
    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));

    const authHeader = homeWizard.getBasicAuthHeader('valid@example.com', 'validPassword');
    expect(authHeader).not.toBeUndefined();
    expect(authHeader).not.toBeNull();

    done();
});
test('HomeWizard-getBasicAuthHeader-username-password-null', done => {
    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));

    const authHeader = homeWizard.getBasicAuthHeader('null', 'null');
    expect(authHeader).not.toBeUndefined();
    expect(authHeader).not.toBeNull();

    done();
});


test('HomeWizard-isSessionStillValid-session-valid', done => {
    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));

    const session = {
        token: 'dummy-token',
        timestamp: Date.now()
    };

    homeWizard.isSessionStillValid(session)
        .then((session) => {
            expect(session).not.toBeUndefined();
            expect(session).not.toBeNull();

            done();
        })
        .catch((error) => {
            fail('When the session is valid it should be returned!');
        });
});
test('HomeWizard-isSessionStillValid-session-invalid', done => {
    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));

    const session = {
        token: 'dummy-token',
        timestamp: (Date.now() - (3600 * 1000) - 1)
    };

    homeWizard.isSessionStillValid(session)
        .then((session) => {
            fail('When the session is invalid it should not be returned!');
        })
        .catch((error) => {
            expect(error).not.toBeUndefined();
            expect(error).not.toBeNull();

            done();
        });
});
test('HomeWizard-isSessionStillValid-session-null', done => {
    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));

    homeWizard.isSessionStillValid(null)
        .then((session) => {
            fail('When the session is invalid it should not be returned!');
        })
        .catch((error) => {
            expect(error).not.toBeUndefined();
            expect(error).not.toBeNull();

            done();
        });
});


test('HomeWizard-authentication-username-and-password-valid', done => {
    const requestMock = Mocks.mockAuthenticationGetRequest(0, false);

    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));
    homeWizard.authenticate('valid@example.com', 'validPassword')
        .then((session) => {
            console.log(session);

            expect(session).not.toBeNull();
            expect(session.token).not.toBeNull();
            expect(session.timestamp).not.toBeNull();
            expect(requestMock).toBeCalledTimes(1);

            done();
        })
        .catch((error) => {
            fail('Authentication should succeed!');
        });
});
test('HomeWizard-authentication-unreachable-first-time', done => {
    const requestMock = Mocks.mockAuthenticationGetRequest(1);

    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));
    homeWizard.authenticate('dummy-username', 'dummy-password')
        .then((session) => {
            console.log(session);

            expect(session).not.toBeNull();
            expect(session.token).not.toBeNull();
            expect(session.timestamp).not.toBeNull();
            expect(requestMock).toBeCalledTimes(2);

            done();
        })
        .catch((error) => {
            fail('Authentication should succeed!');
        });
});
test('HomeWizard-authentication-username-and-password-null', done => {
    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));
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
    const requestMock = Mocks.mockAuthenticationGetRequest();

    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));
    homeWizard.authenticate('dummy-username', 'dummy-password')
        .then((session) => {
            fail('Authentication should not succeed when the service is unreachable');
        })
        .catch((error) => {
            expect(error).not.toBeNull();
            expect(requestMock).toBeCalledTimes(3);

            done();
        });
});
test('HomeWizard-authentication-non-valid-credentials', done => {
    const requestMock = Mocks.mockAuthenticationGetRequest(0, true);

    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));
    homeWizard.authenticate('dummy-username', 'dummy-password')
        .then((session) => {
            fail('Authentication should not succeed when the username and password are bogus data');
        })
        .catch((error) => {
            expect(error).not.toBeNull();
            expect(requestMock).toBeCalledTimes(1);

            done();
        });
});


test('HomeWizard-getHubAndSwitchIdsByHubName-hub-with-5-switches', done => {
    const requestMock = Mocks.mockPlugsGetRequest(0);
    const session = {
        token: 'dummy-token',
        timestamp: Date.now()
    };

    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));
    homeWizard.getHubAndSwitchIdsByHubName(session, 'dummy-name')
        .then((switches) => {
            expect(switches).not.toBeNull();
            expect(switches.length).toEqual(5);
            expect(requestMock).toBeCalledTimes(1);

            done();
        })
        .catch((error) => {
            fail('Switches should be returned!');
        });
});
test('HomeWizard-getHubAndSwitchIdsByHubName-hub-with-5-switches-unreachable-first-time', done => {
    const requestMock = Mocks.mockPlugsGetRequest(1);
    const session = {
        token: 'dummy-token',
        timestamp: Date.now()
    };

    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));
    homeWizard.getHubAndSwitchIdsByHubName(session, 'dummy-name')
        .then((switches) => {
            expect(switches).not.toBeNull();
            expect(switches.length).toEqual(5);
            expect(requestMock).toBeCalledTimes(2);

            done();
        })
        .catch((error) => {
            fail('Switches should be returned!');
        });
});
test('HomeWizard-getHubAndSwitchIdsByHubName-unreachable', done => {
    const requestMock = Mocks.mockPlugsGetRequest();
    const session = {
        token: 'dummy-token',
        timestamp: Date.now()
    };

    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));
    homeWizard.getHubAndSwitchIdsByHubName(session, 'dummy-name')
        .then((switches) => {
            fail('getHubAndSwitchIdsByHubName should not return data when the service is unreachable');
        })
        .catch((error) => {
            expect(error).not.toBeNull();
            expect(requestMock).toBeCalledTimes(3);

            done();
        });
});


test('HomeWizard-setSwitchState-switch-found-successful', done => {
    const requestMock = Mocks.mockSwitchStatePostRequest(0, false);
    const session = {
        token: 'dummy-token',
        timestamp: Date.now()
    };

    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));
    homeWizard.setSwitchState(session, 'dummy-switchId', 'dummy-hubId', true)
        .then((result) => {
            expect(result).not.toBeNull();
            expect(result.status).toEqual('Success');
            expect(requestMock).toBeCalledTimes(1);

            done();
        })
        .catch((error) => {
            fail('setSwitchState should return a success message');
        });
});
test('HomeWizard-setSwitchState-switch-found-successful-unreachable-first-time', done => {
    const requestMock = Mocks.mockSwitchStatePostRequest(1);
    const session = {
        token: 'dummy-token',
        timestamp: Date.now()
    };

    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));
    homeWizard.setSwitchState(session, 'dummy-switchId', 'dummy-hubId', true)
        .then((result) => {
            expect(result).not.toBeNull();
            expect(result.status).toEqual('Success');
            expect(requestMock).toBeCalledTimes(2);

            done();
        })
        .catch((error) => {
            fail('setSwitchState should return a success message');
        });
});
test('HomeWizard-setSwitchState-unreachable-or-switch-not-found', done => {
    const requestMock = Mocks.mockSwitchStatePostRequest();
    const session = {
        token: 'dummy-token',
        timestamp: Date.now()
    };

    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));
    homeWizard.setSwitchState(session, 'dummt-switchId', 'dummy-hubId', true)
        .then((result) => {
            fail('setSwitchState should not return data when the service is unreachable');
        })
        .catch((error) => {
            expect(error).not.toBeNull();
            expect(requestMock).toBeCalledTimes(3);

            done();
        });
});
test('HomeWizard-setSwitchState-switch-found-not-successful', done => {
    const requestMock = Mocks.mockSwitchStatePostRequest(0, true);
    const session = {
        token: 'dummy-token',
        timestamp: Date.now()
    };

    const homeWizard = new HomeWizard(1000, 3, (message) => console.log(message));
    homeWizard.setSwitchState(session, 'dummy-switchId', 'dummy-hubId', true)
        .then((result) => {
            expect(result).not.toBeNull();
            expect(result).not.toEqual('Success');
            expect(requestMock).toBeCalledTimes(1);

            done();
        })
        .catch((error) => {
            fail('setSwitchState should return a failure message');
        });
});
