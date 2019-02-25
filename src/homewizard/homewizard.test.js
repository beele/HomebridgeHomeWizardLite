const HomeWizard = require("./homewizard").HomeWizard;
const RequestMocking = require("./mocking/request-mocking").RequestMocking;

const Mocks = new RequestMocking();

beforeEach(() => {
    console.log('resetting modules!');
    jest.resetModules();
    jest.setTimeout(10000);
});

test('HomeWizard-authentication-username-and-password-valid', done => {
    const requestMock = Mocks.mockAuthenticationGetRequestResolve(false);

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
    const requestMock = Mocks.mockAuthenticationGetRequestReject(1);

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
    const requestMock = Mocks.mockAuthenticationGetRequestReject();

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
    const requestMock = Mocks.mockAuthenticationGetRequestResolve(true);

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
    const requestMock = Mocks.mockPlugsGetRequestResolve();
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
    const requestMock = Mocks.mockPlugsGetRequestReject(1);
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
    const requestMock = Mocks.mockPlugsGetRequestReject();
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
    const requestMock = Mocks.mockSwitchStatePostRequestResolve(false);
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
    const requestMock = Mocks.mockSwitchStatePostRequestReject(1);
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
    const requestMock = Mocks.mockSwitchStatePostRequestReject();
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
    const requestMock = Mocks.mockSwitchStatePostRequestResolve(true);
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
