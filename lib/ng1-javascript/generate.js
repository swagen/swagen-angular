// @ts-check

'use strict';

const _ = require('lodash');

const codewriter = require('codewriter');

const DataTypes = require('./data-types');
const quotesTaggedTemplate = require('./quotes-tagged-template');
const quotes = quotesTaggedTemplate.quotes;

/**
 * @typedef {Object} Profile
 * @property {Options} options
 */

/**
 * @typedef {Object} Options
 * @property {String} module
 * @property {BaseUrl} baseUrl
 * @property {'single'|'double'} quotes
 * @property {Boolean} tsCheck
 * @property {Boolean} jsdocTypeInfo
 */

/**
 * @typedef {Object} BaseUrl
 * @property {String} provider
 * @property {String} path
 */

/**
 * Logic to generate output
 */
class Generator {
    /**
     * Instantiates the Generator class, which is used to generate the output
     * @param {*} definition
     * @param {Profile} profile
     */
    constructor(definition, profile) {
        this.definition = definition;
        this.profile = profile;
        this.options = profile.options;
        this.dataTypes = new DataTypes(definition, this.options.jsdocTypeInfo);

        const quotes = this.options.quotes || 'single';
        quotesTaggedTemplate.setExpectedQuote(quotes === 'single' ? `'` : `"`);
    }

    generate() {
        this.code = new codewriter.CodeWriter(codewriter.OptionsLibrary.javascript);
        this.generateInitialCode();
        this.code.blank();
        this.generateServices();
        this.code.blank();
        this.generateBuildServiceUrlMethod();
        this.code.blank();
        this.generateModels();
        return this.code.toCode();
    }

    generateInitialCode() {
        const tsCheck = !!this.options.tsCheck;
        this.code
            .line(`/* eslint-disable no-var,quotes,no-undef */`)
            .blank()
            .lineIf(tsCheck, `// @ts-check`)
            .blank(tsCheck)
            .line(quotes`'use strict';`);
    }

    generateServices() {
        const baseUrl = this.profile.options.baseUrl;
        // const baseUrlPath = baseUrl.path && baseUrl.path.length > 0 ? baseUrl.provider + '.' + baseUrl.path : baseUrl.provider;

        const serviceNames = _.keys(this.definition.services).sort();
        serviceNames.forEach((serviceName, index) => {
            const service = this.definition.services[serviceName];
            this.code
                .blank(index > 0)
                .line(quotes`angular.module('${this.options.module}').service('${serviceName}',`).indent()
                    .startBlock(quotes`['$http', '${baseUrl.provider}', function($http, ${baseUrl.provider})`)
                        .iterate(service, this.generateOperations.bind(this))
                    .endBlock(`}]`)
                .unindent(`);`);
        });
    }

    generateOperations(code, operation, operationName, index) {
        const baseUrl = this.profile.options.baseUrl;
        const baseUrlPath = baseUrl.path && baseUrl.path.length > 0 ? baseUrl.provider + '.' + baseUrl.path : baseUrl.provider;

        const requiredParams = (operation.parameters || []).filter(p => !!p.required);
        const queryParams = (operation.parameters || []).filter(p => p.type === 'query');
        const pathParams = (operation.parameters || []).filter(p => p.type === 'path');
        const bodyParam = (operation.parameters || []).find(p => p.type === 'body');
        const formDataParams = (operation.parameters || []).filter(p => p.type === 'formData');

        code.blank(index > 0)
            .docComment(...this.buildOperationDocComments(operation))
            .startBlock(this.getMethodSignature(operationName, operation))
                // Check require parameters
                .repeat(requiredParams, (cw, requiredParam) => {
                    cw.startBlock(`if (${requiredParam.name} == undefined || ${requiredParam.name} == null)`)
                            .line(quotes`throw new Error('The parameter ${requiredParam.name} must be defined.');`)
                        .endBlock();
                })
                .blank(requiredParams.length > 0)

                //Build the path params
                .if(pathParams.length > 0)
                    .startBlock(`var pathParams =`)
                        .repeat(pathParams, (cw, pathParam, i) => {
                            cw.inline(`,`, i > 0)
                                .inline(`${pathParam.name}: ${pathParam.name}`)
                                .done();
                        })
                    .endBlock(`};`)
                .endIf()
                .blank(pathParams.length > 0)

                //Build the query string
                .if(queryParams.length > 0)
                    .startBlock(`var queryParams =`)
                        .repeat(queryParams, (cw, queryParam, i, arr) => {
                            cw.inline(`${queryParam.name}: ${queryParam.name}`)
                                .inline(`,`, i < arr.length - 1)
                                .done();
                        })
                    .endBlock(`};`)
                .endIf()
                .blank(queryParams.length > 0)

                // Build form data content
                .if(formDataParams.length > 0)
                    .line(`const formData = new FormData();`)
                    .repeat(formDataParams, (cw, formDataParam) => {
                        const paramName = formDataParam.name;
                        cw.startBlock(`if (${paramName} != null && ${paramName} != undefined)`)
                                .line(quotes`formData.append('${paramName}', ${paramName});`)
                            .endBlock();
                    })
                .endIf()
                .blank(formDataParams.length > 0)

                .line(`return $http({`).indent()
                    .line(quotes`method: '${operation.verb.toUpperCase()}',`)
                    .if(!!bodyParam)
                        .line(`data: ${(bodyParam || {}).name},`)
                    .endIf()
                    .if(formDataParams.length > 0)
                        .line(`data: formData,`)
                        .line(`transformRequest: angular.identity,`)
                    .endIf()
                    .inline(quotes`url: buildServiceUrl(${baseUrlPath}, '${operation.path}'`)
                        .inline(`, undefined`, pathParams.length === 0)
                        .inline(`, pathParams`, pathParams.length > 0)
                        .inline(`, undefined`, queryParams.length === 0)
                        .inline(`, queryParams`, queryParams.length > 0)
                        .inline(`)`)
                        .done()
                .unindent(`});`)

            .endBlock(`};`);
    }

