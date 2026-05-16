// Text editor for the create post page
// Todo: have an array with previous states, so that when the user does ctrl + z, it goes back to a previous state

const controls = [...document.querySelectorAll("#editor_bar > *")]
const textarea = document.getElementById("content");

controls.forEach(elem => elem.addEventListener("click", e => {
    const action = elem.attributes.action.value;
    console.log(action)

    textarea.focus();

    // The selected text in the textarea
    const position = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd
    };

    // Content from before, after and between selection
    const content = {
        before: textarea.value.substring(0, position.start),
        after: textarea.value.substring(position.end, textarea.value.length),
        between: textarea.value.substring(position.start, position.end)
    }

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
            const img_url = prompt("Please enter your image's URL (you can host it in imx.to for example)"); // Todo: have a real box that shows up on the DOM and not just a prompt
            
            if (!img_url) return;
            
            new_pos_all = `${content.before}\n![image](${img_url})`.length;
            textarea.value = `${content.before}\n![image](${img_url})\n${content.after}`;
            break;
        case "a":
            const link = prompt("Please enter your link"); // Todo: have a real box that shows up on the DOM and not just a prompt
            const text = prompt("Please enter the text that should be displayed for your link");
            
            if (!link || !text) return;
            
            new_pos_all = `${content.before}\n[${text}](${link})`.length;
            textarea.value = `${content.before}\n[${text}](${link})${content.after}`;
            break;
    }

    textarea.selectionStart = new_pos_all || new_pos_start || position.start;
    textarea.selectionEnd = new_pos_all || new_pos_end || position.end;
}))