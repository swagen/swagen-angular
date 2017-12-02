'use strict';

//TODO: Additional options
// * Factory or service

module.exports = [
    {
        type: 'input',
        name: 'module',
        message: 'AngularJS module to register services under',
        validate: value => !!value
    },
    {
        type: 'input',
        name: 'baseUrlProvider',
        message: 'Injectable name of the service used to retrieve the base URL',
        validate: value => !!value
    },
    {
        type: 'input',
        name: 'baseUrlPath',
        message: 'Member name of the base URL value in the service',
        default: 'baseUrl'
    },
    {
        type: 'choice',
        name: 'quotes',
        message: 'How are literal strings quoted?',
        choices: [
            { name: 'Single', value: 'single' },
            { name: 'Double', value: 'double' }
        ],
        default: 'single'
    },
    {
        type: 'confirm',
        name: 'tsCheck',
        message: 'Enable Typescript checking by adding a @ts-check comment?',
        default: false
    },
    {
        type: 'confirm',
        name: 'jsdocTypeInfo',
        message: 'Generate detailed type information for models using JSDoc typedef comments',
        default: true
    }
];
