const HomeWizard = require("./homewizard").HomeWizard;
const Flows = require("./flows").Flows;
const RequestMocking = require("./mocking/request-mocking").RequestMocking;

const Mocks = new RequestMocking();

beforeEach(() => {
    console.log('resetting modules!');
    jest.resetModules();
    jest.setTimeout(10000);
});

test('Flows-authenticationFlow-not-preauthenticated', done => {
    const requestMock = Mocks.mockAuthenticationGetRequestReject(1);

    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    flows.authenticationFlow()
        .then(() => {
            expect(flows.session).not.toBeUndefined();
            expect(flows.session).not.toBeNull();

            requestMock.mockReset();
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
test('Flows-authenticationFlow-unreachable', done => {
    const requestMock = Mocks.mockAuthenticationGetRequestReject();

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

            requestMock.mockReset();
            done();
        })
});


test('Flows-processSwitchesFlow-not-preauthenticated', done => {
    const authRequestMock = Mocks.mockAuthenticationGetRequestReject(1);
    const switchesRequestMock = Mocks.mockPlugsGetRequestReject(1);

    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    flows.processSwitchesFlow('dummy-name')
        .then(() => {
            expect(flows.switches).not.toBeUndefined();
            expect(flows.switches).not.toBeNull();
            expect(flows.switches.length).toEqual(5);

            authRequestMock.mockReset();
            switchesRequestMock.mockReset();
            done();
        });
});

//TODO: Implement more tests!
