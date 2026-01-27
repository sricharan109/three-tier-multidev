const express = require("express");
const app = express();

const ENV = process.env.ENV_NAME || "unknown";

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/message", (req, res) => {
  res.send(`Hello from BACKEND | Environment: ${ENV}`);
});

app.listen(3000, () => {
  console.log(`Backend running on port 3000 | ENV=${ENV}`);
});
