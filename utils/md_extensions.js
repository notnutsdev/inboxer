// Markdown extensions

const extensions = {
    hrTag: {
        type: 'lang',
        regex: /---/g,
        replace: '<hr>'
    }
}

module.exports = extensions;