require('dotenv').config();
const express = require('express');

const app = express();

const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = process.env.PORT ? parseInt(process.env.PORT) : 4080;
const baseURL = externalUrl || `http://localhost:${port}`;

app.get('/', (req, res) => {
  res.send('Propusnice - radi!');
});

const host = externalUrl ? '0.0.0.0' : '127.0.0.1';
app.listen(port, host, () => {
  console.log(`Server radi na http://${host}:${port}`);
  console.log(`Javna adresa: ${baseURL}`);
});