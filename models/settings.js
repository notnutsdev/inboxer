const { Sequelize, Model, DataTypes } = require("sequelize");
const sequelize = require("./connection");

const User = require("./users");

// User settings table

const Settings = sequelize.define("settings", {
    // The ID of the user
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,

        references: {
            model: User,
            key: "uid"
        }
    },

    // Settings
    theme_color: { // the theme of the website
        type: DataTypes.STRING,
        allowNull: true,
        default: "random"
    },
    nsfw_check: { // wherever the nsfw checker should be activated or not
        type: DataTypes.BOOLEAN,
        allowNull: true,
        default: true
    }
});

Settings.belongsTo(User, {foreignKey: 'user_id'})

module.exports = Settings;