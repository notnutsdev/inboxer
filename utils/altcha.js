/// Main altcha object
const { create, deriveHmacKeySecret, randomInt, CappedMap } = require("altcha-lib/frameworks/express");
const { deriveKey } = require('altcha-lib/algorithms/pbkdf2');

// Configuring Altcha
const HMAC_SECRET = process.env.HMAC_SECRET;
const altcha = create({
    hmacSignatureSecret: HMAC_SECRET,
    hmacKeySignatureSecret: (async () => {
        return await deriveHmacKeySecret(HMAC_SECRET);
    })(),

    createChallengeParameters: () => {
        return {
        algorithm: 'PBKDF2/SHA-256',
        cost: 5_000,
        counter: randomInt(5_000, 10_000),
        expiresAt: new Date(Date.now() + 600_000)
        };
    },

    deriveKey,

    // setCookie: {
    //     name: 'altcha',
    //     path: '/',
    // },

    store: new CappedMap({
        maxSize: 1_000,
    })
})

module.exports = altcha;