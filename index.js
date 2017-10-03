'use strict';

const modeMappings = {
    'ng1-typescript': 'ng1-typescript',
    'ng1-ts': 'ng1-typescript',
    'ng1-typescript-experimental': 'ng1-typescript-experimental',
    'ng-typescript': 'ng-typescript',
    'ng-ts': 'ng-typescript',
};

function generate(definition, profile) {
    const mode = modeMappings[profile.mode || 'ng-typescript'];
    const Generator = require(`./lib/${mode}`);
    const generator = new Generator(definition, profile);
    return generator.generate();
}

function validateProfile(profile) {
    const mode = modeMappings[profile.mode || 'ng-typescript'];
    const validator = require(`./lib/${mode}/validator`);
    if (typeof validator === 'function') {
        validator(profile.options);
    }
}

module.exports = {
    modes: require('./lib/metadata'),
    generate,
    validateProfile
};
