const prompts = require('./prompts');
const buildProfile = require('./build-config');
const validateProfile = require('./validate-profile');
const generate = require('./generate');

module.exports = {
    name: 'ng-typescript',
    description: 'Typescript client for Angular 2+.',
    language: 'typescript',
    extension: 'ts',
    prompts,
    defaultTransforms: {
        serviceName: ['pascal-case'],
        operationName: ['camel-case'],
        parameterName: ['camel-case'],
        modelName: ['pascal-case'],
        propertyName: ['camel-case']
    },
    buildProfile,
    validateProfile,
    generate
};
