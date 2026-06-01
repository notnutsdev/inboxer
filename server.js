const express = require("express");
const session = require("express-session");
const app = express();

const sequelize = require("./models/connection");
const initModels = require("./models/init");
const Post = require("./models/posts");
const User = require("./models/users");

const showdown = require("showdown");
const md_ext = require("./utils/md_extensions");
const converter = new showdown.Converter({ tasklists: true, underline: true, strikethrough: true, parseImgDimensions: true, tables: true, extensions: [ md_ext.hrTag, md_ext.videoTag, md_ext.codeBlock, md_ext.videoEmbed, md_ext.emojis, md_ext.musicBlock ] });

const validator = require("validator");

const config = require("./config.json");
const banned_words = require("./banned_words.json");

const { Webhook, MessageBuilder } = require("discord-webhook-node");

const fs = require("node:fs");
const validation = require('./utils/validation'); // internal validation utility (This is NOT the validator package)


// Loading environment variables
process.loadEnvFile("./.env");

// Routers
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

// Setting ejs as our view engine
app.set("view engine", "ejs");

// Express middleware
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static("public"));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

// Registering routers
app.use('/auth', authRoutes);
app.use("/", userRoutes);

// Locals/Global variables
app.locals = config.locals;

// Getting all the emoji stems (files in the /public/img/emojis folder)
app.locals.emojis = [];
fs.readdirSync("./public/img/emojis").forEach(value => {
    const emoj_split = value.split("."); // to get the stem and file ext
    app.locals.emojis.push({ stem: emoj_split[0], file_ext: emoj_split[1] });
})


app.get("/", async (req, res) => {
    User.hasMany(Post, {foreignKey: 'user_id'})
    Post.belongsTo(User, {foreignKey: 'user_id'})

    const posts = await Post.findAll({
        order: sequelize.random(),
        limit: 5,
        include: [{
            model: User,
            required: true
        }]
    });

    res.render("index.ejs", { posts: posts, user: req.session.user });
})

app.get('/create', (req, res) => {
    res.render("create.ejs", { user: req.session.user });
})

app.post("/create", async (req, res) => {
    let user_id;
    let content = req.body.content;

    // Guards
    if (!content) {
        return res.render("create.ejs", { error: "Please enter some content." })
    }
    if (content.length < 5) {
        return res.render("create.ejs", { error: "Please enter more than 5 characters in the content field." })
    }

    for (let i = 0; i< banned_words.length; i++) {
        const word = banned_words[i];
        if (content.includes(word)) {
            return res.render("create.ejs", { error: "Your post contains banned words." });
        }
    }

    // For logged in users
    if (req.session.user) {
        user_id = req.session.user.uid;
    } /* For throwaway users */ else {
        const username = req.body.username;

        if (!username) {
            return res.render("create.ejs", { error: "Please enter a username" })
        }
        if (username.length > 30) return res.render("create.ejs", { error: "Username too long." });
        if (!validation.isValidUsername(username)) return res.render("create.ejs", { error: "Username can only contain letters (a-z), numbers and underscores." })

        const user = await User.create({ username: username, creation_date: Math.floor(Date.now()/1000), group: 0 });
        user_id = user.uid;
    }

    const uuid = crypto.randomUUID();

    content = converter.makeHtml(validator.escape(content));

    // Adding the record to the database
    const post = await Post.create({ uid: uuid, user_id: user_id, content: content });

    res.redirect("/post/" + uuid);
})

app.get('/post/:uid', async (req, res) => {
    const uid = req.params.uid;
    
    User.hasMany(Post, {foreignKey: 'user_id'})
    Post.belongsTo(User, {foreignKey: 'user_id'})

    const post = await Post.findOne({
        where: {
            uid: uid
        },
        include: [{
            model: User,
            required: true
        }]
    });

    if (!post) {
        return res.render("view.ejs", { error: "No post found for this ID." });
    }

    // Delete the user password
    delete post.dataValues.user.dataValues.password;

    // Open Graphs data for the post
    const og_data = {};
    // Get the text from the post (without the HTML tags) for Open Graphs meta tags
    og_data.description = post.dataValues.content.replace(/\<(.*?)\>/gm, "").trim().substring(0, 35) + "...";

    res.render("view.ejs", { post: post.dataValues, author: post.dataValues.user.dataValues, user: req.session.user, og_data: og_data });
});

