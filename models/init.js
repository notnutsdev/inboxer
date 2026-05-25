const Post = require("./posts");

const models = [Post];

// Function to init/sync all models
const initModels = () => {
    models.forEach(value => {
        value.sync();
    })
};

module.exports = initModels;