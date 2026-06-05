const express = require('express');
const router = express.Router();
const middleware = require('./middleware');

const User = require('../models/users');
const dbutils = require('../utils/db');
const redis = require('../utils/redis');

// Delete user endpoint
router.route("/ban")
.get(middleware.checkLogin)
.get(middleware.checkStaff) // Check that the user is logged in and that he is a staff member
.get(async (req, res) => {
    const uid = req.query.uid;
    const delete_posts = req.query.delete_posts;

    if (!uid) return res.render("blank.ejs", { error: "Please provide a uid param." });

    const user = await User.findOne({
        where: {
            uid: uid
        }
    });

    if (!user) return res.render("blank.ejs", { error: "User not found." });

    await dbutils.deleteUser(uid, (delete_posts === "true") ? true : false);

    try {
        await redis.del(`user-${uid}`) // Delete the user from cache, saying he's not active anymore
    } catch {};

    return res.render("blank.ejs", { success: "Banned user with ID: " + uid });
})

module.exports = router;