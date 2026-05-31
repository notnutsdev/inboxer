// User related routes
const express = require('express');
const router = express.Router();

const Post = require("../models/posts");
const User = require("../models/users");
const bcrypt = require("bcrypt");

const { Op } = require("sequelize");

const validation = require('../utils/validation');

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
            username: username,
            group: {
                [Op.ne]: 0
            }
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
        return res.redirect("/auth/login?redirect=/settings");
    }

    next();
})
router.get('/settings', async (req, res) => {
    res.render("settings.ejs", { user: req.session.user });
})
router.post("/settings", async (req, res) => {
    const user = await User.findOne({
        where: {
            uid: req.session.user.uid
        }
    });

    if (!user) return res.render('blank.ejs', { error: "Invalid session. Please log out and back in again." })

    // Each individual setting
    if (req.body.change_password == '') {
        const current_password = req.body.current_password;
        const new_password = req.body.new_password;

        if (!current_password || !new_password) {
            return res.render('settings.ejs', { error: "Please enter your current, and new password." });
        }

        if (!bcrypt.compareSync(current_password, user.password)) {
            return res.render('settings.ejs', { error: "Invalid password." });
        }

        if (!validation.isStrongPassword(new_password)) {
            return res.render('settings.ejs', { error: "New password is not strong enough." });
        }

        if (bcrypt.compareSync(new_password, user.password)) {
            return res.render('settings.ejs', { error: "New password cannot be the same as the current password." });
        }

        const saltRounds = 10;
        const password_hash = await bcrypt.hash(new_password, saltRounds);

        await User.update(
            { password: password_hash },
            {
                where: {
                    uid: user.uid
                }
            }
        );

        return res.render("settings.ejs", { success: "Updated password!" });
    }

    res.render("settings.ejs", { error: "Invalid setting." })
})

module.exports = router;