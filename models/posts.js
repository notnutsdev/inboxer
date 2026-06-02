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

    content_html: { // The post's compiled HTML
        type: DataTypes.TEXT,
        allowNull: false
    },
    content_text: { // The post's text content (markdown)
        type: DataTypes.TEXT,
        allowNull: false
    },
    
    created_at: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    updated_at: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

Post.belongsTo(User, {foreignKey: 'user_id'})

module.exports = Post;