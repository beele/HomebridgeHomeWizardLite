const HomeWizard = require("./homewizard").HomeWizard;

const request = require('request-promise-native');

beforeEach(() => {
    console.log('resetting modules!');
    jest.resetModules();
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
    const requestMock = mockGetRequestReject();

    const homeWizard = new HomeWizard((message) => console.log(message));
    homeWizard.authenticate('dummy-username', 'dummy-password')
        .then((session) => {
            fail('Authentication should not succeed when the service is unreachable');
        })
        .catch((error) => {
            expect(error).not.toBeNull();
            done();
        });
});

test('HomeWizard-authentication-non-valid-credentials', done => {
    const requestMock = mockGetRequestResolve(true);

    const homeWizard = new HomeWizard((message) => console.log(message));
    homeWizard.authenticate('dummy-username', 'dummy-password')
        .then((session) => {
            fail('Authentication should not succeed when the username and password are bogus data');
        })
        .catch((error) => {
            expect(error).not.toBeNull();
            done();
        });
});

//TODO: Find out why this test works when ran as a single test but fails when ran as part of the suite!
test('HomeWizard-authentication-username-and-password-valid', done => {
    const requestMock = mockGetRequestResolve(false);

    const homeWizard = new HomeWizard((message) => console.log(message));
    homeWizard.authenticate('valid@example.com', 'validPassword')
        .then((session) => {
            console.log(session);

            expect(session).not.toBeNull();
            expect(session.token).not.toBeNull();
            expect(session.timestamp).not.toBeNull();

            expect(requestMock).toHaveBeenCalledTimes(1);

            done();
        })
        .catch((error) => {
            fail('Authentication should succeed!');
        });
});

//Mock request call to HomeWizard API
function mockGetRequestReject() {
    const mock = jest.spyOn(request, 'get');
    mock.mockImplementation((opts) => {
        return Promise.reject('dummy-fail');
    });
    return mock;
}

function mockGetRequestResolve(responseContainsError) {
    const mock = jest.spyOn(request, 'get');
    mock.mockImplementation((opts) => {
        if (responseContainsError) {
            return Promise.resolve({error: 110, message: 'dummy-fail'});
        } else {
            return Promise.resolve({session: 'dummy-session-token'});
        }
    });
    return mock;
}