require('dotenv').config();
const express = require('express');
const QRCode = require('qrcode');
const db = require('./db');
const views = require('./views');

const app = express();
app.use(express.json());

const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = process.env.PORT ? parseInt(process.env.PORT) : 4080;
const baseURL = externalUrl || `http://localhost:${port}`;

//public pages

app.get('/', async (req, res) => {
  const stats = await db.getStats();
  //not yet
  res.send(views.homePage(stats, null, null));
});

app.get('/info/:id', async (req, res) => {
  const pass = await db.getPass(req.params.id);
  if (!pass) {
    return res.status(404).send(views.notFoundPage());
  }
  res.send(views.passInfoPage(pass));
});

//api
app.get('/passes/:id', async (req, res) => {
  const pass = await db.getPass(req.params.id);
  if (!pass) {
    return res.status(404).json({ error: 'Pass not found' });
  }
  res.json(pass);
});

app.post('/passes', async (req, res) => {
  const { name, document } = req.body || {};
  if (!name || !document) {
    return res.status(400).json({ error: 'Name and document are required' });
  }

  const pass = await db.createPass(name, document);

  //QR code ->public page, Location header-> endpoint
  const qrPng = await QRCode.toBuffer(`${baseURL}/info/${pass.id}`);

  res
    .status(201)
    .location(`${baseURL}/passes/${pass.id}`)
    .type('image/png')
    .send(qrPng);
});


async function start() {
  await db.initDb();
  const host = externalUrl ? '0.0.0.0' : '127.0.0.1';
  app.listen(port, host, () => {
    console.log(`Server running at ${baseURL}`);
  });
}

start();