'use strict';

const os = require('os');

const _ = require('lodash');

const ts = require('swagen-typescript-language');

class Generator {
    constructor(definition, profile) {
        this.definition = definition;
        this.profile = profile;
    }

    generate() {
        this.code = [];
        this.generateInitialCode();
        this.code.push('');
        this.generateInterfaces();
        this.code.push('');
        this.generateImplementations();
        this.code.push('');
        this.generateModels();
        return this.code.join(os.EOL);
    }

    generateInitialCode() {
        this.code.push(...ts.buildHeader(this.profile, this.definition));

        this.code.push('');

        for (let i = 0; i < (this.profile.options.references || []).length; i++) {
            this.code.push(`/// <reference path="${this.profile.options.references[i]}" />`);
        }
    }

    generateInterfaces() {
        this.code.push(
            `namespace ${this.profile.options.namespaces.services} {`,
            `    import __models = ${this.profile.options.namespaces.models};`,
            ``
        );
        const sortedKeys = _.keys(this.definition.services).sort();
        for (let i = 0; i < sortedKeys.length; i++) {
            const serviceName = sortedKeys[i];
            const service = this.definition.services[serviceName];
            const transformedServiceName = this.transform.serviceName(serviceName, {
                service: service
            }) + (this.profile.options.serviceSuffix || 'Client');
            this.code.push(
                `    export interface I${transformedServiceName} {`
            );
            for (const operationName in service) {
                const operation = service[operationName];
                const transformedOperationName = this.transform.operationName(operationName, {
                    transformedServiceName: transformedServiceName,
                    serviceName: serviceName,
                    service: service
                });
                const docComments = ts.buildOperationDocComments(operation)
                    .map(c => `        ${c}`);
                this.code.push(...docComments);
                this.code.push(`        ${this.getMethodSignature(transformedOperationName, operation)};`);
                this.code.push('');
            }
            this.code.push(
                `    }`
            );
            if (i < sortedKeys.length - 1) {
                this.code.push(``);
            }
        }
        this.code.push(
            '}'
        );
    }

