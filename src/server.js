require('dotenv').config();
const express = require('express');
const QRCode = require('qrcode');
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');
const { auth: oidcLogin, requiresAuth } = require('express-openid-connect');
const db = require('./db');
const views = require('./views');

const app = express();
app.use(express.json());

const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = process.env.PORT ? parseInt(process.env.PORT) : 4080;
const baseURL = externalUrl || `http://localhost:${port}`;

// user login(OIDC)
// /login, /logout and /callback routes automatically add
app.use(oidcLogin({
  authRequired: false, //ages are public unless marked with requiresAuth()
  auth0Logout: true,
  baseURL: baseURL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  secret: process.env.SESSION_SECRET,
  authorizationParams: {
    response_type: 'code', 
  },
}));

//public pages 

app.get('/', async (req, res) => {
  const stats = await db.getStats();
  let user = null;
  let passes = null;
  if (req.oidc.isAuthenticated()) {
    user = req.oidc.user;
    passes = await db.getAllPasses();
  }
  res.send(views.homePage(stats, user, passes));
});

app.get('/info/:id', async (req, res) => {
  const pass = await db.getPass(req.params.id);
  if (!pass) {
    return res.status(404).send(views.notFoundPage());
  }
  res.send(views.passInfoPage(pass));
});

// Admin actions(logged in only) 

app.post('/admin/passes/:id/cancel', requiresAuth(), async (req, res) => {
  await db.cancelPass(req.params.id);
  res.redirect('/');
});

app.post('/admin/passes/:id/delete', requiresAuth(), async (req, res) => {
  await db.deletePass(req.params.id);
  res.redirect('/');
});

//API (OAuth2 client credentials)

//missing or invalid token -> 401
const checkToken = auth({
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  audience: process.env.AUTH0_AUDIENCE,
});

//valid token without the scope -> 403
app.get('/passes/:id', checkToken, requiredScopes('read:passes'), async (req, res) => {
  const pass = await db.getPass(req.params.id);
  if (!pass) {
    return res.status(404).json({ error: 'Pass not found' });
  }
  res.json(pass);
});

app.post('/passes', checkToken, requiredScopes('create:passes'), async (req, res) => {
  const { name, document } = req.body || {};
  if (!name || !document) {
    return res.status(400).json({ error: 'Name and document are required' });
  }

  const pass = await db.createPass(name, document);

  // QR code ->public page, Location header-> API endpoint
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