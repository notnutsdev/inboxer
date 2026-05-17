// Markdown extensions
const validator = require("validator");
const ejs = require("ejs");

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
    }
}

// TODO: add youtube video embedding
// TODO: add code synthax highlighting for ``````

module.exports = extensions;