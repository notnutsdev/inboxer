///// Compile Markdown to HTML
const showdown = require("showdown");
const md_ext = require("./md_extensions");
const showdown_ext = [ md_ext.hrTag, md_ext.videoTag, md_ext.codeBlock, md_ext.videoEmbed, md_ext.emojis, md_ext.musicBlock ]; // List of extensions to be used by showdown's compiler
const custom_ext = [ md_ext.mentions ]; // Custom extensions
const converter = new showdown.Converter({ tasklists: true, underline: true, strikethrough: true, parseImgDimensions: true, tables: true, extensions: showdown_ext });
const validator = require("validator");

const compile = async (text) => {
    const sanitized_text = validator.escape(text); // Sanitize user input
    let result_html = converter.makeHtml(sanitized_text);
    
    for (const ext of custom_ext) {
        result_html = await ext(result_html);
    }

    return result_html;
}

module.exports = compile;