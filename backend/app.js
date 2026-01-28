const express = require("express");
const mysql = require("mysql2");

const app = express();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Health check for ALB
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Business endpoint
app.get("/message", (req, res) => {
  db.query("SELECT content FROM messages LIMIT 1", (err, rows) => {
    if (err) return res.status(500).send("DB error");
    res.send(rows[0]?.content || "No data");
  });
});

app.listen(3000, () => {
  console.log("Backend running on port 3000");
});
