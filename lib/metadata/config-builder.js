const _ = require('lodash');

module.exports = {
    ng: (options, answers) => {
        options.generation = {
            generateInterfaces: answers.generate.some(g => g === 'intfs'),
            generateImplementations: answers.generate.some(g => g === 'impls')
        };
        options.baseUrl = {
            strategy: _.upperFirst(answers.baseUrlStrategy), // ImportedVar | Property | InjectedToken | Swagger
            overrideUrl: undefined
        };
        if (answers.baseUrlStrategy === 'importedVar') {
            options.baseUrl.importedVar = {
                importFrom: answers.baseUrl_importedVar_from,
                importVariable: answers.baseUrl_importedVar_variable,
                property: answers.baseUrl_importedVar_property
            };
        }
        if (answers.baseUrlStrategy === 'property') {
            options.baseUrl.property = answers.baseUrl_property;
        }
        options.angular = {
            tokenType: 'InjectedToken', // InjectedToken | OpaqueToken
            httpFramework: 'HttpClient', // HttpClient | Http | Fetch
            futuresType: 'Observables' // Observables | Promises | PromisesWithAsync
        };
        if (answers.customizations) {
            options.customization = {
                importFrom: answers.customizations_from,
                importVariable: answers.customizations_variable
            };
        }
    },
    ng1: (options, answers) => {
        options.moduleName = answers.module;
        options.baseUrl = {
            type: answers.baseUrlType,
            provider: answers.baseUrlProvider,
            path: answers.baseUrlPath
        };
        options.namespaces = {
            services: answers.servicesns,
            models: answers.modelsns
        };
        options.references = [];
    }
};
