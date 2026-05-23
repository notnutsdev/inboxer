/*
General purpose components library (popovers, overlays etc)
*/

//// POPOVERS
// Function used to create popovers
export const createPopover = event => {
    // Create the actual element
    const popoverElement = document.createElement("div");
    popoverElement.classList.add("popover_container");

    // Put the popover at the right cordinates
    popoverElement.style.left = event.clientX + "px";
    popoverElement.style.top = event.clientY - 37 + "px";

    return popoverElement;
}

//// OVERLAYS
// Function used to create overlays
export const createOverlay = (removeDefaultCloseBtn) => {
    // If the user has specified that no close should be added to the element
    let closebtn = '<button id="overlay_close" onclick="closeOverlay();" class="btn btn-close">Close</button>';
    if (removeDefaultCloseBtn) {
        closebtn = ""
    }

    const overlay = document.createElement("div");
    overlay.id = "overlay";
    overlay.innerHTML = `<div id="overlay_inner" class="pixel-box" style="padding: 5px 20px">${closebtn}</div>`;

    return overlay;
}

// Close an overlay
document.body.addEventListener("mousedown", e => {
    const elem_id = e.target.id;

    if (elem_id == "overlay_close") {
        const overlay = document.getElementById("overlay");
        document.body.removeChild(overlay);
    }
})