#HOMEBRIDGE HOMEWIZARD LITE

[![Build Status](https://travis-ci.com/beele/HomebridgeHomeWizardLite.svg?branch=master)](https://travis-ci.com/beele/HomebridgeHomeWizardLite)

This Homebridge plugin allow the control of HomeWizard Lite switches (also known as flamingo switches).

To install this plugin simple type `sudo npm install homebridge-homewizard-flamingo -g --unsafe-perm=true`.
Next open the config.json that contains your Homebridge configuration and add a block like the following one to the accessories array:

```javascript
{
    "platform": "HomeWizard-Lite",
    "name": "display-name",
    "room": "room-name",
    "username": "user@domain.tld",
    "password": "password",
    "hub": "test-hub-name"
}
```

The platform name has to be `HomeWizard-Lite` to link to the plugin.
The `name` and `room` fields are for the display name and room name inside of the HomeKit app.
The `username` and `password` fields are your HomeWizard login credentials.
The `hub` field is the name given in the HomeWizard app to the hub.

All the switches under the hub are automatically enumerated and added as accessories.
Each switch will be available as a separate accessory in the Home app.

Because these switches do not report their current on/off state it is important that they are in the off state when you start to use them with the HomeKit app.
All on/off state is kept in the Homebridge plugin.
Adding or removing switches after the initial setup is currently not supported! 

Tested with:

- Flamingo SF-501SHCFR - Smart switch
  <br/>![Smart switch](resources/img/smart-switch.jpg?raw=true "Smart switch")
- Flamingo SF-501FR - Switch set with remote control
  <br/>![Switch set](resources/img/switch-set.jpg?raw=true "Switch set")