app.get("/random", async (req, res) => {
    const post = await Post.findOne({ order: sequelize.random() });

    if (!post) return res.render("blank.ejs", { error: "No posts where found.", title: "Error" });

    res.redirect("/post/" + post.uid);
})

app.get("/report", (req, res) => {
    res.render("report.ejs", (req.query.post_id) ? { post_id: req.query.post_id } : {}); // If a post_id was provided in the query parameters, fill it in the post_id field
})

app.post("/report", (req, res) => {
    const post_id = req.body.post_id;
    const email = req.body.email;
    const message = req.body.message;

    // Check provided data
    if (!post_id || !email || !message) return res.render("report.ejs", { error: "Please fill out all form fields." });
    if (!validator.isEmail(email)) return res.render("report.ejs", { error: "Invalid email address." });
    if (5 > message.length || message.length > 3000) return res.render("report.ejs", { error: "Your message must be between 5 and 3000 characters." })
    
    // Check that the given post ID exists in the database to prevent useless reports.
    const post = Post.findOne({ where: { uid: post_id }});

    if (!post) return res.render("report.ejs", { error: "Post with this ID doesn't exist in our records." });

    const webhooks = process.env.DISCORD_WEBHOOKS.split(",");
    const hook_url = webhooks[Math.floor(Math.random() * webhooks.length)]; // Get a random webhook URL.

    // Sending the message with the webhook
    const hook = new Webhook(hook_url);
    const embed = new MessageBuilder()
    .setColor("#fff")
    .setTitle("New report")
    .setAuthor(`Sent by: ${email}`)
    .addField("Post ID", `\`${post_id}\``)
    .addField("Post link", `[click here](${req.protocol}://${req.hostname}/post/${post_id})`)
    .addField("Post author username:", `\`${post.username}\``)
    .addField("Report message", `\`\`\`${message}\`\`\``)
    .setTimestamp();

    hook.send(embed)
    .catch(() => res.render("report.ejs", { error: "An error occured while sending your request. Our systems might be overwelhmed. Please try again later or contact us on Discord." }));

    res.render("report.ejs", { success: "Your report was successfully sent to our team!<br>You will receive an email when we review the post." })
})

app.route("/contact")
.get((req, res) => {
    res.render("contact.ejs", { subject: (req.query.subject) ? validator.escape(req.query.subject) : null });
})
.post((req, res) => {
    const email = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;

    if (!email || !subject || !message) {
        return res.render("contact.ejs", { error: "Please fill our all the form fields." });
    };

    if (!validator.isEmail(email)) return res.render("contact.ejs", { error: "Invalid email address." });
    if (subject.length <= 5) return res.render("contact.ejs", { error: "Subject too short." });
    if (message.length <= 10 || message.length > 1500) return res.render("contact.ejs", { error: "Your message must be between 10 and 1500 characters. For longer messages, please send us an email." });

    const webhooks = process.env.CONTACT_WEBHOOKS.split(",");
    const hook_url = webhooks[Math.floor(Math.random() * webhooks.length)]; // Get a random webhook URL.

    // Sending the message with the webhook
    const hook = new Webhook(hook_url);
    const embed = new MessageBuilder()
    .setColor("#fff")
    .setTitle("Contact message")
    .setAuthor(`Sent by: ${email}`)
    .addField("Subject", `\`${subject}\``)
    .addField("Message", `\`\`\`${message}\`\`\``)
    .setTimestamp();

    hook.send(embed)
    .catch(() => { return res.render("contact.ejs", { error: "An error occured while sending your request. Our systems might be overwelhmed. Please try again later or contact us on Discord." })});

    res.render("contact.ejs", { success: "You message was sent to our teams. You'll receive a reply to your email as soon as we get to you." })
});

