// Markdown extensions
const validator = require("validator");
const ejs = require("ejs");
const hljs = require("highlight.js");

const extensions = {
    hrTag: {
        type: 'lang',
        regex: /---/g,
        replace: '<hr>'
    },

    videoTag: {
        type: "lang",
        regex: /\?\((?<=\()(.*?)(?=\))\)\{(?<=\{)(.*?)(?=\})\}/g, // Video tags in inboxer md are in this format: ?(video_title){video_src}
        filter: (text, converter) => {
            const regex = /\?\((?<=\()(.*?)(?=\))\)\{(?<=\{)(.*?)(?=\})\}/g // ?(video_title){video_src}

            return text.replace(regex, (match, video_title, video_src) => {
                video_src = validator.unescape(video_src); // unescape the video src link

                // If the user has precised that the video is NSFW, pass it to the render
                let is_nsfw;
                if (video_title.split("=")[1] == "nsfw" || video_title.split("=")[1] == "NSFW") {
                    is_nsfw = true;
                }
                
                if (!validator.isURL(video_src)) return "Invalid video URL." // Make sure the src is a valid URL

                let src_end_url = video_src.match(/[^/]+(?=\/$|$)/g)[0]; // Get the end of the video's src to make sure it's a file and that it ends in .mp4 or .mkv
                src_end_url = src_end_url.split("?")[0]; // Removing the URL params if any

                const allowed_extensions = ['.mp4', '.mkv']; // Allowed video file extensions

                // If the URL's extension isn't in the allowed_extensions, pass
                if (!allowed_extensions.includes(src_end_url.slice(-4, src_end_url.length))) return "Invalid video URL. Must be a direct video link."

                // Render the template
                let result_html;
                ejs.renderFile(__dirname + "/../views/markdown/video.ejs", { src: video_src, title: video_title.replace(" ", "_"), is_nsfw: is_nsfw }, {}, (err, data) => {
                    if (err) {
                        result_html = "Failed to render your video link. :("
                        return;
                    }

                    result_html = data; 
                });

                return result_html;
            })
        }
    },

    codeBlock: {
        type: "lang",
        regex: /&#96;&#96;&#96;(.*)((.|\n)*)&#96;&#96;&#96;/gm, // For code blocks, format ```<language>\n code here```    ---- /```(.*)((.|\n)*)```/gm
        filter: (text, converter) => {
            const regex = /&#96;&#96;&#96;(.*)((.|\n)*)&#96;&#96;&#96;/gm; // Here, we use the HTML code instead of the `, as we escape the input before we convert it.

            // Language is the prefered language by the user and code the actual content of the code block
            return text.replace(regex, (match, language, code) => {
                // Check that the language the user has provided exists
                if (!hljs.getLanguage(language)) {
                    language = "txt"; // we set it to text so that it just comes out plain
                }

                const language_name = hljs.getLanguage(language).name;
                const code_html = hljs.highlight(validator.unescape(code), { language: language }).value;

                let result_html;
                ejs.renderFile(__dirname + "/../views/markdown/codeblock.ejs", { language: language_name, code: code_html, raw_code: code }, {}, (err, data) => {
                    if (err) {
                        result_html = "Failed to compile your code to HTML.";
                    }

                    result_html = data;
                })

                return result_html;
            })
        }
    },

    videoEmbed: {
        type: "lang",
        regex: /\^\^https:&#x2F;&#x2F;(\S*)\^\^/gm,
        filter: (text, converter) => {
            const regex = /\^\^(\S*)\^\^/gm;

            // Regex for all sites
            // https:\/\/((?<subdomain>[a-z]*)\.)?(?<domain>[a-z]*)\.(?<tld>[a-z]{1,3})\/(?<url>\S*)
            const sitesRegex = /https:\/\/(?<link>((?<subdomain>[a-z]*)\.)?(?<domain>[a-z]*)\.(?<tld>[a-z]{1,3})\/(?<url>\S*))/;

            // How each supported site's embed URL should look like
            // Every {@video_id} will be replaced by the video ID.
            // hasPopups indicates to the site if a warning should be shown when showing a iframe with this.
            const siteFormats = {
                "youtube": {
                    regex: /(www\.(?<domain>youtube\.com)\/watch\?v=(?<video_id>[a-zA-Z0-9]{6,}))/,
                    format: "https://www.youtube.com/embed/{@video_id}",
                    hasPopups: false
                },
                "abyssplayer": {
                    regex: /((?<domain>abyssplayer\.com)\/(?<video_id>\S{6,}))/,
                    format: "https://abyssplayer.com/{@video_id}",
                    hasPopups: true
                }
            }

            return text.replace(regex, (match, embed_url) => {
                embed_url = validator.unescape(embed_url); // unescape the url

                // Testing that the URL is a valid URL.
                if (!sitesRegex.test(embed_url)) {
                    return "Invalid embed URL.";
                }

                const matches = embed_url.match(sitesRegex);
                const domain = matches.groups.domain; // the domain of the attempted URL embed
                const tld = matches.groups.tld; // the domain tld
                const link = matches.groups.link; // the link of the embed, without https://

                const embed_info = siteFormats[domain];
                if (!embed_info) return "Embedding videos from this site is not yet supported."; // Check that the provided URL is a supported site.

                const embed_match = link.match(embed_info.regex);
                console.log(link, embed_match)
                const video_id = embed_match.groups.video_id;

                if (!video_id) return "Invalid URL format.";

                return `<div style="max-width: 600px;"><div class="iframe-container"><iframe width="420" height="345" src="${embed_info.format.replace("{@video_id}", video_id)}" has-popups="${embed_info.hasPopups}">Your browser does not support iframes.</iframe></div><div class="iframe-info">External video embeded from <a href="${embed_url}">${domain}.${tld}</a></div></div>`
            })
        }
    }
}

// DOING: youtube video embedding (done) <- add more sites too

module.exports = extensions;