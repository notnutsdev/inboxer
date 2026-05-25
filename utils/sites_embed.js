// How each supported site's embed URL should look like
// Every {@video_id} will be replaced by the video ID.
// hasPopups indicates to the site if a warning should be shown when showing a iframe with this.
// isNSFW indicates if this is a NSFW site.
// Used by md_extensions's videoEmbed block
module.exports = {
    "youtube.com": {
        regex: /(?<clean_link>(?<domain>youtube\.com)\/watch\?v=(?<video_id>[a-zA-Z0-9\-_]{6,}))/,
        format: "https://www.youtube.com/embed/{@video_id}",
        hasPopups: false
    },
    "youtu.be": {
        regex: /(?<clean_link>(?<domain>youtu\.be)\/(?<video_id>[a-zA-Z0-9\-_]{5,}))/,
        format: "https://www.youtube.com/embed/{@video_id}",
        hasPopups: false
    },
    "kick.com": {
        regex: /(?<clean_link>(?<domain>kick\.com)\/(?<video_id>[a-zA-Z0-9_]{1,25}))/,
        format: "https://player.kick.com/{@video_id}",
        hasPopups: false
    },

    // popup sites
    "abyssplayer.com": {
        regex: /(?<clean_link>(?<domain>abyssplayer\.com)\/(?<video_id>\S{6,}))/,
        format: "https://abyssplayer.com/{@video_id}",
        hasPopups: true
    },
    "mixdrop.ag": {
        regex: /(?<clean_link>(www\.)?(?<domain>[a-z0-9]{1,25}\.[a-z0-9]{1,15})\/(f|e)\/(?<video_id>[a-zA-Z0-9]{1,35}))/,
        format: "https://mixdrop.top/e/{@video_id}",
        hasPopups: true
    },

    // nsfw sites
    "tube8.com": {
        regex: /(?<clean_link>(www\.)?(?<domain>tube8\.com)\/porn-video\/(?<video_id>[0-9]{1,25}))/,
        format: "https://www.tube8.com/embed/{@video_id}",
        isNSFW: true
    }
}