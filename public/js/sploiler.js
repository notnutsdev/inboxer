// Spoilers like on Discord, to hide NSFW images

const images = document.querySelectorAll("#content img");
const overlay_html = `<img src="/img/loading.gif" height="35px">`

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
}