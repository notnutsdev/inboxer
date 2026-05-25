const { Sequelize, Model, DataTypes } = require("sequelize");
const sequelize = require("./connection");

const Post = sequelize.define("posts", {
    uid: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    permissions: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }

    /* Permissions here is what the post can show.
    0 = regular posts (they should all be like this by default)
    1 = html allowed for username (no sanitization for the username when the page is rendered. THIS SHOULD ONLY BE USED TO CREATE OFFICIAL SITE PAGES, AS THIS CAN CAUSE XSS)
    2 = html allowed for content
    */
})

module.exports = Post;