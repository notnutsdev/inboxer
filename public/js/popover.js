// Script to show popover content
// This works with elements that have the .popover class and the popover_content attribute
// triska.xyz
// fuck sam altman

// TODO: have one javascript file with all the useful items (popover, overlays etc) so that they can be used more easily.

const popovers = document.getElementsByClassName("popover");

// Function used to create popover items
const createPopover = event => {
    // Create the actual element
    const popoverElement = document.createElement("div");
    popoverElement.classList.add("popover_container");

    // Put the popover at the right cordinates
    popoverElement.style.left = event.clientX + "px";
    popoverElement.style.top = event.clientY - 37 + "px";

    return popoverElement;
}

for (let i = 0; i < popovers.length; i++) {
    const element = popovers[i];

    element.addEventListener("click", e => {
        // Create the popover element
        const popoverDiv = createPopover(e);

        popoverDiv.innerHTML = element.attributes.popover_content.value;
        
        // Add it to the page
        document.body.appendChild(popoverDiv)

        // Event to remote it
        document.onmousedown = e => {
            document.body.removeChild(popoverDiv);
            document.onmousedown = null;
        }
    })
}