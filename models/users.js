const { Sequelize, Model, DataTypes } = require("sequelize");
const sequelize = require("./connection");

const Group = require("./groups");
const Post = require("./posts");

const User = sequelize.define("users", {
    uid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true // throwaway accounts don't have a password
    },
    // Unix timestamp
    creation_date: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    group: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,

        references: {
            model: Group,
            key: "id"
        }
    },
    // For special users, special css
    custom_css: {
        type: DataTypes.STRING,
        allowNull: true
    }
})

module.exports = User;