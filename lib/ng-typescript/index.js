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

        this.code.unindent('}');

        this.code.blank();

        this.code.line(
            `private process${_.upperFirst(_.camelCase(operationName))}(response: Response): Observable<${ts.getReturnType(operation, { modelNs: '' })}> {`
        ).indent();
        this.code.line(``);
        this.code.unindent('}');
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
}
