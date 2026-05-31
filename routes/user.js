// User related routes
const express = require('express');
const router = express.Router();

const Post = require("../models/posts");
const User = require("../models/users");

// User profile page
router.get("/user/:username", async (req, res) => {
    const username = req.params.username;
    const page = req.query.page || 1;
    const posts_per_page = 10; // The number of posts to display per page

    if (isNaN(page) && isNaN(parseFloat(page))) {
        return res.render("blank.ejs", { error: "Page must be a number." });
    }

    if (+page <= 0) {
        return res.render("blank.ejs", { error: "Page must be greater then 0." });
    }

    const user = await User.findOne({
        where: {
            username: username
        }
    });

    if (!user) {
        return res.render("blank.ejs", { error: "User not found." });
    }

    // Getting the user's posts
    const posts = await Post.findAll({
        where: {
            user_id: user.uid
        },
        offset: (page-1)*10,
        limit: posts_per_page
    });

    // Getting the total post count
    const total_post_count = await Post.count({
        where: {
            user_id: user.uid
        }
    });

    // Total number of pages from that specific user
    const total_pages = Math.ceil(total_post_count/posts_per_page);

    if (total_pages >= 1 && page > total_pages) {
        return res.render("blank.ejs", { error: "The provided page number doesn't exist for this user." });
    }

    delete user.dataValues.password;

    res.render("profile.ejs", { user: user, posts: posts, page: +page, total_pages: total_pages });
});

router.all("/settings", (req, res, next) => {
    // Guard
    if (!req.session.user) {
        return res.redirect("/auth/login");
    }

    next();
})
router.get('/settings', async (req, res) => {
    res.render("settings.ejs", { user: req.session.user });
})

module.exports = router;