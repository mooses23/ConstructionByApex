const path = require("path");

module.exports = {
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.PGHOST || "helium",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "heliumdb",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD,
    ssl: false,
  },
};
