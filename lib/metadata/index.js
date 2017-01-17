const prompts = require('./prompts');
const configBuilderFn = require('./config-builder');

module.exports = [
    {
        name: 'ng1-typescript',
        description: 'Typescript client for Angular 1.x using the $http service.',
        language: 'typescript',
        extension: 'ts',
        prompts: prompts,
        configBuilderFn: configBuilderFn
    },
    {
        name: 'ng1-typescript-experimental',
        description: 'Typescript client for Angular 1.x using the $http service (experimental).',
        language: 'typescript',
        extension: 'ts',
        prompts: prompts,
        configBuilderFn: configBuilderFn
    }
];
