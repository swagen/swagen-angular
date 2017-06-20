'use strict';

const _ = require('lodash');

const swagenCore = require('swagen-core');
const ts = require('swagen-typescript-language');

module.exports = class Generator {
    constructor(definition, profile) {
        this.definition = definition;
        this.profile = profile;
        this.transform = new swagenCore.transformer.Transformer(profile);
        this.transform.transformDefinition(this.definition);
    }

    generate() {
        this.code = new swagenCore.CodeBuilder();
        this.generateInitialCode();
        this.code.blank();
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
            `export const API_BASE_URL = new OpaqueToken('API_BASE_URL');`,
        );
    }

    generateImplementations() {
        let sortedKeys = _.keys(this.definition.services).sort();
        for (let i = 0; i < sortedKeys.length; i++) {
            if (i > 0) {
                this.code.blank();
            }
            let serviceName = sortedKeys[i];
            let service = this.definition.services[serviceName]
            this.generateImplementation(serviceName, service);
        }
    }

    generateImplementation(serviceName, service) {
        this.code.line(
            `@Injectable()`,
            `export class ${serviceName}Client {`,
        ).indent();

        this.code.line(
            `private http: Http;`,
            `private baseUrl: string;`,
            `public jsonParseReviver: ((key: string, value: any) => any) | undefined = undefined;`
        );

        this.code.blank();

        this.code.line(
            `constructor(@Inject(Http) http: Http, @Optional() @Inject(API_BASE_URL) baseUrl?: string) {`
        )
            .indent()
            .line(
                `this.http = http;`,
                `this.baseUrl = baseUrl || '${this.definition.metadata.baseUrl}';`,
            )
            .unindent('}');

        for (let operationName in service) {
            this.code.blank();
            let operation = service[operationName];
            this.code.line(...ts.buildOperationDocComments(operation));
            this.generateOperation(operationName, operation);
        }

        this.code.unindent('}')
    }

    generateOperation(operationName, operation) {
        let options = {
            modelNs: '',
            returnTypeTransformer: rt => `Observable<${rt}>`
        };
        this.code.inline('public ').inline(ts.getMethodSignature(operationName, operation, options)).inline(' {').done().indent();

        //Check required parameters
        let requiredParams = (operation.parameters || []).filter(p => !!p.required);
        for (let i = 0; i < requiredParams.length; i++) {
            let requiredParam = requiredParams[i];
            this.code
                .line(`if (${requiredParam.name} == undefined || ${requiredParam.name} == null) {`)
                .indent(`throw new Error(\`The parameter '${requiredParam.name}' must be defined.\`);`)
                .unindent(`}`);
        }

        //Resolve path parameters in relative URL.
        let pathParams = (operation.parameters || []).filter(p => p.type === 'path');
        let hasPathParams = pathParams.length > 0;
        this.code
            .inline(`let resourceUrl: string = '${operation.path}'`)
            .inline(`;`, !hasPathParams)
            .done();
        this.code.indent();
        for (let i = 0; i < pathParams.length; i++) {
            this.code
                .inline(`.replace('{${pathParams[i].name}}', encodeURIComponent('' + ${pathParams[i].name}))`)
                .inline(`;`, i === pathParams.length - 1)
                .done();
        }
        this.code.unindent();

        //Query parameters
        let queryParams = (operation.parameters || []).filter(p => p.type === 'query');
        if (queryParams.length > 0) {
            this.code
                .line(`let queryParams: {[key: string]: string} = {`)
                .indent();
            for (let i = 0; i < queryParams.length; i++) {
                this.code
                    .inline(`${queryParams[i].name}: encodeURIComponent('' + ${queryParams[i].name})`)
                    .inline(`,`, i < queryParams.length - 1)
                    .done();
            }
            this.code.unindent('};')
        }

        this.code
            .inline(`let url = buildServiceUrl(this.baseUrl, resourceUrl`)
            .inline(`, queryParams`, queryParams.length > 0)
            .inline(`);`)
            .done();

        //Options
        let bodyParam = (operation.parameters || []).find(p => p.type === 'body');
        let formDataParams = (operation.parameters || []).filter(p => p.type === 'formData');
        let headerParams = (operation.parameters || []).filter(p => p.type === 'header');
        let returnType = ts.getReturnType(operation, { modelNs: '' });

        this.code.line(`let options = {`)
            .indent();
        if (bodyParam) {
            this.code.line(`body: JSON.stringify(${bodyParam.name}),`);
        } else {
            this.code.line(`body: '',`);
        }
        this.code.line(`headers: new Headers({`)
            .indent();
        for (let i = 0; i < headerParams.length; i++) {
            this.code.line(`'${headerParams[i].key}': '${headerParams[i].value}',`);
        }
        this.code.line(`'Content-Type': 'application/json'`);
        this.code.unindent('}),');
        this.code.line(`method: '${operation.verb.toUpperCase()}'`)
        this.code.unindent('};');

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

        this.code.line(
            `private ${processMethodName}(response: Response): Observable<${returnType}> {`
        ).indent();
        this.code
            .line(`const status = +response.status;`)
            .line(`const responseText = response.text();`)
            .line(`switch (status) {`)
            .indent();
        for (let statusCode in operation.responses) {
            let status = +statusCode;
            if (!status) {
                continue;
            }
            this.code.line(`case ${statusCode}:`)
                .indent();
            if (status >= 200 && status < 400) {
                this.code
                    .line(`let result: string = !responseText ? null : <string>JSON.parse(responseText, this.jsonParseReviver);`)
                    .line(`return Observable.of(result);`)
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
        let sortedKeys = _.keys(this.definition.models).sort((x, y) => x.toLowerCase().localeCompare(y.toLowerCase()));

        for (let i = 0; i < sortedKeys.length; i++) {
            let modelName = sortedKeys[i];
            let model = this.definition.models[modelName];
            if (i > 0) {
                this.code.blank();
            }
            this.code.line(
                `export interface ${modelName} {`
            ).indent();

            for (let propertyName in model) {
                let property = model[propertyName];
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

        let enumKeys = _.keys(this.definition.enums).sort((x, y) => x.toLowerCase().localeCompare(y.toLowerCase()));

        for (let i = 0; i < enumKeys.length; i++) {
            let enumName = enumKeys[i];
            let enumValues = this.definition.enums[enumName]
                .map(e => `"${e}"`)
                .join(' | ');
            if (sortedKeys.length > 0 || i > 0) {
                this.code.blank();
            }
            this.code.line(`export type ${enumName} = ${enumValues};`);
        }

        if (sortedKeys.length > 0 || enumKeys.length > 0) {
            this.code.blank();
        }
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
            .line(`export class SwaggerException extends Error {`)
            .indent()
                .line(`constructor(public status: number, public response: string, public result: string) {`)
                .indent()
                    .line(`super();`)
                .unindent(`}`)
            .unindent(`}`);
    }

    generateThrowExceptionFunction() {
        this.code
            .line(`function throwException(status: number, response: string, result?: string): Observable<any> {`)
            .indent()
                .line(`return !!result ? Observable.throw(result) : Observable.throw(new SwaggerException(status, response, null));`)
            .unindent(`}`);
    }
}
