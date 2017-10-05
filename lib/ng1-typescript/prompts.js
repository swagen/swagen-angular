'use strict';

const _ = require('lodash');

module.exports = [{
    type: 'input',
    name: 'module',
    message: 'AngularJS module to register services under',
    validate: value => !!value
},
{
    type: 'input',
    name: 'servicesns',
    message: 'Services namespace',
    validate: value => !!value
},
{
    type: 'input',
    name: 'modelsns',
    message: 'Models namespace',
    default: answers => answers.servicesns,
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
    name: 'baseUrlType',
    message: 'Typescript type of the service used to retrieve the base URL',
    default: answers => _.upperFirst(_.camelCase(answers.baseUrlProvider)),
    validate: value => !!value
},
{
    type: 'input',
    name: 'baseUrlPath',
    message: 'Member name of the base URL value in the service',
    default: 'baseUrl',
    validate: value => !!value,
    transform: value => value.split('.')
}];
