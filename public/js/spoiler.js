// Spoilers like on Discord, to hide NSFW images

const images = document.querySelectorAll("#content img");
const overlay_html = `<img src="/img/loading.gif" height="35px">`
const warning_msg_html = `<h3 style="margin: 0px">NSFW Content</h3><p>This image has been flagged as NSFW.</p><button class="btn" onclick="document.body.removeChild(this.parentElement)">See content</button>`

const img_overlays = [];

document.addEventListener("DOMContentLoaded", () => {
    if (images) {
        // Add a black overlay over each image
        for (let i = 0; i < images.length; i++) {
            const element = images[i];

            // Getting the element's dimensions
            const width = element.offsetWidth;
            const height = element.offsetHeight;

            const overlay = document.createElement("div");
            overlay.classList.add("spoiler_overlay");
            overlay.style.height = height + "px";
            overlay.style.width = width + "px";
            overlay.style.top = element.offsetTop + "px";
            overlay.style.left = element.offsetLeft + "px";
            overlay.innerHTML = overlay_html;

            document.body.appendChild(overlay);
            img_overlays.push(overlay);
        }

        // Predict each img element
        nsfwjs.load("MobileNetV2").then((model) => {
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                img.crossOrigin = "anonymous";

                // Classify the image.
                model.classify(img).then((predictions) => {
                    console.log(predictions)
                    // Remove overlay if the img isn't NSFW
                    const corn_level = predictions.filter(v => v.className == "Porn")[0].probability;
                    const seggsy_level = predictions.filter(v => v.className == "Sexy")[0].probability;

                    if (corn_level >= 0.50 || seggsy_level >= 0.55) {
                        img_overlays[i].innerHTML = warning_msg_html;
                    } else {
                        document.body.removeChild(img_overlays[i]);
                    }
                });

                // Remote the security blur filter
                img.style.filter = "none";
            };
        })
    }
})