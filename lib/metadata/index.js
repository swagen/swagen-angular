const prompts = require('./prompts');
const configBuilderFn = require('./config-builder');

module.exports = [{
    name: 'ng-typescript',
    description: 'Typescript client for Angular 2+.',
    language: 'typescript',
    extension: 'ts',
    prompts: prompts.ng,
    configBuilderFn: configBuilderFn.ng
},
{
    name: 'ng1-typescript',
    description: 'Typescript client for AngularJS 1.x using the $http service.',
    language: 'typescript',
    extension: 'ts',
    prompts: prompts.ng1,
    configBuilderFn: configBuilderFn.ng1
},
{
    name: 'ng1-typescript-experimental',
    description: 'Typescript client for AngularJS 1.x using the $http service (experimental).',
    language: 'typescript',
    extension: 'ts',
    prompts: prompts.ng1,
    configBuilderFn: configBuilderFn.ng1
}];
