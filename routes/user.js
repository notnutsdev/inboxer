// User related routes
const express = require('express');
const router = express.Router();
const middleware = require('./middleware');

const Post = require("../models/posts");
const User = require("../models/users");
const Settings = require('../models/settings');
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
        return res.render("blank.ejs", { error: "User not found.", user: req.session.user });
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
        return res.render("blank.ejs", { error: "The provided page number doesn't exist for this user.", user: req.session.user });
    }

    delete user.dataValues.password;

    res.render("profile.ejs", { user: req.session.user, profile: user, posts: posts, page: +page, total_pages: total_pages });
});

router.all("/settings", middleware.checkLogin);
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
    } else if (req.body.nsfw_checker == '') {
        const nsfw_checker = (req.body.nsfw_checker_activated == "on") ? true : false; // wherever the user has activated or disabled the nsfw checker

        await Settings.update({ nsfw_check: nsfw_checker },
            {
                where: {
                    user_id: req.session.user.uid
                }
            }
        );

        req.session.user.settings.nsfw_check = nsfw_checker;

    } else if (req.body.change_theme_color == '') {
        // Check that the provided body is a valid Hex color (sent by browsers by default)
        const theme_color = (req.body.theme_color) ? req.body.theme_color : "random";
        const hexcolor_regex = /^#[a-zA-Z0-9]{6}$/;

        if (theme_color != "random" && !theme_color.match(hexcolor_regex)) {
            return res.render("settings.ejs", { user: req.session.user, error: "Invalid color provided." });
        }
        
        await Settings.update(
            { theme_color: theme_color },
            {
                where: {
                    user_id: req.session.user.uid
                }
            }
        )

        req.session.user.settings.theme_color = theme_color;

    } /* For invalid settings */ else {
        return res.render("settings.ejs", { user: req.session.user, error: "Invalid setting." })
    }

    return res.render("settings.ejs", { user: req.session.user, success: "Updated settings!" });
})

// Delete account
router.all('/settings/deleteaccount', middleware.checkLogin);
router.get('/settings/deleteaccount', (req, res) => {
    return res.render("deleteaccount.ejs", { user: req.session.user });
})
router.post('/settings/deleteaccount', middleware.checkAltcha);
router.post('/settings/deleteaccount', async (req, res) => {
    const password = req.body.password;
    const confirm_sentence = req.body.confirmation_phrase; // the user must type "delete account" so that deleting an account cannot happen by mistake
    const delete_all_posts = req.body.delete_posts;

    if (!password || !confirm_sentence) {
        return res.render('deleteaccount.ejs', { error: "Please fill out all the inputs." })
    }

    if (confirm_sentence != "delete account") {
        return res.render('deleteaccount.ejs', { error: "Please enter 'delete account' in the confirmation field if you want to proceed." })
    }

    const user = await User.findOne({
        where: {
            uid: req.session.user.uid
        }
    });

    const passwords_match = bcrypt.compare(password, user.password);
    if (!passwords_match) {
        return res.render('deleteaccount.ejs', { error: "Invalid password." })
    }

    console.log(req.body)

    // Delete user posts if the user has checked the option
    if (delete_all_posts === "on") {
        await Post.destroy({
            where: {
                user_id: req.session.user.uid
            }
        })
    }

    // Delete the account
    await user.destroy(); // FIXME

    req.session.destroy();

    return res.render("blank.ejs", { success: "Account successfully deleted." })
});

module.exports = router;