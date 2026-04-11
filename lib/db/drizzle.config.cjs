const path = require("path");

const isProduction = process.env.NODE_ENV === "production";

const dbCredentials = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL, ssl: isProduction ? "require" : false }
  : {
      host: process.env.PGHOST || "helium",
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE || "heliumdb",
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD,
      ssl: false,
    };

module.exports = {
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials,
};
