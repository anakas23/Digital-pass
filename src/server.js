require('dotenv').config();
const express = require('express');
const db = require('./db');

const app = express();

const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = process.env.PORT ? parseInt(process.env.PORT) : 4080;
const baseURL = externalUrl || `http://localhost:${port}`;

app.get('/', async (req, res) => {
  const stats = await db.getStats();
  res.send(`Tatal passes: ${stats.total}, active: ${stats.active}`);
});

async function start() {
  await db.initDb();
  const host = externalUrl ? '0.0.0.0' : '127.0.0.1';
  app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
    console.log(`Public URL: ${baseURL}`);
  });
}

start().catch((err) => {
  console.error('Problem while starting the server:', err);
  process.exit(1);
});