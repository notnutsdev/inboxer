// Elements
const pixelBorderContainers = document.getElementsByClassName("pixel-border");

///// Functions
// Generate a random rgb value (between 127 and 255)
const randomColorVal = () => Math.round(127 + Math.random() * (255 - 127))
// Makes a lighter variant of the given color (+difference brighter)
const lightenColor = (color, difference) => {
    if (!difference) { difference = 35 };

    if (color + difference > 255) {
        return 255
    }
    return color + difference
}
// Makes a color darker
const darkerColor = (color, difference) => {
    if (!difference) { difference = 35 };

    if (color - difference < 0) {
        return 0
    }
    return color - difference
}
// Take a color value (0-255) and convert it to a css rgb string
const colorToCssRGB = color => `rgb(${color.join(", ")})`

const color = [randomColorVal(), randomColorVal(), randomColorVal()];
const lightColors = [lightenColor(color[0]), lightenColor(color[1]), lightenColor(color[2])];
const darkColors = [darkerColor(color[0]), darkerColor(color[1]), darkerColor(color[2])];

document.documentElement.style.background = colorToCssRGB(lightColors); // Set the lighter color as the page's bg
document.documentElement.style.setProperty("--pixel-bg", colorToCssRGB(color)); // Set the color as the --pixel-bg css var
document.documentElement.style.setProperty("--secondary-color", colorToCssRGB(darkColors)); // Set the dark color as the dark-color css variable


for (let i = 0; i < pixelBorderContainers.length; i++) {
    const elem = pixelBorderContainers[i];
    elem.style.background = colorToCssRGB(color); // Set the color as the bg

    /* changes every element's color
    const boxShadow = `0 calc(var(--pixel) * -3) 0 calc(var(--pixel) * -1) ${color}, 0 calc(var(--pixel) * 3) 0 calc(var(--pixel) * -1) ${color}, 0 calc(var(--pixel) * -6) 0 calc(var(--pixel) * -2) ${color}, 0 calc(var(--pixel) * 6) 0 calc(var(--pixel) * -2) ${color}, 0 calc(var(--pixel) * -9) 0 calc(var(--pixel) * -4) ${color}, 0 calc(var(--pixel) * 9) 0 calc(var(--pixel) * -4) ${color}, 0 calc(var(--pixel) * -12) 0 calc(var(--pixel) * -6) ${color}, 0 calc(var(--pixel) * 12) 0 calc(var(--pixel) * -6) ${color}, calc(var(--pixel) * -1) 0 0 0 var(--pixel-border), var(--pixel) 0 0 0 var(--pixel-border), 0 calc(var(--pixel) * -2) 0 0 var(--pixel-border), 0 calc(var(--pixel) * 2) 0 0 var(--pixel-border), 0 calc(var(--pixel) * -5) 0 calc(var(--pixel) * -1) var(--pixel-border), 0 calc(var(--pixel) * 5) 0 calc(var(--pixel) * -1) var(--pixel-border), 0 calc(var(--pixel) * -7) 0 calc(var(--pixel) * -2) var(--pixel-border), 0 calc(var(--pixel) * 7) 0 calc(var(--pixel) * -2) var(--pixel-border), 0 calc(var(--pixel) * -10) 0 calc(var(--pixel) * -4) var(--pixel-border), 0 calc(var(--pixel) * 10) 0 calc(var(--pixel) * -4) var(--pixel-border), 0 calc(var(--pixel) * -13) 0 calc(var(--pixel) * -6) var(--pixel-border), 0 calc(var(--pixel) * 13) 0 calc(var(--pixel) * -6) var(--pixel-border), calc(var(--pixel) * -2) 0 0 0 var(--pixel-border-2), calc(var(--pixel) * 2) 0 0 0 var(--pixel-border-2), 0 calc(var(--pixel) * -1) 0 var(--pixel) var(--pixel-border-2), 0 var(--pixel) 0 var(--pixel) var(--pixel-border-2), 0 calc(var(--pixel) * -4) 0 0 var(--pixel-border-2), 0 calc(var(--pixel) * 4) 0 0 var(--pixel-border-2), 0 calc(var(--pixel) * -6) 0 calc(var(--pixel) * -1) var(--pixel-border-2), 0 calc(var(--pixel) * 6) 0 calc(var(--pixel) * -1) var(--pixel-border-2), 0 calc(var(--pixel) * -8) 0 calc(var(--pixel) * -2) var(--pixel-border-2), 0 calc(var(--pixel) * 8) 0 calc(var(--pixel) * -2) var(--pixel-border-2), 0 calc(var(--pixel) * -11) 0 calc(var(--pixel) * -4) var(--pixel-border-2), 0 calc(var(--pixel) * 11) 0 calc(var(--pixel) * -4) var(--pixel-border-2), 0 calc(var(--pixel) * -14) 0 calc(var(--pixel) * -6) var(--pixel-border-2), 0 calc(var(--pixel) * 14) 0 calc(var(--pixel) * -6) var(--pixel-border-2), calc(var(--pixel) * -3) 0 0 0 var(--pixel-border-3), calc(var(--pixel) * 3) 0 0 0 var(--pixel-border-3), 0 0 0 calc(var(--pixel) * 2) var(--pixel-border-3), 0 calc(var(--pixel) * -3) 0 var(--pixel) var(--pixel-border-3), 0 calc(var(--pixel) * 3) 0 var(--pixel) var(--pixel-border-3), 0 calc(var(--pixel) * -5) 0 0 var(--pixel-border-3), 0 calc(var(--pixel) * 5) 0 0 var(--pixel-border-3), 0 calc(var(--pixel) * -7) 0 calc(var(--pixel) * -1) var(--pixel-border-3), 0 calc(var(--pixel) * 7) 0 calc(var(--pixel) * -1) var(--pixel-border-3), 0 calc(var(--pixel) * -9) 0 calc(var(--pixel) * -2) var(--pixel-border-3), 0 calc(var(--pixel) * 9) 0 calc(var(--pixel) * -2) var(--pixel-border-3), 0 calc(var(--pixel) * -12) 0 calc(var(--pixel) * -4) var(--pixel-border-3), 0 calc(var(--pixel) * 12) 0 calc(var(--pixel) * -4) var(--pixel-border-3), 0 calc(var(--pixel) * -15) 0 calc(var(--pixel) * -6) var(--pixel-border-3), 0 calc(var(--pixel) * 15) 0 calc(var(--pixel) * -6) var(--pixel-border-3)`
    elem.style.boxShadow = boxShadow; // Same for the box shadow
    */
}