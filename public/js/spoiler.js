// Spoilers like on Discord, to hide NSFW images


// Function to change each img's CORS to Anonymous
const setImgCORS = () => {
    for (let i = 0; i < images.length; i++) {
        const img = images[i];

        // Skip NSFW checker for images smaller than 200x200
        if (img.naturalHeight <= 200 && img.naturalWidth <= 200) {
            images.splice(i, 1); // remove the image from the "images to check" array
            img.style.filter = "none";
            continue;
        }

        img.crossOrigin = "anonymous";
    }
}

// function to know if an element has been scrolled by the user
const hasBeenScrolled = element => {
    const scroll = window.scrollY;
    const height = window.innerHeight;
    const offset = element.offsetTop;
    return (scroll+height >= offset) ? true : false;
}

// Checks wherever the provided image is NSFW. Calls the callback with true if the image is nsfw, or false if it isn't
const isNSFW = (img, success_call, error_call) => {
    model.classify(img)
    .then((predictions) => {
        // console.log("Predictions", predictions);

        const nsfw_level = predictions.filter(value => value.className == "Porn")[0].probability;
        const seggsy_level = predictions.filter(value => value.className == "Sexy")[0].probability;
        const hanime_level = predictions.filter(value => value.className == "Hentai")[0].probability;

        console.log(nsfw_level, seggsy_level, hanime_level)
        if (nsfw_level >= 0.40 || seggsy_level >= 0.40 || hanime_level >= 0.40) {
            success_call(true);
            return;
        }
        success_call(false);
    })
    .catch(error => error_call());
};

// Functions that check all the images of the page, and blurs the ones that are flagged as NSFW.
const checkAllImages = () => {
    if (!model) return; 

    if (!canCheckImg) return

    if (images.length == 0) {
        return document.scroll = null;
    };

    for (let i = 0; i < images.length; i++) {
        const elem = images[i];
        if (hasBeenScrolled(elem)) {
            // Create the overlay
            const width = elem.offsetWidth;
            const height = elem.offsetHeight;

            const overlay = document.createElement("div");
            overlay.classList.add("spoiler_overlay");
            overlay.style.height = height + "px";
            overlay.style.width = width + "px";
            overlay.style.top = elem.offsetTop + "px";
            overlay.style.left = elem.offsetLeft + "px";
            overlay.innerHTML = overlay_html;

            document.body.appendChild(overlay);
            overlay_list.push(overlay);

            isNSFW(elem, result => {
                if (result === true) {
                    overlay.innerHTML = warning_msg_html;
                } else {
                    document.body.removeChild(overlay);
                }
            }, error => {
                // Error callback, often because the image CORS doesn't allow anonymous.
                elem.src = "/img/broken_img.png";
                document.body.removeChild(overlay);
            });

            elem.style.filter = "none"; // Remove the precaution blur filter from the image.

            images.splice(i, 1);
            canCheckImg = true;
            return;
        }
    }
}

// Function that inits a model
const initModel = m => {
    model = m;

    checkAllImages();

    document.onscroll = e => checkAllImages();
}


// Images to check
const images = [...document.querySelectorAll("#content img:not(.no_scan)")];
const overlay_list = []; // List of overlays. Each overlay has the same index as the image it hides.

// HTML
const overlay_html = `<img src="/img/loading.gif" height="35px">`
const warning_msg_html = `<h3 style="margin: 0px">NSFW Content</h3><p>This image has been flagged as NSFW.</p><button class="btn" onclick="document.body.removeChild(this.parentElement)">See content</button>`

// So that only one image can be checked at a time
let canCheckImg = true;
// Model variable used to store the current model
let model;

// Setting the images CORS before loading the model as this function can filter out images that shouldn't be checked
setImgCORS();

if (images.length > 0) {
    //document.addEventListener("DOMContentLoaded", () => {
    // Try to load the model from cache (indexeddb)
    nsfwjs.load("indexeddb://MobileNetV2")
    .then(m => initModel(m))
    .catch(error => {
        // If it doesn't exist in the cache, load it normaly
        nsfwjs.load("MobileNetV2").then(m => {
            m.model.save("indexeddb://MobileNetV2"); // Save model to indexeddb for faster loading in the future
            initModel(m);
        });
    });
    //});
};
// This code sucks and i'll have to rewrite this in the future

// TODO:
// Cache scan results in localstorage or session storage, to not have to reload the model every time.
// Make everything async
// Make sure it checks for henta1 too