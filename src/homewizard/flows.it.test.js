const HomeWizard = require("./homewizard").HomeWizard;
const Flows = require("./flows").Flows;

const request = require('request-promise-native');

beforeEach(() => {
    console.log('resetting modules!');
    jest.resetModules();
    jest.setTimeout(10000);
});

test('Flows-authenticationFlow-not-preauthenticated', done => {
    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    //TODO: Mock HomeWizard API!

    flows.authenticationFlow()
        .then(() => {
            expect(flows.session).not.toBeUndefined();
            expect(flows.session).not.toBeNull();

            done();
        });
});

test('Flows-authenticationFlow-preauthenticated', done => {
    const logger = (message) => console.log(message);
    const homeWizard = new HomeWizard(logger);
    const flows = new Flows(homeWizard, logger, 'dummy-username', 'dummy-password');

    //TODO: Mock HomeWizard API!

    flows.session = {
        token: '',
        timestamp: Date.now()
    };

    flows.authenticationFlow()
        .then(() => {
            expect(flows.session).not.toBeUndefined();
            expect(flows.session).not.toBeNull();

            done();
        });
});

//TODO: Implement more tests!