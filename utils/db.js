// Database Utils
const User = require('../models/users');
const Post = require('../models/posts');

const dbutils = {};

dbutils.deleteUser = async (uid, deletePosts) => {
    // Delete user posts if the user has checked the option
    if (deletePosts === "on") {
        await Post.destroy({
            where: {
                user_id: uid
            }
        })
    }

    // Delete the account
    await User.update(
        { group: -1, password: null, username: "Deleted User" },
        {
            where: {
                uid: uid
            }
        }
    ); // We set the user group to the -1 group (Deleted Users) and delete his password
}

module.exports = dbutils;