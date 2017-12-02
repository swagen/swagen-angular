'use strict';

let config = undefined;

function setExpectedQuote(expectedQuote) {
    const unwantedQuote = expectedQuote === `"` ? `'` : `"`;
    config = {
        sourcePattern: new RegExp(unwantedQuote, 'g'),
        destinationQuote: expectedQuote
    };
    if (config.destinationQuote !== `'` || config.destinationQuote !== `"`) {
        config.destinationQuote = `'`;
    }
}

function quotes(strings, ...keys) {
    if (!config) {
        throw new Error(`Before using quotes tagged templates, use the setExpectedQuote function to configure it.`);
    }
    return keys.reduce((accumulate, key, index) => {
        accumulate += key;
        accumulate += strings[index + 1].replace(config.sourcePattern, config.destinationQuote);
        return accumulate;
    }, strings[0]).replace(config.sourcePattern, config.destinationQuote);
}

module.exports = {
    setExpectedQuote,
    quotes
};
