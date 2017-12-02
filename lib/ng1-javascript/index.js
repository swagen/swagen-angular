const prompts = require('./prompts');
const buildProfile = require('./build-profile');
const validateProfile = require('./validate-profile');
const generate = require('./generate');

module.exports = {
    name: 'ng1-javascript',
    description: 'Javascript (ES5) client for AngularJS 1.x using the $http service.',
    language: 'javascript',
    extension: 'js',
    prompts,
    defaultTransforms: {
        serviceName: ['camel-case'],
        operationName: ['camel-case'],
        parameterName: ['camel-case'],
        modelName: ['pascal-case'],
        propertyName: ['camel-case']
    },
    buildProfile,
    validateProfile,
    generate
};
