'use strict';

const fs = require('fs');

const definition = require('./definition.json');
const profile = require('./profile.json');
const generator = require('../lib/ng-typescript');

const code = generator.generate(definition, profile);
fs.writeFileSync(`./test-harness/output.${generator.extension}`, code, 'utf8');
