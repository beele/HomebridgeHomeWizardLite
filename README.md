#HOMEBRIDGE HOMEWIZARD LITE

This Homebridge plugin allow the control of HomeWizard Lite switches (also known as flamingo switches).

To install this plugin simple type `npm install homebridge-homewizard-flamingo -g`.
Next open the config.json that contains your Homebridge configuration and add a block like the following one to the accessories array:

```javascript
{
    "accessory": "HomebridgeHomeWizardLite",
    "name": "display-name",
    "room": "room-name";
    "username": "user@domain.tld",
    "password": "password",
    "hub": "test-hub-name",
    "switch": "test-switch-name"
}```

The accessory name has to be `HomebridgeHomeWizardLite` to link to the plugin.
The `name` and `room` fields are for the display name and room name inside of the HomeKit app.
The `username` and `password` fields are your HomeWizard login credentials.
The `hub` and `switch` fields are the names given in the HomeWizard app to the hub and specific switch.

For now it is only possible to add a single accessory for the plugin, however you can add multiple blocks, one for each switch.
A future version of this plugin will change this so all switches under the given hub are available.

Because these switches do not report their current on/off state it is important that they are in the off state when you start to use them with the HomeKit app.
All of/off state is kept in the Homebridge plugin.

Tested with:

- Flamingo SF-501SHCFR - Smart switch
  <br/>![Smart switch](resources/img/smart-switch.jpg?raw=true "Smart switch")
- Flamingo SF-501FR - Switch set with remote control
  <br/>![Switch set](resources/img/switch-set.jpg?raw=true "Switch set")
