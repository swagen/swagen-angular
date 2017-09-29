'use strict';

const _ = require('lodash');

const ts = require('swagen-typescript-language');
const codewriter = require('codewriter');

module.exports = class Generator {
    constructor(definition, profile) {
        this.definition = definition;
        this.profile = profile;
        this.options = {
            generateInterfaces: profile.options.generateInterfaces,
            baseUrlToken: profile.options.baseUrlToken || 'API_BASE_URL',
            serviceClassSuffix: profile.options.serviceClassSuffix || 'Client'
        };
    }

    generate() {
        const options = codewriter.OptionsLibrary.typescript;
        this.code = new codewriter.CodeWriter(options);
        this.generateInitialCode();
        this.code.blank();
        if (this.options.generateInterfaces) {
            this.generateInterfaces();
            this.code.blank();
        }
        this.generateImplementations();
        this.code.blank();
        this.generateBuildServiceUrlFunction();
        this.code.blank();
        this.generateSwaggerExceptionClass();
        this.code.blank();
        this.generateThrowExceptionFunction();
        this.code.blank();
        this.generateModels();
        return this.code.toCode();
    }

    generateInitialCode() {
        this.code.line(...ts.buildHeader(this.profile, this.definition));
        this.code.blank();
        this.code.line(
            `import { Injectable, Inject } from '@angular/core';`,
            `import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';`,
            `import { Observable } from 'rxjs/Rx';`,
            ``,
            `import { environment } from '../../../environments/environment';`
        );
    }

    generateInterfaces() {
        const sortedKeys = _.keys(this.definition.services).sort();
        for (let i = 0; i < sortedKeys.length; i++) {
            this.code.blank(i > 0);
            const serviceName = sortedKeys[i];
            const service = this.definition.services[serviceName];
            this.code
                .line(`export interface I${serviceName}${this.options.serviceClassSuffix} {`)
                .indent();

            let isFirst = true;
            for (const operationName in service) {
                if (isFirst) {
                    isFirst = false;
                } else {
                    this.code.blank();
                }
                const operation = service[operationName];
                this.code.line(...ts.buildOperationDocComments(operation));
                const options = {
                    modelNs: '',
                    returnTypeTransformer: rt => `Observable<${rt}>`
                };
                this.code
                    .inline(ts.getMethodSignature(operationName, operation, options))
                    .inline(`;`)
                    .done();
            }

            this.code.unindent(`}`);
        }
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
        this.code
            .line(`@Injectable()`);
        this.code
            .inline(`export class ${serviceName}${this.options.serviceClassSuffix}`)
            .inline(` implements I${serviceName}${this.options.serviceClassSuffix}`, this.options.generateInterfaces)
            .inline(` {`)
            .done();
        this.code
            .indent();

        this.code
            .line(`private readonly _baseUrl: string;`)
            .blank()
            .startBlock(`constructor(private readonly _http: HttpClient)`)
                .line(`this._baseUrl = environment.baseUrl || '${this.definition.metadata.baseUrl}';`)
            .endBlock();

        for (const operationName in service) {
            this.code.blank();
            const operation = service[operationName];
            this.code.line(...ts.buildOperationDocComments(operation));
            this.generateOperation(operationName, operation);
        }

        this.code
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
            .repeat(requiredParams, (code, requiredParam) => {
                code.startBlock(`if (${requiredParam.name} == undefined || ${requiredParam.name} == null)`)
                        .line(`throw new Error(\`The parameter '${requiredParam.name}' must be defined.\`);`)
                    .endBlock();
            })
            .blank(requiredParams.length > 0)
            .inline(`const resourceUrl: string = '${operation.path}'`).inline(`;`, !hasPathParams).done()
            .indent()
                .repeat(pathParams, (code, pathParam, i, arr) => {
                    code.inline(`.replace('{${pathParam.name}}', encodeURIComponent('' + ${pathParam.name}))`)
                        .inline(`;`, i === arr.length - 1)
                        .done();
                })
            .unindent()
            .if(queryParams.length > 0)
                .startBlock(`const queryParams: {[key: string]: string} =`)
                    .repeat(queryParams, (code, queryParam, i, arr) => {
                        code.inline(`${queryParam.name}: encodeURIComponent('' + ${queryParam.name})`)
                            .inline(`,`, i < arr.length - 1)
                            .done();
                    })
                .endBlock(`};`)
            .endIf()
            .blank(queryParams.length > 0)
            .inline(`const url = buildServiceUrl(this._baseUrl, resourceUrl`)
                .inline(`, queryParams`, queryParams.length > 0)
                .inline(`);`)
                .done()
            .blank()
            .if(formDataParams.length > 0)
                .line(`const content = new FormData();`)
                .repeat(formDataParams, (code, formDataParam) => {
                    const paramName = formDataParam.name;
                    code.startBlock(`if (${paramName} != null && ${paramName} != undefined)`)
                            .line(`content.append('${paramName}', ${paramName}.toString());`)
                        .endBlock();
                })
            .endIf()
            .if(!!bodyParam && formDataParams.length === 0)
                .line(`const content = JSON.stringify(${(bodyParam || {}).name});`)
            .endIf()
            .lineIf(!bodyParam && formDataParams.length === 0, `const content = '';`)
            .blank()
            .startBlock(`const options =`)
                .line(`body: content,`)
                .line(`headers: new Headers({`)
                .indent()
                    .repeat(headerParams, (code, headerParam) => {
                        code.line(`'${headerParam.name}': ${headerParam.name},`);
                    })
                    .lineIf(bodyParam, `'Content-Type': 'application/json',`)
                    .line(`'Accept': 'application/json'`)
                .unindent(`}),`)
                .line(`method: '${operation.verb.toUpperCase()}'`)
            .endBlock(`};`);

        this.code.blank();

        const processMethodName = `process${_.upperFirst(_.camelCase(operationName))}`;
        this.code
            .line(`return this.http.request(url, options).flatMap(response =>`)
            .indent()
                .line(`this.${processMethodName}(response)`)
            .unindent(`).catch(response => {`)
            .indent()
                .line(`if (response instanceof Response) {`)
                .indent()
                    .line(`try {`)
                    .indent()
                        .line(`return this.${processMethodName}(response);`)
                    .unindent(`} catch (e) {`)
                    .indent()
                        .line(`return <Observable<${returnType}>><any>Observable.throw(response);`)
                    .unindent(`}`)
                .unindent('}')
            .unindent(`});`);

        this.code.unindent('}');

        this.code.blank();

        //Process method
        this.code.line(
            `private ${processMethodName}(response: Response): Observable<${returnType}> {`
        ).indent();
        this.code
            .line(`const status = +response.status;`)
            .line(`const responseText = response.text();`)
            .line(`switch (status) {`)
            .indent();
        for (const statusCode in operation.responses) {
            const status = +statusCode;
            if (!status) {
                continue;
            }
            this.code.line(`case ${statusCode}:`)
                .indent();
            if (status >= 200 && status < 400) {
                this.code
                    .line(`const result: ${returnType} = !responseText ? null : <${returnType}>JSON.parse(responseText, this.jsonParseReviver);`)
                    .line(`return Observable.of(result);`);
            } else if (status >= 400) {
                this.code
                    .line(`return throwException(status, responseText);`);
            }
            this.code.unindent();
        }
        this.code.line(`default:`)
            .indent();
        this.code.line(`throw new Error(\`Unexpected status code \${status}\`);`);
        this.code.unindent();

        this.code.unindent('}');

        this.code.unindent(`}`);
    }

    generateModels() {
        const sortedKeys = _.keys(this.definition.models).sort((x, y) => x.toLowerCase().localeCompare(y.toLowerCase()));

        for (let i = 0; i < sortedKeys.length; i++) {
            const modelName = sortedKeys[i];
            const model = this.definition.models[modelName];
            this.code.blank(i > 0);
            this.code.line(
                `export interface ${modelName} {`
            ).indent();

            for (const propertyName in model) {
                const property = model[propertyName];
                this.code
                    .inline(propertyName)
                    .inline('?', !property.required)
                    .inline(': ')
                    .inline(ts.getDataType(property))
                    .inline(` | undefined`, !property.required)
                    .inline(';')
                    .done();
            }

            this.code.unindent('}');
        }

        const enumKeys = _.keys(this.definition.enums).sort((x, y) => x.toLowerCase().localeCompare(y.toLowerCase()));

        for (let i = 0; i < enumKeys.length; i++) {
            const enumName = enumKeys[i];
            const enumValues = this.definition.enums[enumName]
                .map(e => `'${e}'`)
                .join(' | ');
            this.code.blank(sortedKeys.length > 0 || i > 0);
            this.code.line(`export type ${enumName} = ${enumValues};`);
        }

        this.code.blank(sortedKeys.length > 0 || enumKeys.length > 0);
    }

    generateBuildServiceUrlFunction() {
        this.code
            .line(`function buildServiceUrl(baseUrl: string, resourceUrl: string, queryParams?: {[key: string]: string}): string {`)
            .indent()
                .line(`let url: string = baseUrl;`)
                .line(`const baseUrlSlash: boolean = url[url.length - 1] === '/';`)
                .line(`const resourceUrlSlash: boolean = resourceUrl[0] === '/';`)
                .line(`if (!baseUrlSlash && !resourceUrlSlash) {`)
                .indent()
                    .line(`url += '/';`)
                .unindent(`} else if (baseUrlSlash && resourceUrlSlash) {`)
                .indent()
                    .line(`url = url.substr(0, url.length - 1);`)
                .unindent(`}`)
                .line(`url += resourceUrl;`)
                .blank()
                .line(`if (queryParams) {`)
                .indent()
                    .line(`let isFirst: boolean = true;`)
                    .line(`for (const p in queryParams) {`)
                    .indent()
                        .line(`if (queryParams.hasOwnProperty(p) && queryParams[p]) {`)
                        .indent()
                            .line(`const separator: string = isFirst ? '?' : '&';`)
                            .line(`url += \`\${separator}\${p}=\${queryParams[p]}\`;`)
                            .line(`isFirst = false;`)
                        .unindent(`}`)
                    .unindent(`}`)
                .unindent(`}`)
                .line(`return url;`)
            .unindent(`}`);
    }

    generateSwaggerExceptionClass() {
        this.code
            .startBlock(`export class SwaggerException extends Error`)
                .startBlock(`constructor(public readonly status: number, public readonly response: string, public readonly result: string)`)
                    .line(`super();`)
                .endBlock()
            .endBlock();
    }

    generateThrowExceptionFunction() {
        this.code
            .startBlock(`function throwException(status: number, response: string, result?: string): Observable<any>`)
                .line(`return !!result ? Observable.throw(result) : Observable.throw(new SwaggerException(status, response, null));`)
            .endBlock();
    }
};
