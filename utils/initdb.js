const fs = require('node:fs');

module.exports = database => {
    const db_path = "./db/database.db";

    // Create the DB file if it doesn't exist.
    if (!fs.existsSync(db_path)) {
        fs.writeFile(db_path, {flags: "+a"});
    }

    database.exec(`
        CREATE TABLE IF NOT EXISTS posts (
            uid VARCHAR,
            username VARCHAR NOT NULL,
            content TEXT NOT NULL,
            permissions INTEGER,
            PRIMARY KEY (uid)
        )
    `)

    /* Permissions here is what the post can show.
    0 = regular posts (they should all be like this by default)
    1 = html allowed for username (no sanitization for the username when the page is rendered. THIS SHOULD ONLY BE USED TO CREATE OFFICIAL SITE PAGES, AS THIS CAN CAUSE XSS)
    2 = html allowed for content
    */
}