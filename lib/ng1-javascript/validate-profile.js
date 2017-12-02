'use strict';

module.exports = profile => {
    if (!profile.options) {
        throw new Error(`Specify an 'options' section in your profile.`);
    }
};
