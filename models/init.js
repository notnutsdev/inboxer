const Post = require("./posts");
const User = require("./users");
const Group = require("./groups");
const Settings = require('./settings');
const sequelize = require("./connection");
const bcrypt = require('bcrypt');

const { DatabaseSync } = require('node:sqlite');
const sampledb = new DatabaseSync(__dirname + '/../db/sample.db');

// Function to init/sync all models
const initModels = async () => {
    await sequelize.sync();

    // Groups that should exist by default
    const base_groups = [
        { id: -1, name: "Deleted Users" },
        { id: 0, name: "Throwaway" },
        { id: 1, name: "Anonymous" },
        { id: 2, name: "Regular" },
        { id: 3, name: "Moderator" },
        { id: 4, name: "Administrator" }
    ];

    // Default users (start Admin user)
    const base_users = [
        { uid: 1, username: "Administrator", password: bcrypt.hashSync("password1!", 10), creation_date: Math.floor(Date.now()/1000), group: 4 }
    ]

    // Create each base group if they don't exist
    base_groups.forEach(async (value) => {
        const group = await Group.findOne({ where: { id: value.id } });

        if (!group) {
            Group.create(value);
        }
    });

    // Create the default users
    base_users.forEach(async (value) => {
        const user = await User.findOne({ where: { uid: value.uid } })

        if (!user) {
            await User.create(value);
        }
    });

    // Get and import all default posts
    console.log("Importing default posts.");
    const posts = sampledb.prepare("SELECT * FROM posts;").all();

    posts.forEach(async (value) => {
        const post = await Post.findOne({ where: { uid: value.uid } });

        if (!post) {
            await Post.create(value);
            console.log("Inserted post with ID: " + value.uid);
        }
    })
};

module.exports = initModels;