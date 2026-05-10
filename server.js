const express = require("express");
const app = express();
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync("./db/database.db");
const initDB = require("./utils/initdb");
const showdown = require("showdown");
const converter = new showdown.Converter();
const validator = require("validator");
const config = require("./config.json");

// Setting ejs as our view engine
app.set("view engine", "ejs");

// Express middleware
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static("public"));

app.get("/", (req, res) => {
    const posts = db.prepare("SELECT * FROM posts ORDER BY RANDOM() LIMIT 5;").all();
    res.render("index.ejs", { posts: posts });
})

app.get('/create', (req, res) => {
    res.render("create.ejs");
})

app.post("/create", (req, res) => {
    const username = req.body.username;
    let content = req.body.content;

    if (!username) {
        return res.render("create.ejs", { error: "Please enter a username" })
    } else if (!content) {
        return res.render("create.ejs", { error: "Please enter some content." })
    }

    if (username.length > 100) return res.render("create.ejs", { error: "Username too long." });

    const uuid = crypto.randomUUID();

    content = converter.makeHtml(validator.escape(content));

    db.exec(`
        INSERT INTO posts (uid, username, content, permissions) VALUES ('${uuid}', '${validator.escape(username)}', '${content}', 0);
    `);

    res.redirect("/post/" + uuid);
    // res.send(`Successfully created post! ${uuid}`);
})

app.get('/post/:uid', (req, res) => {
    const uid = req.params.uid;
    const post = db.prepare(`SELECT * FROM posts WHERE uid = '${uid}';`).all()[0];
    
    if (!post) {
        return res.render("view.ejs", { error: "No post found for this ID." });
    }

    res.render("view.ejs", post);
})

app.get("/random", (req, res) => {
    const post = db.prepare("SELECT * FROM posts ORDER BY RANDOM() LIMIT 1;").all()[0];
    res.redirect("/post/" + post.uid);
})

// Pages on the homepage
app.get("/rules", (req, res) => res.redirect("/post/" + config.urls.rules));
app.get("/formatting", (req, res) => res.redirect("/post/" + config.urls.formatting));

app.listen(8000, () => {
    initDB(db);
    console.log('Ready on port: 8000');
})