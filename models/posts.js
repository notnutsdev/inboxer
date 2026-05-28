const { Sequelize, Model, DataTypes } = require("sequelize");
const sequelize = require("./connection");

const User = require("./users");

const Post = sequelize.define("posts", {
    uid: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,

        references: {
            model: User,
            key: "uid"
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    }

    /* Permissions here is what the post can show.
    0 = regular posts (they should all be like this by default)
    1 = html allowed for username (no sanitization for the username when the page is rendered. THIS SHOULD ONLY BE USED TO CREATE OFFICIAL SITE PAGES, AS THIS CAN CAUSE XSS)
    2 = html allowed for content
    */
});

Post.belongsTo(User, {foreignKey: 'user_id'})

module.exports = Post;