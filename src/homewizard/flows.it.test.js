const HomeWizard = require("./homewizard").HomeWizard;
const Flows = require("./flows").Flows;
const RequestMocking = require("./mocking/request-mocking").RequestMocking;

const Mocks = new RequestMocking();

beforeEach(() => {
    console.log('resetting modules!');
    jest.resetModules();
    jest.resetAllMocks();
    jest.setTimeout(10000);
});

test('Flows-authenticationFlow-not-preauthenticated', done => {
    const requestMock = Mocks.mockAuthenticationGetRequest(1);

    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    flows.authenticationFlow()
        .then(() => {
            expect(flows.session).not.toBeUndefined();
            expect(flows.session).not.toBeNull();

            expect(requestMock).toBeCalledTimes(2);

            done();
        });
});
test('Flows-authenticationFlow-preauthenticated', done => {
    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    flows.session = {
        token: 'dummy-session-token',
        timestamp: Date.now()
    };

    flows.authenticationFlow()
        .then(() => {
            expect(flows.session).not.toBeUndefined();
            expect(flows.session).not.toBeNull();

            done();
        });
});
test('Flows-authenticationFlow-authenticate-unreachable', done => {
    const requestMock = Mocks.mockAuthenticationGetRequest();

    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    flows.authenticationFlow()
        .then(() => {
            fail('When authentication is impossible a reject should occur!');
        })
        .catch((error) => {
            expect(error).not.toBeUndefined();
            expect(error).not.toBeNull();

            expect(requestMock).toBeCalledTimes(3);

            done();
        })
});


test('Flows-processSwitchesFlow-not-preauthenticated', done => {
    const requestMock = Mocks.mockAuthenticationAndPlugsGetRequests(1, false);

    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    flows.processSwitchesFlow('dummy-name')
        .then(() => {
            expect(flows.session).not.toBeUndefined();
            expect(flows.session).not.toBeNull();
            expect(flows.switches).not.toBeUndefined();
            expect(flows.switches).not.toBeNull();
            expect(flows.switches.length).toEqual(5);

            expect(requestMock).toBeCalledTimes(4);

            done();
        });
});
test('Flows-processSwitchesFlow-preauthenticated', done => {
    const requestMock = Mocks.mockPlugsGetRequest(1);

    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    flows.session = {
        token: 'dummy-session-token',
        timestamp: Date.now()
    };

    flows.processSwitchesFlow('dummy-name')
        .then(() => {
            expect(flows.switches).not.toBeUndefined();
            expect(flows.switches).not.toBeNull();
            expect(flows.switches.length).toEqual(5);

            expect(requestMock).toBeCalledTimes(2);

            done();
        });
});
test('Flows-processSwitchesFlow-authenticate-unreachable', done => {
    const requestMock = Mocks.mockAuthenticationAndPlugsGetRequests(1, false, 1);

    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    flows.processSwitchesFlow('dummy-name')
        .then(() => {
            fail('When authentication is impossible a reject should occur!');
        })
        .catch((error) => {
            expect(error).not.toBeUndefined();
            expect(error).not.toBeNull();

            expect(requestMock).toBeCalledTimes(3);

            done();
        })
});
test('Flows-processSwitchesFlow-getHubAndSwitchIdsByHubName-unreachable', done => {
    const requestMock = Mocks.mockAuthenticationAndPlugsGetRequests(1, false, 2);

    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    flows.processSwitchesFlow('dummy-name')
        .then(() => {
            fail('When switch retrieval is impossible a reject should occur!');
        })
        .catch((error) => {
            expect(error).not.toBeUndefined();
            expect(error).not.toBeNull();

            expect(requestMock).toBeCalledTimes(5);

            done();
        })
});


test('Flows-setSwitchStateFlow-not-preauthenticated', done => {
    const authRequestMock = Mocks.mockAuthenticationGetRequest(1);
    const switchStateMock = Mocks.mockSwitchStatePostRequest(1);

    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    flows.setSwitchStateFlow('test-switch-id1', 'test-hub-id', true)
        .then((result) => {
            expect(result).not.toBeUndefined();
            expect(result).not.toBeNull();
            expect(result).toEqual(true);

            expect(authRequestMock).toBeCalledTimes(2);
            expect(switchStateMock).toBeCalledTimes(2);

            done();
        })
        .catch((error) => {
            fail('No reject should occur!');
        });
});
test('Flows-setSwitchStateFlow-preauthenticated', done => {
    const requestMock = Mocks.mockSwitchStatePostRequest(1);

    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    flows.session = {
        token: 'dummy-session-token',
        timestamp: Date.now()
    };

    flows.setSwitchStateFlow('test-switch-id1', 'test-hub-id', true)
        .then((result) => {
            expect(result).not.toBeUndefined();
            expect(result).not.toBeNull();
            expect(result).toEqual(true);

            expect(requestMock).toBeCalledTimes(2);

            done();
        })
        .catch((error) => {
            fail('No reject should occur!');
        });
});
test('Flows-setSwitchStateFlow-unsuccessful-state', done => {
    const authRequestMock = Mocks.mockAuthenticationGetRequest(1);
    const switchStateMock = Mocks.mockSwitchStatePostRequest(1, true);

    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    flows.setSwitchStateFlow('test-switch-id1', 'test-hub-id', true)
        .then((result) => {
            fail('No resolve should occur!');
        })
        .catch((error) => {
            expect(error).not.toBeUndefined();
            expect(error).not.toBeNull();

            expect(authRequestMock).toBeCalledTimes(2);
            expect(switchStateMock).toBeCalledTimes(2);

            done();
        });
});
test('Flows-setSwitchStateFlow-authenticate-unreachable', done => {
    const authRequestMock = Mocks.mockAuthenticationGetRequest();
    const switchStateMock = Mocks.mockSwitchStatePostRequest(1);

    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    flows.setSwitchStateFlow('test-switch-id1', 'test-hub-id', true)
        .then((result) => {
            fail('No resolve should occur!');
        })
        .catch((error) => {
            expect(error).not.toBeUndefined();
            expect(error).not.toBeNull();

            expect(authRequestMock).toBeCalledTimes(3);
            expect(switchStateMock).toBeCalledTimes(0);

            done();
        });
});
test('Flows-setSwitchStateFlow-setSwitchState-unreachable', done => {
    const authRequestMock = Mocks.mockAuthenticationGetRequest(1);
    const switchStateMock = Mocks.mockSwitchStatePostRequest();

    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    flows.setSwitchStateFlow('test-switch-id1', 'test-hub-id', true)
        .then((result) => {
            fail('No resolve should occur!');
        })
        .catch((error) => {
            expect(error).not.toBeUndefined();
            expect(error).not.toBeNull();

            expect(authRequestMock).toBeCalledTimes(2);
            expect(switchStateMock).toBeCalledTimes(3);

            done();
        });
});