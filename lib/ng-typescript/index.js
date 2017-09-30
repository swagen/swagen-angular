'use strict';

const _ = require('lodash');

const ts = require('swagen-typescript-language');
const codewriter = require('codewriter');

module.exports = class Generator {
    constructor(definition, profile) {
        this.definition = definition;
        this.profile = profile;

        this.options = this.profile.options || {};
        this.options.baseUrl = this.options.baseUrl || {};
        this.options.customization = this.options.customization || {};
        this.options.generation = this.options.generation || {};

        if (this.options.baseUrl.overrideUrl) {
            this.definition.metadata.baseUrl = this.options.baseUrl.overrideUrl;
        }
        switch (this.options.baseUrl.strategy) {
            case 'ImportedVar':
                this.options.baseUrl.importedVar = this.options.baseUrl.importedVar || {};
                break;
            case 'InjectedToken':
                this.options.baseUrl.injectedToken = this.options.baseUrl.injectedToken || {};
                break;
        }
        this.enableCustomization = !!this.options.customization.importFrom && !!this.options.customization.importVariable;
    }

    generate() {
        const options = codewriter.OptionsLibrary.typescript;
        this.code = new codewriter.CodeWriter(options);
        this.generateInitialCode();
        this.code.blank();
        if (this.options.generation.generateInterfaces) {
            this.generateInterfaces();
            this.code.blank();
        }
        if (this.options.generation.generateImplementations) {
            this.generateImplementations();
            this.code.blank();
            this.generateWebApiErrorClass();
            this.code.blank();
        }
        this.generateModels();
        return this.code.toCode();
    }

    generateInitialCode() {
        const importedVar = this.options.baseUrl.importedVar;
        this.code
            .line(...ts.buildHeader(this.profile, this.definition))
            .blank()
            .line(`import { Injectable, Inject } from '@angular/core';`)
            .line(`import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';`)
            .line(`import { Observable } from 'rxjs/Rx';`)
            .if(this.options.baseUrl.strategy === 'ImportedVar')
                .blank()
                .line(`import { ${importedVar.importVariable} } from '${importedVar.importFrom}';`)
            .endIf()
            .if(!!this.enableCustomization)
                .blank()
                .line(`import { ${this.options.customization.importVariable} } from '${this.options.customization.importFrom}';`)
            .endIf();
    }

    generateInterfaces() {
        const serviceNames = _.keys(this.definition.services).sort();
        const options = {
            modelNs: '',
            returnTypeTransformer: rt => `Observable<${rt}>`
        };

        this.code
            .repeat(serviceNames, (code, serviceName, i) => {
                const service = this.definition.services[serviceName];
                code.blank(i > 0)
                    .startBlock(`export interface I${serviceName}`)
                        .iterate(service, (code2, operation, operationName, index) => {
                            code2.blank(index > 0)
                                .line(...ts.buildOperationDocComments(operation))
                                .line(`${ts.getMethodSignature(operationName, operation, options)};`);
                        })
                    .endBlock();
            });
    }

    generateImplementations() {
        const sortedKeys = _.keys(this.definition.services).sort();
        for (let i = 0; i < sortedKeys.length; i++) {
            this.code.blank(i > 0);
            const serviceName = sortedKeys[i];
            const service = this.definition.services[serviceName];
            this.generateImplementation(serviceName, service);
        }
    }

    generateImplementation(serviceName, service) {
        let importedVar = undefined;
        if (this.options.baseUrl.strategy === 'ImportedVar') {
            importedVar = this.options.baseUrl.importedVar.importVariable;
            if (this.options.baseUrl.importedVar.property) {
                importedVar += '.' + this.options.baseUrl.importedVar.property;
            }
        }

        let propertyName = undefined;
        if (this.options.baseUrl.strategy === 'Property') {
            propertyName = this.options.baseUrl.property || 'baseUrl';
        }

        this.code
            .line(`@Injectable()`)
            .inline(`export class ${serviceName}`)
                .inline(` implements I${serviceName}`, this.options.generation.generateInterfaces)
                .inline(` {`)
            .done()
            .indent()
                .inline(`private`)
                    .inline(` readonly`, !propertyName)
                    .inline(` _baseUrl: string;`)
                .done()
                .blank()
                // Constructor
                .startBlock(`constructor(private readonly _http: HttpClient)`)
                    .if(!!importedVar)
                        .line(`this._baseUrl = ${importedVar} || '${this.definition.metadata.baseUrl}';`)
                    .endIf()
                    .if(this.options.baseUrl.strategy === 'Swagger')
                        .line(`this._baseUrl = '${this.definition.metadata.baseUrl}';`)
                    .endIf()
                .endBlock()
                .if(!!propertyName)
                    .blank()
                    .startBlock(`public get baseUrl(): string`)
                        .line(`return this._baseUrl || '${this.definition.metadata.baseUrl}';`)
                    .endBlock()
                    .blank()
                    .startBlock(`public set baseUrl(value: string)`)
                        .line(`this._baseUrl = value;`)
                    .endBlock()
                .endIf()
                .iterate(service, (code, operation, operationName) => {
                    code.blank()
                        .line(...ts.buildOperationDocComments(operation))
                        .func(() => this.generateOperation(operationName, operation));
                })
                .blank()
                .func(() => this.generateBuildServiceUrlMethod())
                .blank()
                .func(() => this.generateGetErrorMethod())
            .unindent('}');
    }

    generateOperation(operationName, operation) {
        const options = {
            modelNs: '',
            returnTypeTransformer: rt => `Observable<${rt}>`
        };

        const requiredParams = (operation.parameters || []).filter(p => !!p.required);
        const pathParams = (operation.parameters || []).filter(p => p.type === 'path');
        const hasPathParams = pathParams.length > 0;
        const queryParams = (operation.parameters || []).filter(p => p.type === 'query');
        const bodyParam = (operation.parameters || []).find(p => p.type === 'body');
        const formDataParams = (operation.parameters || []).filter(p => p.type === 'formData');
        const headerParams = (operation.parameters || []).filter(p => p.type === 'header');
        const returnType = ts.getReturnType(operation, { modelNs: '' });

        this.code
            .startBlock(`public ${ts.getMethodSignature(operationName, operation, options)}`)
                // Check require parameters
                .repeat(requiredParams, (code, requiredParam) => {
                    code.startBlock(`if (${requiredParam.name} == undefined || ${requiredParam.name} == null)`)
                            .line(`throw new Error(\`The parameter '${requiredParam.name}' must be defined.\`);`)
                        .endBlock();
                })
                .blank(requiredParams.length > 0)
                //Build the resource URL
                .inline(`const resourceUrl: string = '${operation.path}'`).inline(`;`, !hasPathParams).done()
                .indent()
                    .repeat(pathParams, (code, pathParam, i, arr) => {
                        code.inline(`.replace('{${pathParam.name}}', encodeURIComponent('' + ${pathParam.name}))`)
                            .inline(`;`, i === arr.length - 1)
                            .done();
                    })
                .unindent()
                //Build the query string
                .if(queryParams.length > 0)
                    .startBlock(`const queryParams: {[key: string]: string} =`)
                        .repeat(queryParams, (code, queryParam, i, arr) => {
                            code.inline(`${queryParam.name}: encodeURIComponent('' + ${queryParam.name})`)
                                .inline(`,`, i < arr.length - 1)
                                .done();
                        })
                    .endBlock(`};`)
                .endIf()
                .inline(`const url = this.buildServiceUrl(resourceUrl`)
                    .inline(`, queryParams`, queryParams.length > 0)
                    .inline(`);`)
                    .done()
                .blank()
                // Build form data content
                .if(formDataParams.length > 0)
                    .line(`const content = new FormData();`)
                    .repeat(formDataParams, (code, formDataParam) => {
                        const paramName = formDataParam.name;
                        code.startBlock(`if (${paramName} != null && ${paramName} != undefined)`)
                                .line(`content.append('${paramName}', ${paramName}.toString());`)
                            .endBlock();
                    })
                .endIf()
                .blank(formDataParams.length > 0)
                .startBlock(`const options =`)
                    .line(`headers: new Headers({`)
                    .indent()
                        .repeat(headerParams, (code, headerParam) => {
                            code.line(`'${headerParam.name}': ${headerParam.name},`);
                        })
                        .lineIf(bodyParam, `'Content-Type': 'application/json',`)
                        .line(`'Accept': 'application/json'`)
                    .unindent(`}),`)
                .endBlock(`};`)
                .inline(`return this._http.${operation.verb.toLowerCase()}<${returnType}>(url, `)
                    .inline(`${(bodyParam || {}).name}, `, !!bodyParam)
                    .inline(`content, `,  formDataParams.length > 0)
                    .inline(`options)`)
                .done()
                .indent()
                    .line(`.subscribe((response: HttpResponse<${returnType}>) => response.data)`)
                    .line(`.catch((err: HttpErrorResponse) => Observable.throw(this.createError(err)));`)
                .unindent()
            .endBlock();
    }

    generateModels() {
        const modelNames = _.keys(this.definition.models).sort((x, y) => x.toLowerCase().localeCompare(y.toLowerCase()));
        const enumNames = _.keys(this.definition.enums).sort((x, y) => x.toLowerCase().localeCompare(y.toLowerCase()));

        this.code
            .repeat(modelNames, (code, modelName, i) => {
                const model = this.definition.models[modelName];
                code.blank(i > 0)
                    .startBlock(`export interface ${modelName}`)
                        .iterate(model, (code2, property, propertyName) => {
                            code2.inline(propertyName)
                                .inline(`?`, !property.required)
                                .inline(`: ${ts.getDataType(property)};`)
                                .done();
                        })
                    .endBlock();
            })
            .blank(modelNames.length > 0)
            .repeat(enumNames, (code, enumName, i) => {
                const enumValues = this.definition.enums[enumName]
                    .map(e => `'${e}'`)
                    .join(` | `);
                code.blank(i > 0)
                    .line(`export type ${enumName} = ${enumValues};`);
            })
            .blank(modelNames.length > 0 || enumNames.length > 0);
    }

    generateBuildServiceUrlMethod() {
        this.code
            .startBlock(`private buildServiceUrl(resourceUrl: string, queryParams?: {[key: string]: string}): string`)
                .line(`let url: string = this._baseUrl;`)
                .line(`const baseUrlSlash: boolean = url[url.length - 1] === '/';`)
                .line(`const resourceUrlSlash: boolean = resourceUrl && resourceUrl[0] === '/';`)
                .startBlock(`if (!baseUrlSlash && !resourceUrlSlash)`)
                    .line(`url += '/';`)
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
                .line(`let isFirst: boolean = true;`)
                .startBlock(`for (const p in queryParams)`)
                    .startBlock(`if (queryParams.hasOwnProperty(p) && queryParams[p])`)
                        .line(`const separator: string = isFirst ? '?' : '&';`)
                        .line(`url += \`\${separator}\${p}=\${queryParams[p]}\`;`)
                        .line(`isFirst = false;`)
                    .endBlock()
                .endBlock()
                .line(`return url;`)
            .endBlock();
    }

    generateGetErrorMethod() {
        this.code
            .startBlock(`private createError(err: HttpErrorResponse): WebApiClientError`)
                .startBlock(`const headers = err.headers.keys().reduce((accumulate: { [key: string]: string[] }, key: string) =>`)
                    .line(`accumulate[key] = err.headers.getAll(key);`)
                    .line(`return accumulate;`)
                .endBlock(`}, {});`)
                .line(`return new WebApiClientError(err.message, err.status, headers);`)
            .endBlock();
    }

    generateWebApiErrorClass() {
        this.code
            .startBlock(`export class WebApiClientError extends Error`)
                .startBlock(`constructor(public message: string, public statusCode: number, public headers: { [key: string]: string[] })`)
                    .line(`super(message);`)
                .endBlock()
            .endBlock();
    }
};
