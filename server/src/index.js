const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const {
  COOKIE_NAME,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  JWT_SECRET,
  SERVER_REDIRECT_URI,
  SERVER_ROOT_URI,
  UI_ROOT_URI,
} = require('./config');

const port = 4000;
const app = express();

app.use(
  cors({
    origin: UI_ROOT_URI,
    credentials: true,
  })
);
app.use(cookieParser());

function getGoogleAuthURL() {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: `${SERVER_ROOT_URI}${SERVER_REDIRECT_URI}`,
    client_id: GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'].join(
      ' '
    ),
  };
  return `${rootUrl}?${querystring.stringify(options)}`;
}

// Getting login URL
app.get('/auth/google/url', (req, res) => {
  return res.send(getGoogleAuthURL());
});

function getTokens({ code, clientId, clientSecret, redirectUri }) {
  const url = 'https://oauth2.googleapis.com/token';
  const values = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  };
  return axios
    .post(url, querystring.stringify(values), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    .then((res) => res.data)
    .catch((err) => {
      console.error('Failed to fetch auth tokens');
      throw new Error(err.message);
    });
}

// Getting the user from Google with the code
app.get(`${SERVER_REDIRECT_URI}`, async (req, res) => {
  const code = req.query.code;
  const { id_token, access_token } = await getTokens({
    code,
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: `${SERVER_ROOT_URI}${SERVER_REDIRECT_URI}`,
  });
  const googleUser = await axios
    .get(`https://www.googleapis.com/oauth2/v1/user/userinfo?alt=json&access_token=${access_token}`, {
      headers: {
        Authorization: `Bearer ${id_token}`,
      },
    })
    .then((res) => res.data)
    .catch((err) => {
      console.error('Failed to fetch user');
      throw new Error(err.message);
    });
  const token = jwt.sign(googleUser, JWT_SECRET);
  res.cookie(COOKIE_NAME, token, {
    maxAge: 900000,
    httpOnly: true,
    secure: false,
  });
  res.redirect(UI_ROOT_URI);
});

// Getting the current user
app.get('/auth/me', (req, res) => {
  console.log('get me');
  try {
    const decoded = jwt.verify(req.cookie[COOKIE_NAME], JWT_SECRET);
    console.log('decoded: ', decoded);
    return res.send(decoded);
  } catch (err) {
    console.log(err);
    res.send(null);
  }
});

app.listen(port, () => {
  console.log(`App listening http://localhost:${port}`);
});