    generateImplementations() {
        const baseUrl = this.profile.options.baseUrl;
        const baseUrlProvider = baseUrl.provider || _.camelCase(baseUrl.type);
        const baseUrlPath = baseUrl.path && baseUrl.path.length > 0 ? baseUrlProvider + '.' + baseUrl.path.join('.') : baseUrlProvider;

        this.code.push(
            `namespace ${this.profile.options.namespaces.services} {`,
            `    import __models = ${this.profile.options.namespaces.models};`,
            ``
        );

        const sortedKeys = _.keys(this.definition.services).sort();
        for (let i = 0; i < sortedKeys.length; i++) {
            const serviceName = sortedKeys[i];
            const service = this.definition.services[serviceName];
            const transformedServiceName = this.transform.serviceName(serviceName, {
                service: service
            }) + (this.profile.options.serviceSuffix || 'Client');
            this.code.push(
                `    export class ${transformedServiceName} implements I${transformedServiceName} {`,
                `        private baseUrl: string;`,
                ``,
                `        public static $inject: string[] = ['$http', '${baseUrlProvider}'];`,
                `        constructor (private $http: ng.IHttpService, ${baseUrlProvider}: ${baseUrl.type}) {`,
                `            this.baseUrl = ${baseUrlPath};`,
                `        }`
            );

            for (const operationName in service) {
                const operation = service[operationName];
                const transformedOperationName = this.transform.operationName(operationName, {
                    transformedServiceName: transformedServiceName,
                    serviceName: serviceName,
                    service: service
                });

                this.code.push(
                    ``,
                    `        public ${this.getMethodSignature(transformedOperationName, operation)} {`
                );

                //Check required parameters
                const requiredParams = (operation.parameters || []).filter(p => !!p.required);
                for (let i = 0; i < requiredParams.length; i++) {
                    const requiredParam = requiredParams[i];
                    this.code.push(
                        `            if (${requiredParam.name} == undefined || ${requiredParam.name} == null) {`,
                        `                throw new Error(\`The parameter '${requiredParam.name}' must be defined.\`);`,
                        `            }`
                    );
                }

                //Resolve path parameters in relative URL.
                const pathParams = (operation.parameters || []).filter(p => p.type === 'path');
                const hasPathParams = pathParams.length > 0;
                this.code.push(
                    `            let resourceUrl: string = '${operation.path}'${hasPathParams ? '' : ';'}`
                );
                for (let i = 0; i < pathParams.length; i++) {
                    const isLastParam = i === pathParams.length - 1;
                    this.code.push(
                        `                .replace('{${pathParams[i].name}}', encodeURIComponent('' + ${pathParams[i].name}))${isLastParam ? ';' : ''}`
                    );
                }

                //Query parameters
                const queryParams = (operation.parameters || []).filter(p => p.type === 'query');
                if (queryParams.length > 0) {
                    this.code.push(`            let queryParams: {[key: string]: string} = {`);
                    for (let i = 0; i < queryParams.length; i++) {
                        const isLastParam = i === queryParams.length - 1;
                        this.code.push(`                 ${queryParams[i].name}: encodeURIComponent('' + ${queryParams[i].name})${isLastParam ? '' : ','}`);
                    }
                    this.code.push(`            };`);
                }

                const bodyParam = (operation.parameters || []).find(p => p.type === 'body');
                const formDataParams = (operation.parameters || []).filter(p => p.type === 'formData');
                const headerParams = (operation.parameters || []).filter(p => p.type === 'header');
                const returnType = this.getReturnType(operation);

                if (formDataParams.length > 0) {
                    this.code.push(
                        `            let fd: FormData = new FormData();`
                    );
                    for (let i = 0; i < formDataParams.length; i++) {
                        this.code.push(
                            `            fd.append('${formDataParams[i].name}', ${formDataParams[i].name});`
                        );
                    }
                }
                this.code.push(
                    `            return this.$http<${returnType}>({`,
                    `                method: '${operation.verb.toUpperCase()}',`
                );
                if (bodyParam) {
                    this.code.push(
                        `                data: ${bodyParam.name},`
                    );
                } else if (formDataParams.length > 0) {
                    this.code.push(
                        `                data: fd,`,
                        `                transformRequest: angular.identity,`
                    );
                }
                if (formDataParams.length > 0 || headerParams.length > 0) {
                    const headers = [];
                    if (formDataParams.length > 0) {
                        headers.push({key: 'Content-Type', value: 'undefined'});
                    }
                    for (let i = 0; i < headerParams.length; i++) {
                        headers.push({key: headerParams[i].name, value: headerParams[i].name});
                    }
                    this.code.push(
                        `                headers: {`
                    );
                    for (let i = 0; i < headers.length; i++) {
                        this.code.push(
                            `                    '${headers[i].key}': ${headers[i].value}`
                        );
                    }
                    this.code.push(
                        `                },`
                    );
                }
                if (queryParams.length > 0) {
                    this.code.push(
                        `                url: buildServiceUrl(this.baseUrl, resourceUrl, queryParams)`
                    );
                } else {
                    this.code.push(
                        `                url: buildServiceUrl(this.baseUrl, resourceUrl)`
                    );
                }
                this.code.push(
                    `            })`,
                    `                .then((response: ng.IHttpPromiseCallbackArg<${returnType}>) => response.data)`,
                    `                .catch((response: ng.IHttpPromiseCallbackArg<any>) => response.data);`,
                    `        }`
                );
            }

            //Class closing
            this.code.push(
                '    }'
            );

            //Module registration
            const registeredServiceName = _.camelCase(transformedServiceName);
            this.code.push(`    angular.module('${this.profile.options.moduleName}').service('${registeredServiceName}', ${transformedServiceName});`);
            this.code.push('');
        }

        this.generateBuildUrlFunction();

        //Namespace closing
        this.code.push(
            '}'
        );
    }

    getReturnType(operation) {
        if (!operation.responses) {
            return 'any';
        }

        for (const statusKey in operation.responses) {
            const statusCode = +statusKey;
            if (statusCode >= 200 && statusCode < 300 && operation.responses[statusKey].dataType) {
                return ts.getDataType(operation.responses[statusKey].dataType, '__models');
            }
        }

        return 'any';
    }

    getMethodSignature(operationName, operation) {
        const orderedParams = (operation.parameters || []).filter(p => p.required).concat(
            (operation.parameters || []).filter(p => !p.required)
        );
        let parameters = '';
        for (let p = 0; p < orderedParams.length; p++) {
            const parameter = orderedParams[p];
            if (parameters) {
                parameters += ', ';
            }
            parameters += `${parameter.name}${parameter.required ? '' : '?'}: ${ts.getDataType(parameter.dataType, '__models')}`;
        }

        const returnType = this.getReturnType(operation);

        const methodSig = `${operationName}(${parameters}): ng.IPromise<${returnType}>`;
        return methodSig;
    }

