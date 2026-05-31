import { createOverlay, createCloseBtn } from "./components.js";

// Text editor for the create post page
// Todo: have an array with previous states, so that when the user does ctrl + z, it goes back to a previous state

const controls = [...document.querySelectorAll("#editor_bar > *")]
const textarea = document.getElementById("content");

// Utility functions
const getPosition = () => {
    return {
        start: textarea.selectionStart,
        end: textarea.selectionEnd
    };
}

// Get the content from before, after and in between the position (must be a position object from getPosition)
const getContent = position => {
    return {
        before: textarea.value.substring(0, position.start),
        after: textarea.value.substring(position.end, textarea.value.length),
        between: textarea.value.substring(position.start, position.end)
    }
}

/* 
Options:
- `title` The title of the dialog window.
- `placeholder` The placeholder of the input field.
- `btn_text` The text of the green button.
*/
// TODO: have this component be able to show multiple fields with ..params
const createInputDialog = (options, successCallback) => {
    const overlay = createOverlay(true);
    const overlayInner = overlay.querySelector("#overlay_inner");
    overlayInner.innerHTML = `<h2>${options.title}</h2>`;

    const inputField = document.createElement("input");
    inputField.placeholder = options.placeholder;
    inputField.style = "background-color: #bbbbbb; margin-bottom: 15px;";

    const submitBtn = document.createElement("button");
    submitBtn.innerHTML = (options.btn_text) ? options.btn_text : "Add";
    submitBtn.classList.add("btn", "btn-success");

    const btn_row = document.createElement("div");
    btn_row.classList.add("btn-row");
    btn_row.append(submitBtn, createCloseBtn());

    overlayInner.append(inputField, btn_row);

    overlay.style.display = "block";
    document.body.appendChild(overlay);
    
    // Calling the successCallback if the user clicked "Add"
    submitBtn.addEventListener("click", e => {
        const val = inputField.value;

        if (!val) return;

        document.body.removeChild(overlay);
        successCallback(val);
    })
}

// Get clicks for each button of the text editor
controls.forEach(elem => elem.addEventListener("click", e => {
    const action = elem.attributes.action.value;

    textarea.focus(); // Focus the textarea if it isn't already

    // Cursor/selection position from the selected text in the textarea
    const position = getPosition();

    // Content from before, after and between selection
    const content = getContent(position);

    // For each block to decide the position of the selection afterwards.
    // new_pos_all so that the start and end cursor go to the given position
    // new_pos_start and new_pos_end for the start and end
    let new_pos_all, new_pos_start, new_pos_end;

    switch (action) {
        case "h1":
            // Put the cursor at the end of the new header newline
            new_pos_all = `${content.before}\n# `.length
            textarea.value = `${content.before}\n# ${content.after}`;
            break;
        case "h2":
            new_pos_all = `${content.before}\n## `.length
            textarea.value = `${content.before}\n## ${content.after}`;
            break;
        case "h3":
            new_pos_all = `${content.before}\n### `.length
            textarea.value = `${content.before}\n### ${content.after}`;
            break;
        case "b":
            new_pos_start = `${content.before}**`.length;
            new_pos_end = `${content.before}**${content.between}`.length;
            textarea.value = `${content.before}**${content.between}**${content.after}`;
            break;
        case "i":
            new_pos_start = `${content.before}*`.length;
            new_pos_end = `${content.before}*${content.between}`.length;
            textarea.value = `${content.before}*${content.between}*${content.after}`;
            break;
        case "u":
            new_pos_start = `${content.before}__`.length;
            new_pos_end = `${content.before}__${content.between}`.length;
            textarea.value = `${content.before}__${content.between}__${content.after}`;
            break;
        case "img":
            createInputDialog({ title: "Enter your image URL", placeholder: "Enter your URL here..." }, img_url => {
                new_pos_all = `${content.before}\n![image](${img_url})`.length;
                textarea.value = `${content.before}\n![image](${img_url})\n${content.after}`;
            });
            break;
        case "a":
            createInputDialog({ title: "Enter your URL", placeholder: "Enter your URL here..." }, link => {
                createInputDialog({ title: "Enter your URL placeholder", placeholder: "Enter your placeholder..." }, text => {
                    new_pos_all = `${content.before}\n[${text}](${link})`.length;
                    textarea.value = `${content.before}\n[${text}](${link})${content.after}`;
                });
            });
            break;
        case "video":
            createInputDialog({ title: "Enter a direct video URL", placeholder: "Enter your URL here..." }, src => {
                new_pos_all = `${content.before}\n?(video){${src}}`;
                textarea.value = `${content.before}\n?(video){${src}}\n${content.after}`;
            });
            break;
        case "code":
            createInputDialog({ title: "Enter your language (py, js, c...)", placeholder: "Enter your language..." }, language => {
                new_pos_all = `${content.before}\n\`\`\`${language}\n`.length;
                textarea.value = `${content.before}\n\`\`\`${language}\n\n\`\`\`\n${content.after}`;
            });
            break;
        case "embed":
            createInputDialog({ title: "Enter your video URL", placeholder: "Enter your URL..." }, embed_url => {
                new_pos_all = `${content.before}\n^^${embed_url}^^\n`.length;
                textarea.value = `${content.before}\n^^${embed_url}^^\n${content.after}`;
            });
            break;
        case "emoji":
            const emojiselect = document.getElementById("emojiselect");
            emojiselect.style.left = e.clientX - 100 + "px";
            emojiselect.style.top = e.clientY + 5 + "px";
            emojiselect.style.display = "block";
            break;
    }

    textarea.selectionStart = new_pos_all || new_pos_start || position.start;
    textarea.selectionEnd = new_pos_all || new_pos_end || position.end;
}))

// For indenting
textarea.addEventListener("keydown", e => {
    if (e.key == "Tab") {
        e.preventDefault();
        
        const position = getPosition();
        const content = getContent(position);

        textarea.value = `${content.before}\t${content.between}${content.after}`;

        textarea.selectionStart = `${content.before}\t`.length;
        textarea.selectionEnd = `${content.before}\t`.length;
    }
})

// To add emojis to the textinput when they are clicked
document.querySelectorAll("#emojiselect .emoji_box img").forEach(value => {
    value.addEventListener("click", e => {
        const position = getPosition();
        const content = getContent(position);

        const emoji_name = value.title;

        textarea.value = `${content.before}:${emoji_name}:${content.after}`; // adding the :emoji_name: to the textarea
        textarea.selectionStart = content.before.length;
        textarea.selectionEnd = `${content.before}:${emoji_name}:`.length;
    })
})