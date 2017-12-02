'use strict';

module.exports = (options, answers) => {
    options.module = answers.module;
    options.baseUrl = {
        provider: answers.baseUrlProvider,
        path: answers.baseUrlPath
    };
    options.quotes = answers.quotes;
    options.tsCheck = answers.tsCheck;
    options.jsdocTypeInfo = answers.jsdocTypeInfo;
};
