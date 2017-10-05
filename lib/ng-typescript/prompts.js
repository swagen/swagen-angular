'use strict';

module.exports = [{
    type: 'checkbox',
    name: 'generate',
    message: 'Select code to generate',
    choices: [
        { value: 'impls', name: 'Implementations', checked: true },
        { value: 'intfs', name: 'Interfaces', checked: false }
    ],
    default: ['impls'],
    validate: value => value.length > 0
},
{
    type: 'list',
    name: 'baseUrlStrategy',
    message: 'How should the base URL value be retrieved?',
    choices: [
        { value: 'importedVar', name: 'Use an imported value' },
        { value: 'property', name: 'Use a read-write property' },
        { value: 'injectedToken', name: 'Use an injected token', disabled: true },
        { value: 'swagger', name: 'Just use the URL from the swagger' }
    ],
    default: 'importedVar'
},
{
    when: answers => answers.baseUrlStrategy === 'importedVar',
    type: 'input',
    name: 'baseUrl_importedVar_from',
    message: 'Module to import the base URL variable from',
    default: 'environments/environment',
    validate: value => !!value
},
{
    when: answers => answers.baseUrlStrategy === 'importedVar',
    type: 'input',
    name: 'baseUrl_importedVar_variable',
    message: 'Name of the base URL variable to import',
    default: 'environment',
    validate: value => !!value
},
{
    when: answers => answers.baseUrlStrategy === 'importedVar',
    type: 'input',
    name: 'baseUrl_importedVar_property',
    message: 'Optional property path in the variable',
    default: 'baseUrl'
},
{
    when: answers => answers.baseUrlStrategy === 'property',
    type: 'input',
    name: 'baseUrl_property',
    message: 'Name of the property',
    default: 'baseUrl',
    validate: value => !!value
},
{
    type: 'confirm',
    name: 'customizations',
    message: 'Should the generated code be customizable?',
    default: false
},
{
    when: answers => answers.customizations,
    type: 'input',
    name: 'customizations_from',
    message: 'Module to import the customization variable from',
    validate: value => !!value
},
{
    when: answers => answers.customizations,
    type: 'input',
    name: 'customizations_variable',
    message: 'Name of the customization variable to import',
    validate: value => !!value
}];
