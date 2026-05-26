import { createOverlay } from "./components.js";

// Warn the user that they are being redirected
const links = document.querySelectorAll("#content a");

const overlayHTML = `<h2>Redirection warning.</h2> This post is trying to redirect you to: <a href="<%- url %>"><%= url %></a><br>Only click links from people <b>you trust</b><br><div class="btn-row"><a href="<%- url %>"><button style="margin: 15px 0px" class="btn btn-danger">Visit link</button></a><button id="overlay_close" class="btn btn-close">Close</button></div>`;

for (let i = 0; i < links.length; i++) {
    const elem = links[i];
    const target = elem.href; // The link that the user tried to visit

    // If the link is a reference to another element of the post (refers to another element's ID), don't add the redirect warning.
    if (target.match(/#\w+/g) && document.querySelector(`#content ${target}`)) continue;
    if (elem.attributes['is-safe'] && elem.attributes['is-safe'].value == "true") continue; // if the link is marked as safe (this should be preferably for internal links only) skip it

    elem.addEventListener("click", e => {
        e.preventDefault();

        const overlayElem = createOverlay(true);
        const overlayInner = overlayElem.querySelector("#overlay_inner");
        overlayElem.style.display = "block";

        overlayInner.innerHTML = ejs.render(overlayHTML, { url: target });

        document.body.appendChild(overlayElem);
    })
}
