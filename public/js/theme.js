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
        return 0;
    }
    return color - difference;
}
// Take a color value (0-255) and convert it to a css rgb string
const colorToCssRGB = color => `rgb(${color.join(", ")})`
// Convert a hew color code to a rgb array
const hexToRGB = hex => {
    const hexcode_regex = /^#[a-zA-Z0-9]{6}$/;
    if (!hex.match(hexcode_regex)) return [124, 124, 124];

    hex = hex.replace("#", ""); // get rid of the #

    const hex_values = {"a": 10, "b": 11, "c": 12, "d": 13, "e": 14, "f": 15}; // rgb letter values

    let hex_index = 1; // wherever the loop if at the first value of a hex number of the second. First: #(f)fffff. Second: #f(f)ffff. I have no idea how to explain this
    let sum = 0;
    let result = [];

    for (let i = 0; i < hex.length; i++) {
        let char = hex[i];

        if (isNaN(char)) {
            char = hex_values[char.toLowerCase()];
        } else {
            char = +char; // convert num string to number
        }

        sum += (15 * hex_index + 1) * char;

        if (hex_index <= 0) {
            result.push(sum);
            hex_index = 1;
            sum = 0;
        } else {
            hex_index--;
        }
    }

    return result;
}


let color;
try {
    color = hexToRGB(user_theme_color);
} catch {
    color = [randomColorVal(), randomColorVal(), randomColorVal()];
}

const colorisePage = color => {
    const lightColors = [lightenColor(color[0]), lightenColor(color[1]), lightenColor(color[2])];
    const darkColors = [darkerColor(color[0]), darkerColor(color[1]), darkerColor(color[2])];

    document.documentElement.style.background = colorToCssRGB(lightColors); // Set the lighter color as the page's bg
    document.documentElement.style.setProperty("--pixel-bg", colorToCssRGB(color)); // Set the color as the --pixel-bg css var
    document.documentElement.style.setProperty("--secondary-color", colorToCssRGB(darkColors)); // Set the dark color as the dark-color css variable
}

console.log(color, typeof color)
colorisePage(color);