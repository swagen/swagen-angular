'use strict';

module.exports = function(options) {
    if (!options) {
        throw `Specify an 'options' section in your profile.`;
    }
    if (!options.namespaces) {
        throw `Specify an 'options.namespaces' section in your profile.`;
    }
    if (!options.namespaces.services || !options.namespaces.models) {
        throw `Specify namespaces for services and models under the 'options.namespaces' section using keys 'services' and 'models'.`;
    }
};
