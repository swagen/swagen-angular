module.exports = function(options, answers, generalAnswers) {
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
};
