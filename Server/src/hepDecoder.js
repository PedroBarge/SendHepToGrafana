const HEPjs = require('hep-js');

function decodeHEPMessage(message) {
    const data = HEPjs.decapsulate(message);
    return { hep: data };
}

module.exports = decodeHEPMessage;