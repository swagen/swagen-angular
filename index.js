'use strict';

const modeMappings = {
    'ng1-typescript': 'ng1-typescript',
    'ng1-ts': 'ng1-typescript',
    'ng1-typescript-experimental': 'ng1-typescript-experimental'
};


function generate(definition, profile) {
    let mode = modeMappings[profile.mode || 'ng1-typescript'];
    let Generator = require(`./lib/${mode}`);
    let generator = new Generator(definition, profile);
    return generator.generate();
}

function validateProfile(profile) {
    let options = profile.options;
    if (!options) {
        throw `Specify an 'options' section in your profile.`;
    }
    if (!options.namespaces) {
        throw `Specify an 'options.namespaces' section in your profile.`;
    }
    if (!options.namespaces.services || !options.namespaces.models) {
        throw `Specify namespaces for services and models under the 'options.namespaces' section using keys 'services' and 'models'.`;
    }
}

module.exports = {
    modes: require('./lib/metadata'),
    generate: generate,
    validateProfile: validateProfile
};
