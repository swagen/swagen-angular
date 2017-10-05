const prompts = require('./prompts');
const buildProfile = require('./build-profile');
const validateProfile = require('./validate-profile');
const generate = require('./generate');

module.exports = {
    name: 'ng1-typescript',
    description: 'Typescript client for AngularJS 1.x using the $http service.',
    language: 'typescript',
    extension: 'ts',
    prompts,
    buildProfile,
    validateProfile,
    generate
};
