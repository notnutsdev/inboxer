const Post = require("./posts");
const User = require("./users");
const Group = require("./groups");
const Settings = require('./settings');
const sequelize = require("./connection");

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

    // Create each base group if they don't exist
    base_groups.forEach(async (value) => {
        const group = await Group.findOne({ where: { id: value.id } });

        if (!group) {
            Group.create(value);
        }
    });
};

module.exports = initModels;