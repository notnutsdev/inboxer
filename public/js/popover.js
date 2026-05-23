// Script to show popover content
// This works with elements that have the .popover class and the popover_content attribute
// triska.xyz
// fuck sam altman

import { createPopover } from "./components.js";

const popovers = document.getElementsByClassName("popover");

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