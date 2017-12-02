'use strict';

const fs = require('fs');

const modeName = 'ng1-javascript';

const definition = require('./definition.json');
const profiles = require('./profile.json');
const profile = profiles[modeName];

const selectedMode = require('../lib/' + modeName);

if (typeof selectedMode.validateProfile === 'function') {
    selectedMode.validateProfile(profile);
}
const code = selectedMode.generate(definition, profile);
fs.writeFileSync(`./test-harness/output.${selectedMode.extension}`, code, 'utf8');
