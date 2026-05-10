// Warn the user that they are being redirected
const links = document.querySelectorAll("#content a");

const overlayHTML = `<div id="overlay_inner" class="pixel-box" style="padding: 5px 20px"><h2>Redirection warning.</h2> This post is trying to redirect you to: <a href="<%- url %>"><%= url %></a><br>Only click links from people <b>you trust</b><br><div style="display: flex; gap: 10px; align-items: center;"><a href="<%- url %>"><button style="margin: 15px 0px" class="btn btn-danger">Visit link</button></a><button id="overlay_close" class="btn btn-close">Close</button></div></div>`;
const overlayElem = document.getElementById("overlay");

for (let i = 0; i < links.length; i++) {
    const elem = links[i];
    const target = elem.href; // The link that the user tried to visit

    elem.addEventListener("click", e => {
        e.preventDefault();

        overlayElem.innerHTML = ejs.render(overlayHTML, { url: target });
        overlayElem.style.display = "block";

        // Add an event to close the overlay
        const closeElem = document.getElementById("overlay_close");
        closeElem.addEventListener("click", e => {
            overlayElem.style.display = "none";
        })
    })
}