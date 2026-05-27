const { Sequelize, Model, DataTypes } = require("sequelize");
const sequelize = require("./connection");

const Group = sequelize.define("groups", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
})

/* 
Represents user groups.

Ones used on the site:
- 0: throwaway accounts.
    > Can only have one post
    > Don't have a profile page.
    > Can have duplicate usernames
- 1: anonymous accounts
    > Accounts stay active for 7 days.
    > Have a Anon_<random_number> username
- 2: regular users
    > Regular user accounts
- 3: moderators
    > Can delete posts
- 4: admin accounts
    > Can edit and delete posts
*/

module.exports = Group;