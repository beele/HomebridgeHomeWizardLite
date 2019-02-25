module.exports.Flows = function (homeWizard, logger, username, password) {
    const me = this;

    me.homeWizard = homeWizard;
    me.log = logger;

    me.username = username;
    me.password = password;

    me.session = null;
    me.switches = [];

    me.authenticationFlow = function () {
        return me.homeWizard.isSessionStillValid(me.session)
            .catch((reason) => {
                return me.homeWizard.authenticate(me.username, me.password);
            })
            .then((session) => {
                me.session = session;
                return Promise.resolve();
            })
            .catch((error) => {
                me.log('Authentication failed: ' + JSON.stringify(error, null, 4));
                return Promise.reject('Authentication failed: ' + error);
            });
    };

    me.processSwitchesFlow = function (hub) {
        return me.authenticationFlow()
            .then(() => {
                return me.homeWizard.getHubAndSwitchIdsByHubName(me.session, hub);
            })
            .then((switches) => {
                switches.forEach(sw => {
                    me.log('Adding switch: ' + sw.name + ' :' + sw.id);
                    me.switches.push(sw);
                });
                me.log('Switches retrieved!');
                return Promise.resolve(me.switches);
            })
            .catch((error) => {
                me.session = null;
                me.switches = [];
                me.log('ERROR: hub and switch ids could not be fetched, details: ' + error);
                return Promise.resolve(me.switches);
            });
    };

    me.setSwitchStateFlow = function (switchId, hubId, value) {
        return me.authenticationFlow()
            .then(() => {
                return me.homeWizard.setSwitchState(me.session, switchId, hubId, value);
            })
            .then((result) => {
                if(result.status === 'Success') {
                    return Promise.resolve(value);
                } else {
                    me.log('Switch ' + switchId + ' state could not be set!');
                    return Promise.reject('Switch ' + switchId + ' state could not be set!');
                }
            })
            .catch((error) => {
                me.log('Switch ' + switchId + ' state could not be set!');
                return Promise.reject('Switch ' + switchId + ' state could not be set!');
            });
    };
};