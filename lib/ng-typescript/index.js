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
            `import 'rxjs/add/observable/fromPromise';`,
            `import 'rxjs/add/observable/of';`,
            `import 'rxjs/add/observable/throw';`,
            `import 'rxjs/add/operator/map';`,
            `import 'rxjs/add/operator/mergeMap';`,
            `import 'rxjs/add/operator/toPromise';`,
            `import 'rxjs/add/operator/catch';`,
            ``,
            `import { Observable } from 'rxjs/Observable';`,
            `import { Injectable, Inject, Optional, OpaqueToken } from '@angular/core';`,
            `import { Http, Headers, ResponseContentType, Response } from '@angular/http';`,
            ``,
            `import { IAppConfig } from '../../app.config';`,
            `// export const API_BASE_URL = new OpaqueToken('${this.options.baseUrlToken}');`
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
        this.code.line(`@Injectable()`);
        this.code
            .inline(`export class ${serviceName}${this.options.serviceClassSuffix}`)
            .inline(` implements I${serviceName}${this.options.serviceClassSuffix}`, this.options.generateInterfaces)
            .inline(` {`)
            .done();
        this.code.indent();

        this.code.line(
            `private http: Http;`,
            `private baseUrl: string;`,
            `public jsonParseReviver: ((key: string, value: any) => any) | undefined = undefined;`
        );

        this.code.blank();

        this.code.line(
            `constructor(@Inject(Http) http: Http, @Optional() @Inject(IAppConfig) config?: IAppConfig) {`
        )
            .indent()
            .line(
                `this.http = http;`,
                `this.baseUrl = config.apiBaseUrl.common || '${this.definition.metadata.baseUrl}';`
            )
            .unindent('}');

        for (const operationName in service) {
            this.code.blank();
            const operation = service[operationName];
            this.code.line(...ts.buildOperationDocComments(operation));
            this.generateOperation(operationName, operation);
        }

        this.code.unindent('}');
    }

    generateOperation(operationName, operation) {
        const options = {
            modelNs: '',
            returnTypeTransformer: rt => `Observable<${rt}>`
        };
        this.code
            .inline(`public `)
            .inline(ts.getMethodSignature(operationName, operation, options))
            .inline(` {`)
            .done()
            .indent();

        //Check required parameters
        const requiredParams = (operation.parameters || []).filter(p => !!p.required);
        for (let i = 0; i < requiredParams.length; i++) {
            const requiredParam = requiredParams[i];
            this.code
                .line(`if (${requiredParam.name} == undefined || ${requiredParam.name} == null) {`)
                .indent(`throw new Error(\`The parameter '${requiredParam.name}' must be defined.\`);`)
                .unindent(`}`);
        }

        //Resolve path parameters in relative URL.
        const pathParams = (operation.parameters || []).filter(p => p.type === 'path');
        const hasPathParams = pathParams.length > 0;
        this.code
            .inline(`const resourceUrl: string = '${operation.path}'`)
            .inline(`;`, !hasPathParams)
            .done();
        this.code.indent();
        this.code.repeat(pathParams, (code, pathParam, i, arr) => {
            code.inline(`.replace('{${pathParam.name}}', encodeURIComponent('' + ${pathParam.name}))`)
                .inline(`;`, i === arr.length - 1)
                .done();
        });
        this.code.unindent();

        //Query parameters
        const queryParams = (operation.parameters || []).filter(p => p.type === 'query');
        if (queryParams.length > 0) {
            this.code
                .startBlock(`const queryParams: {[key: string]: string} =`)
                    .repeat(queryParams, (code, queryParam, i, arr) => {
                        code.inline(`${queryParam.name}: encodeURIComponent('' + ${queryParam.name})`)
                            .inline(`,`, i < arr.length - 1)
                            .done();
                    })
                .endBlock();
        }

        this.code
            .inline(`const url = buildServiceUrl(this.baseUrl, resourceUrl`)
            .inline(`, queryParams`, queryParams.length > 0)
            .inline(`);`)
            .done();

        this.code.blank();

        //Options
        const bodyParam = (operation.parameters || []).find(p => p.type === 'body');
        const formDataParams = (operation.parameters || []).filter(p => p.type === 'formData');
        const headerParams = (operation.parameters || []).filter(p => p.type === 'header');
        const returnType = ts.getReturnType(operation, { modelNs: '' });

        //Create content variable
        if (formDataParams.length > 0) {
            this.code.line(`const content = new FormData();`);
            for (let i = 0; i < formDataParams.length; i++) {
                const paramName = formDataParams[i].name;
                this.code
                    .line(`if (${paramName} != null && ${paramName} != undefined) {`)
                    .indent()
                        .line(`content.append('${paramName}', ${paramName}.toString());`)
                    .unindent(`}`);
            }
        } else if (bodyParam) {
            this.code.line(`const content = JSON.stringify(${bodyParam.name});`);
        } else {
            this.code.line(`const content = '';`);
        }

        this.code.blank();

        //Create HTTP request options variable
        this.code.line(`let options = {`)
            .indent()
                .line(`body: content,`);
        this.code.line(`headers: new Headers({`)
            .indent();
        for (let i = 0; i < headerParams.length; i++) {
            this.code.line(`'${headerParams[i].name}': ${headerParams[i].name},`);
        }
        if (bodyParam) {
            this.code.line(`'Content-Type': 'application/json',`);
        }
        this.code.line(`'Accept': 'application/json'`);
        this.code.unindent('}),');
        this.code.line(`method: '${operation.verb.toUpperCase()}'`);
        this.code.unindent('};');

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
                    .line(`let result: ${returnType} = !responseText ? null : <${returnType}>JSON.parse(responseText, this.jsonParseReviver);`)
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
                .line(`let baseUrlSlash: boolean = url[url.length - 1] === '/';`)
                .line(`let resourceUrlSlash: boolean = resourceUrl[0] === '/';`)
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
                    .line(`for (let p in queryParams) {`)
                    .indent()
                        .line(`if (queryParams.hasOwnProperty(p) && queryParams[p]) {`)
                        .indent()
                            .line(`let separator: string = isFirst ? '?' : '&';`)
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
                .startBlock(`constructor(public status: number, public response: string, public result: string)`)
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
