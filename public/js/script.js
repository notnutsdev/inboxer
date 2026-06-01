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