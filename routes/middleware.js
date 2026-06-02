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

module.exports = middleware;