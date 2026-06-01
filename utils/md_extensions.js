// Markdown extensions
const fs = require("node:fs");
const validator = require("validator");
const ejs = require("ejs");
const hljs = require("highlight.js");
// Site regex and formats used by the videoEmbed block
const siteFormats = require("./sites_embed");

// Utility functions
// For websites that change domains very often, find the parent domain (example: m1xdrop.click is just mixdrop.ag's video domain, but they rotate every week)
const parentDomains = {
    "mixdrop.ag": ["m1xdrop.click"],
    "doodstream.com": ["playmogo.com"]
}
const findParentDomain = domain => {
    for (const [key, value] of Object.entries(parentDomains)) {
        // If the domain is found in the parenDomains dict, return the parent domain
        if (value.indexOf(domain) > -1) {
            return key
        }
    }
    return domain
}

const extensions = {
    hrTag: {
        type: 'lang',
        regex: /=---=/g,
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
            const sitesRegex = /https:\/\/(?<link>((?<subdomain>[a-z0-9]*)\.)?(?<domain>[a-z0-9]*)\.(?<tld>[a-z]{1,10})\/(?<url>\S*))/;

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
                const full_domain = findParentDomain(domain + "." + tld); // Finds the correct domain for the provided website

                const embed_info = siteFormats[full_domain];
                if (!embed_info) return `Embedding videos from ${domain}.${tld} is not yet supported. You can request this site to be added by <a is-safe="true" href="/contact?subject=Add embed support for: ${domain}.${tld}">clicking here.</a>`; // Check that the provided URL is a supported site.
                
                const embed_match = link.match(embed_info.regex); // the final match (the one from embed info containing the video ID).
                if (!embed_match) return "Something unexpected happened while embedding your video.";

                const video_id = embed_match.groups.video_id;
                const clean_link = embed_match.groups.clean_link; // Final URL, without URL params or anything else.
                if (!video_id) return "Invalid URL format.";

                // NSFW content warning
                let nsfw_warning_div = "";
                if (embed_info.isNSFW) {
                    nsfw_warning_div = `<div class="content_warning"><h1>NSFW Content Warning</h1><p>This embedded video comes from a Not Safe For Work source.</p><button class="btn" onclick="this.parentElement.parentElement.removeChild(this.parentElement)">See content</button></div>`
                }

                // Popup warning
                let popup_warning_div = "";
                if (embed_info.hasPopups) {
                    popup_warning_div = `<div class="content_warning popup_warning"><h1>Warning</h1><p>This embed contains popups ads. We don't control any of these ads. Be careful when clicking and close any page that opens in another tab.</p><button class="btn btn-close" onclick="this.parentElement.parentElement.removeChild(this.parentElement)">I understand</button></div>`
                }

                return `<div class="embed_container">${nsfw_warning_div}${popup_warning_div}<div class="iframe-container"><iframe width="420" height="345" src="${embed_info.format.replace("{@video_id}", video_id)}">Your browser does not support iframes.</iframe></div><div class="iframe-info">External video embeded from <a href="https://${clean_link}">${domain}.${tld}</a></div></div>`
            })
        }
    },

    // Custom emoji extension
    emojis: {
        type: "lang",
        regex: /\:(?<emoji_code>[a-z0-9_]{1,20})\:/gm,
        filter: (text, converter) => {
            const regex = /\:(?<emoji_code>[a-z0-9_]{1,20})\:/gm;

            return text.replace(regex, (match, emoji_code) => {
                const allowed_ext = ["png", "gif"]; // File extensions to search for in the ./public/img/emojis folder

                // Try to find a file in the emoji folder with the right emoji code and a valid file extension
                let f_ext;
                for (let i = 0; i < allowed_ext.length; i++) {
                    const ext = allowed_ext[i];

                    if (fs.existsSync(__dirname + "/../public/img/emojis/" + emoji_code + "." + ext)) {
                        f_ext = ext;
                        break;
                    }
                };

                if (!f_ext) {
                    return `<span class="emoji"><img class="no_scan" src="/img/questionmark.png" title="Invalid emoji." height="25px"></span>`;
                };

                return `<span class="emoji"><img class="no_scan" src="/img/emojis/${emoji_code}.${f_ext}" title=":${emoji_code}:" height="25px"></span>`;
            })
        }
    },

    // Music player
    musicBlock: {
        type: "lang",
        regex: /\$\((?<music_url>\S{5,})\)/gm, // &(music_link_here)
        filter: (text, converter) => {
            text = validator.unescape(text);

            const musicblock_regex = /\&\((?<music_url>\S{5,})\)/gm;

            return text.replace(musicblock_regex, (match, music_url) => {
                const allowed_file_ext = ["mp3", "m4a"];

                if (!validator.isURL(music_url)) {
                    return "Invalid URL."
                };

                return `<div class="music-player"><audio controls src="${music_url}"></audio></div>`;
            })
        }
    }
}

// DOING: youtube video embedding (done) <- add more sites too

module.exports = extensions;