    buildOperationDocComments(operation) {
        const comments = [];
        if (operation.description) {
            comments.push(operation.description);
        }
        if (operation.description2) {
            comments.push(operation.description2);
        }
        const describedParams = (operation.parameters || []).filter(p => !!p.description);
        for (const describedParam of describedParams) {
            const dataType = this.dataTypes.getDataType(describedParam.dataType);
            comments.push(`@param {${dataType}} ${describedParam.name} - ${describedParam.description}`);
        }
        comments.push(`@returns {Promise<${this.dataTypes.getReturnType(operation)}>}`);
        return comments;
    }

    getMethodSignature(operationName, operation) {
        const orderedParams = (operation.parameters || []).filter(p => p.required).concat(
            (operation.parameters || []).filter(p => !p.required)
        );
        const parameters = orderedParams.reduce((accumulate, parameter, index) => {
            if (index > 0) {
                accumulate += `, `;
            }
            accumulate += parameter.name;
            return accumulate;
        }, ``);

        const methodSig = `this.${operationName} = function(${parameters})`;
        return methodSig;
    }

    generateBuildServiceUrlMethod() {
        this.code
            .startBlock(`function buildServiceUrl(baseUrl, resourceUrl, pathParams, queryParams)`)
                .line(`var url = baseUrl;`)
                .line(quotes`var baseUrlSlash = url[url.length - 1] === '/';`)
                .blank()

                .startBlock(`if (pathParams)`)
                    .startBlock(`for (var pp in pathParams)`)
                        .startBlock(`if (pathParams.hasOwnProperty(pp))`)
                            .line(quotes`resourceUrl = resourceUrl.replace('{' + pp + '}', encodeURIComponent('' + pathParams[pp]));`)
                        .endBlock()
                    .endBlock()
                .endBlock()
                .line(quotes`var resourceUrlSlash = resourceUrl && resourceUrl[0] === '/';`)
                .blank()

                .startBlock(`if (!baseUrlSlash && !resourceUrlSlash)`)
                    .line(quotes`url += '/';`)
                .unindent(`} else if (baseUrlSlash && resourceUrlSlash) {`)
                .indent()
                    .line(`url = url.substr(0, url.length - 1);`)
                .endBlock()
                .line(`url += resourceUrl;`)
                .blank()

                .startBlock(`if (!queryParams)`)
                    .line(`return url;`)
                .endBlock()
                .blank()

                .line(quotes`var queryString = '';`)
                .startBlock(`for (var qp in queryParams)`)
                    .startBlock(`if (queryParams.hasOwnProperty(qp))`)
                        .startBlock(`if (queryString.length > 0)`)
                            .line(quotes`queryString += '&';`)
                        .endBlock()
                        .line(`queryString += qp;`)
                        .startBlock(`if (queryParams[qp])`)
                            .line(quotes`queryString += '=' + encodeURIComponent('' + queryParams[qp]);`)
                        .endBlock()
                    .endBlock()
                .endBlock()
                .line(quotes`return queryString ? url + '?' + queryString : url;`)
            .endBlock();
    }

    generateModels() {
        const modelNames = _.keys(this.definition.models).sort((x, y) => x.toLowerCase().localeCompare(y.toLowerCase()));

        this.code
            .repeat(modelNames, (code, modelName, index) => {
                const model = this.definition.models[modelName];
                const properties = Object.keys(model).map(propertyName => {
                    const property = model[propertyName];
                    const dataType = this.dataTypes.getDataType(property);
                    return `@property {${dataType}} ${propertyName}`;
                });
                properties.unshift(`@typedef {Object} ${modelName}`);
                code.blank(index > 0)
                    .docComment(...properties);
            });
    }
}

module.exports = (definition, profile) => {
    const generator = new Generator(definition, profile);
    return generator.generate();
};