// Delete a post
app.get("/delete/:uid", async (req, res) => {
    const uid = req.params.uid;

    if (!req.session.user) {
        return res.redirect("/");
    }
    
    // Fix DRY here
    User.hasMany(Post, {foreignKey: 'user_id'})
    Post.belongsTo(User, {foreignKey: 'user_id'})
    ///////////////

    const post = await Post.findOne({
        where: {
            uid: uid
        },
        include: [{
            model: User,
            required: true
        }]
    });


    if (!post) return req.redirect("/");

    // If the user isn't the post author and isn't a mod/admin
    if (post.user.uid != req.session.user.uid && req.session.user.group < 3) {
        return res.redirect("/");
    }

    await Post.destroy({
        where: {
            uid: uid
        }
    });

    // Log everything to the webhook log channel
    const hook = new Webhook(process.env.STAFF_LOGS_WEBHOOK);
    const embed = new MessageBuilder()
    .setAuthor(`Action taken by: ${req.session.user.username}`)
    .setTitle("Post deleted")
    .setColor("#fff")
    .addField("Post ID", `\`${uid}\``)
    .addField("Action", "Deletion")
    .addField("Post Author", `\`${post.user.username}\``)
    .addField("Original content", `\`\`\`${post.content}\`\`\``)
    .setTimestamp();
    hook.send(embed);

    return res.render("blank.ejs", { success: "Deleted post with ID: " + uid });
})

// Logout the user
app.get("/logout", (req, res) => {
    if (!req.session.is_logged_in) {
        return res.redirect("/");
    }

    req.session.is_logged_in = false;
    delete req.session.user;
    res.render("blank.ejs", { success: "Successfully logged you out!" })
})

// Bonus pages
// Pages on the homepage
// In config.json's urls object, each key is a path and the value the ID of the post it should redirect to.
// Example: { "test": "ca04eaab-ffef-4515-a820-32368c626ac5" } redirects /test to /post/ca04eaab-ffef-4515-a820-32368c626ac5
for (const [key, value] of Object.entries(config.urls)) {
    app.get("/" + key, (req, res) => res.redirect("/post/" + value));
}

// Route to load libraries
app.get("/libraries/:file", (req, res) => {
    const fp = config.libraries[req.params.file];

    if (!fp) return res.status(404).send("404 not found");

    res.sendFile(__dirname + fp);
})


// Error handlers
app.use((req, res) => {
    // 404 page
    res.status(404).render("error_page.ejs", { status: 404, message: "Seems like you got lost. This page doesn't exist" });
})

// TODO: have routers instead of one big file

app.listen(8000, () => {
    console.log(`                  @@@@@@@@@@@@                  
             @@@@@@@@@@@@@@@@@@@@@@             
          @@@@@@@@@@@@@@@@@@@@@@@@@@@@          
       @@@@@@@@@@%:          :%@@@@@@@@@@       
    @@@@@@@@%#*:                .*#%@@@@@@@@    
    @@@@@*+=.          .=+++-   .=++++*@@@@@    
  @@@@@@%:             :%@@@%*: :%@@#=:%@@@@@@  
  @@@@@+..             ..+@@@@@+..+@@@%-+@@@@@  
 @@@@@%=                  .*@@@+  =%@@%:=%@@@@@ 
 @@@@%:                     +@@+   :%@%: :%@@@@ 
 @@@@%:                     :==:   .-=-. :%@@@@ 
 @@@@%:                                  :%@@@@ 
 @@@@%:.                                 :%@@@@ 
 @@@@@-...                               :%@@@@ 
 @@@@@=-:..                              :%@@@@ 
 @@@@@%*-::..                           =%@@@@@ 
  @@@@@#=-:..                           +@@@@@  
  @@@@@@@+--:::....                   :%@@@@@@  
    @@@@@##*=--:::..               .=+*@@@@@    
    @@@@@@@@%%#=--::..          .*##@@@@@@@@    
       @@@@@@@@@@%+-::.      :#@@@@@@@@@@       
          @@@@@@@@@@@@@@@@@@@@@@@@@@@@          
             @@@@@@@@@@@@@@@@@@@@@@             
                  @@@@@@@@@@@@@                 
                                                `)

    // Test the database connection
    try {
        sequelize.authenticate();
        console.log("Connection to database was successfull!");
    } catch (error) {
        throw new Error("Database connection failed.")
    }

    // Init models
    initModels();

    console.log("\x1b[32mRunning Inboxer!", "\x1b[0m")
    console.log('Port: 8000');
})