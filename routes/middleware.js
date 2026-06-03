const { rateLimit } = require("express-rate-limit");

///// Reused middlewares
const middleware = {};

// Checks if the user is logged in and redirect them to the login page if not
middleware.checkLogin = (req, res, next) => {
    // Guard
    if (!req.session.user) {
        return res.redirect("/auth/login?redirect=" + req.route.path);
    }

    next();
}

// Checks if the user is logged out. If not, it redirects them to the index.
middleware.checkLogout = (req, res, next) => {
    if (req.session.is_logged_in) {
        return res.redirect("/");
    }

    next();
}

// Rate limiting
middleware.rateLimiter = rateLimit({
    windowMs: 12 * 1000,
    limit: 50,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    handler: (req, res, next, options) => {
        // Don't affect admins and mods
        if (req.session.user && req.ression.user.group >= 3) {
            return next();
        }

        return res.status(options.statusCode).render("ratelimit.ejs");
    }
})

// Captcha checking middleware (used for Altcha captchas)
middleware.checkAltcha = async (req, res, next) => {
    // If another middleware said to skip the captcha
    if (req.skipCaptcha) {
        return next();
    }

    const payload = req.body.altcha;

    if (!payload) return res.render("blank.ejs", { error: "Please click the captcha button." });

    const result = await fetch(req.protocol + "://" + req.get('host') + "/altcha/verify", {
        body: JSON.stringify({
        altcha: payload, // Base64-encoded ALTCHA payload
        }),
        headers: {
            'content-type': 'application/json',
        },
        method: 'POST',
    });

    if (result.status === 200) {
        return next();
    }

    res.status(result.status).render("blank.ejs", { error: "Invalid captcha." }); // i cannot do anything right; i hate who i am
}

module.exports = middleware;