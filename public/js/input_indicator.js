import { createInputIndicator } from "./components.js";

const inputs = [...document.querySelectorAll("input[indicator-data]")];

inputs.forEach(elem => {
    elem.addEventListener("focus", e => {
        const indicator = createInputIndicator(elem);
        document.body.appendChild(indicator);

        elem.onblur = e => {
            document.body.removeChild(indicator);
            elem.onblur = null;
        }
    })
})