'use strict';

const quotesTaggedTemplate = require('./quotes-tagged-template');
const quotes = quotesTaggedTemplate.quotes;

module.exports = class DataTypes {
    constructor(definition, useDetailed) {
        this.definition = definition;
        this.useDetailed = useDetailed;
    }

    getDataType(property) {
        const typeName = this._getDataTypeName(property);
        return property.isArray ? typeName + '[]' : typeName;
    }

    _getDataTypeName(property) {
        if (property.primitive) {
            return this._getPrimitiveTypeName(property);
        }
        if (property.complex) {
            return this._getComplexTypeName(property);
        }
        if (property.enum) {
            return this._getEnumTypeName(property);
        }
        throw new Error(`Cannot understand type of property in definition: ${JSON.stringify(property, null, 4)}`);
    }

    getReturnType(operation) {
        if (!operation.responses) {
            return 'void';
        }
        for (const statusKey in operation.responses) {
            if (Object.prototype.hasOwnProperty.call(operation.responses, statusKey)) {
                const statusCode = +statusKey;
                if (statusCode >= 200 && statusCode < 300 && operation.responses[statusKey].dataType) {
                    return this.getDataType(operation.responses[statusKey].dataType);
                }
            }
        }
        return 'void';
    }

    _getPrimitiveTypeName(property) {
        switch (property.primitive) {
            case 'integer':
            case 'number':
                return 'Number';
            case 'string': {
                switch (property.subType) {
                    case 'date-time':
                        return 'Date';
                    case 'uuid':
                        return 'String';
                    case 'byte':
                        return 'Number';
                    default:
                        return 'String';
                }
            }
            case 'boolean':
                return 'Boolean';
            case 'file':
            case 'object':
                return 'Object';
            default:
                throw new Error(`Cannot translate primitive type ${JSON.stringify(property, null, 4)}`);
        }
    }

    _getComplexTypeName(property) {
        return this.useDetailed ? property.complex : 'Object';
    }

    _getEnumTypeName(property) {
        const stringUnionType = this.definition.enums[property.enum].map(e => quotes`'${e}'`).join(`|`);
        return `(${stringUnionType})`;
    }
};
