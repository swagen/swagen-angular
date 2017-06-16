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
    }

    generateInitialCode() {
        this.code.push(...ts.buildHeader(this.profile, this.definition));
        this.code.blank();
        this.code.line(

        )
    }
}
