// File containing the main sequelize instance
const { Sequelize } = require("sequelize");

// Loading environment variables
process.loadEnvFile("./.env");

// Database connection
let sequelize;
switch (process.env.DATABASE_TYPE) {
    case "sqlite":
        sequelize = new Sequelize({
            dialect: "sqlite",
            storage: "./db/database.db",

            define: {
                timestamps: false
            }
        });
        console.log("Using SQLite");
        break;
    case "mysql":
        sequelize = new Sequelize({
            dialect: "mysql",
            host: process.env.DB_HOST,
            database: process.env.DB_DATABASE,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,

            define: {
                timestamps: false
            }
        })
        console.log("Using MySQL");
        break;
    default:
        throw new Error(`Invalid database type: ${process.env.DATABASE_TYPE}. Must be one of the following: mysql, sqlite`);
}

module.exports = sequelize;