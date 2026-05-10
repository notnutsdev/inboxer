const post_id = document.querySelector("#post_id > span");
const notification = document.getElementById("post_id_copy_notification");

post_id.addEventListener("click", e => {
    navigator.clipboard.writeText(post_id.innerHTML);
    notification.style.display = "block";
    setTimeout(() => {
        notification.style.display = "none";
    }, 3000);
})