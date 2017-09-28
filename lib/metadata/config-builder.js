module.exports = {
    ng: (options, answers) => {
        options.baseUrlToken = answers.baseUrlToken;
        options.generateInterfaces = answers.generateInterfaces;
        options.serviceClassSuffix = answers.serviceClassSuffix;
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
