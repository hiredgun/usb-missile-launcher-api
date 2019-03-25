const express = require('express');
const app = express();
const HID = require('node-hid');
const debug = require('debug')('MISSILE:API');
const parseUrl = require('parseurl');
const cors = require('cors');

const PORT = 3000;
const DEVICE_NAME = 'USB Missile Launcher';

let launcher;

const devices = HID.devices();

if (devices) {
    const device = devices.find(({ product }) => product.includes(DEVICE_NAME));
    if (device && device.path) {
        launcher = device.path;
    } else {
        debug(`Could not find ${DEVICE_NAME}`);
        process.exit(1);
    }
}

let WORKING = false;
const STEPS = 50;

const device = new HID.HID(launcher);

const actions = {
    down: [0x02, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    up: [0x02, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    left: [0x02, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    right: [0x02, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    fire: [0x02, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    stop: [0x02, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
};

function triggerAction(action) {
    if (WORKING || !actions[action]) return;
    WORKING = true;

    device.write(actions[action]);
    debug(action.toUpperCase());

    if (action === 'fire') {
        WORKING = false;
        return;
    }
    setTimeout(function() {
        device.write(actions.stop);
        WORKING = false;
    }, STEPS);
}

app.get(/^\/(left|right|up|down|fire)$/, cors(), (req, res) => {
    const action = parseUrl(req).pathname.substring(1);
    triggerAction(action);
    res.send();
});

app.listen(PORT, () => debug(`Listening on port ${PORT}!`));
