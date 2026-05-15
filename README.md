# ![logo](./public/img/logo.png) Inboxer
Anonymous text sharing platform, with style.

## Features
- Markdown posts
- Report system
- Staff accounts
- Automatic NSFW content detection

## Planned features
- [ ] Text editor with buttons
- [ ] Edit posts
- [ ] More formatters

## Config docs
- `urls`
> Represents special redirect pages. Each key is the URL path and the value the ID of the post this page should point to. For example, `/formatting` will redirect to `/post/<the id you enter in config.json>`
- `libraries`
> Libraries used by the front end. Each key is the path (`/libraries/<key>`) and the value their path in the `node_modules`.

## Selfhosting
Run `npm install`
Then, to start a server, run `node server.js` or `nodemon server.js` if running for development purposes.
**Sample Database provided in the /db folder.**