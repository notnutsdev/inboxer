# ![logo](./public/img/logo.png) Inboxer
Anonymous text sharing platform, with style.

## Dev branch todo list:
- [ ] User profile pages

## Features
- Markdown posts
- Report system
- Staff accounts
- Automatic NSFW content detection

## Planned features
- [x] Text editor with buttons
- [ ] User accounts
- [ ] Edit/delete posts
- [ ] More formatters

## This site uses:
- [Express](https://expressjs.com/) as a backend web framework
- [EJS](https://ejs.co) as a template engine
- [Showdown](https://github.com/showdownjs/showdown) for markdown to HTML conversion.
- [Highlight.js](https://highlightjs.org) for synthax highlighting in code blocks.
- [NSFW.JS](https://github.com/infinitered/nsfwjs) for indecent content checking.
- [validator](https://www.npmjs.com/package/validator) for data validation/sanitization.

## Config docs
- `urls`
> Represents special redirect pages. Each key is the URL path and the value the ID of the post this page should point to. For example, `/formatting` will redirect to `/post/<the id you enter in config.json>`
- `libraries`
> Libraries used by the front end. Each key is the path (`/libraries/<key>`) and the value their path in the `node_modules`.
- `locals`
> Global variables accessible on all templates. You can configure announcements here.

## Selfhosting
Run `npm install`
Then, to start a server, run `node server.js` or `nodemon server.js` if running for development purposes.
**Sample Database provided in the /db folder. Default admin password: `password1!`**