    generateBuildUrlFunction() {
        this.code.push(
            `    function buildServiceUrl(baseUrl: string, resourceUrl: string, queryParams?: {[key: string]: string}): string {`,
            `        let url: string = baseUrl;`,
            `        let baseUrlSlash: boolean = url[url.length - 1] === '/';`,
            `        let resourceUrlSlash: boolean = resourceUrl[0] === '/';`,
            `        if (!baseUrlSlash && !resourceUrlSlash) {`,
            `            url += '/';`,
            `        } else if (baseUrlSlash && resourceUrlSlash) {`,
            `            url = url.substr(0, url.length - 1);`,
            `        }`,
            `        url += resourceUrl;`,
            ``,
            `        if (queryParams) {`,
            `            let isFirst: boolean = true;`,
            `            for (let p in queryParams) {`,
            `                if (queryParams.hasOwnProperty(p) && queryParams[p]) {`,
            `                    let separator: string = isFirst ? '?' : '&';`,
            `                    url += \`\${separator}\${p}=\${queryParams[p]}\`;`,
            `                    isFirst = false;`,
            `                }`,
            `            }`,
            `        }`,
            `        return url;`,
            `    }`
        );
    }

    generateModels() {
        this.code.push(
            `namespace ${this.profile.options.namespaces.models} {`
        );

        const sortedKeys = _.keys(this.definition.models).sort((x, y) => x.toLowerCase().localeCompare(y.toLowerCase()));

        for (let i = 0; i < sortedKeys.length; i++) {
            const modelName = sortedKeys[i];
            const model = this.definition.models[modelName];
            if (i > 0) {
                this.code.push('');
            }
            this.code.push(
                `    export interface ${modelName} {`
            );

            for (const propertyName in model) {
                const property = model[propertyName];
                this.code.push(
                    `        ${propertyName}${property.required ? '?' : ''}: ${ts.getDataType(property)};`
                );
            }

            this.code.push(
                '    }'
            );
        }

        const enumKeys = _.keys(this.definition.enums).sort((x, y) => x.toLowerCase().localeCompare(y.toLowerCase()));

        for (let i = 0; i < enumKeys.length; i++) {
            const enumName = enumKeys[i];
            const enumValues = this.definition.enums[enumName]
                .map(e => `"${e}"`)
                .join(' | ');
            if (sortedKeys.length > 0 || i > 0) {
                this.code.push('');
            }
            this.code.push(`    export type ${enumName} = ${enumValues};`);
        }

        if (this.profile.options.modelFactory) {
            this.generateModelFactory(sortedKeys, enumKeys);
        }

        //Namespace end
        this.code.push(
            `}`
        );
    }

    generateModelFactory(modelKeys, enumKeys) {
        if (modelKeys.length > 0 || enumKeys.length > 0) {
            this.code.push('');
        }
        this.code.push(
            `    export type Initializer<TModel> = (model: TModel) => void;`,
            ``,
            `    export class ModelFactory {`
        );

        for (let i = 0; i < modelKeys.length; i++) {
            const modelName = modelKeys[i];
            const model = this.definition.models[modelName];
            if (i > 0) {
                this.code.push('');
            }
            this.code.push(
                `        public static createEmpty${modelName}(initializer?: Initializer<${modelName}>): ${modelName} {`
            );
            this.code.push(
                `            let model: ${modelName} =  {`
            );
            for (const propertyName in model) {
                const property = model[propertyName];
                let value;
                if (property.isArray) {
                    value = '[]';
                } else if (property.complex) {
                    value = `ModelFactory.createEmpty${ts.getDataType(property)}()`;
                } else if (property.enum) {
                    value = 'undefined';
                } else if (property.primitive) {
                    value = this.getDefaultValueForPrimitive(property);
                } else {
                    value = 'undefined';
                }
                this.code.push(`                ${propertyName}: ${value},`);
            }
            this.code.push(
                `            };`,
                `            if (!!initializer) {`,
                `                initializer(model);`,
                `            }`,
                `            return model;`,
                `        }`
            );
        }

        //ModelFactory close
        this.code.push(
            `    }`
        );
    }

    getDefaultValueForPrimitive(property) {
        switch (property.primitive) {
            case 'integer':
            case 'number':
                return 'undefined';
            case 'string': {
                switch (property.subType) {
                    case 'date-time':
                        return 'undefined';
                    case 'uuid':
                        return 'undefined';
                    case 'byte':
                        return 'undefined';
                    case 'enum':
                        return `''`;
                    default:
                        return `''`;
                }
            }
            case 'boolean':
                return 'false';
            case 'file':
            case 'object':
                return 'undefined';
            default:
                throw `Cannot get a default value for primitive type ${JSON.stringify(property, null, 4)}`;
        }
    }
}

module.exports = (definition, profile) => {
    const generator = new Generator(definition, profile);
    return generator.generate();
};
