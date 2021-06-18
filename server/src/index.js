const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const {
  COOKIE_NAME,
  KAKAO_CLIENT_ID,
  KAKAO_SECRET_ID,
  JWT_SECRET,
  SERVER_REDIRECT_URI,
  SERVER_LOGOUT_URI,
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

function getKakaoAuthURL() {
  const rootUrl = 'https://kauth.kakao.com/oauth/authorize';
  const options = {
    client_id: KAKAO_CLIENT_ID,
    redirect_uri: `${SERVER_ROOT_URI}${SERVER_REDIRECT_URI}`,
    response_type: 'code',
    prompt: 'login',
  };
  return `${rootUrl}?${querystring.stringify(options)}`;
}

// Getting login URL
app.get('/auth/kakao/url', (req, res) => {
  return res.redirect(getKakaoAuthURL());
});

function getTokens({ code, clientId, clientSecret, redirectUri }) {
  const url = 'https://kauth.kakao.com/oauth/token';
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
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
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
  const { token_type, access_token, expires_in, refresh_token, refresh_token_expires_in, scope } = await getTokens({
    code,
    clientId: KAKAO_CLIENT_ID,
    clientSecret: KAKAO_SECRET_ID,
    redirectUri: `${SERVER_ROOT_URI}${SERVER_REDIRECT_URI}`,
  });

  console.log(token_type, access_token, expires_in, refresh_token, refresh_token_expires_in, scope);

  // const token = jwt.sign(kakaoUser, JWT_SECRET);
  res.cookie(COOKIE_NAME, access_token, {
    maxAge: expires_in * 1000,
    httpOnly: true,
    secure: false,
  });
  res.redirect(UI_ROOT_URI);
});

// Getting the current user
app.get('/auth/me', async (req, res) => {
  const access_token = req.cookies[COOKIE_NAME];
  if (access_token != null) {
    const kakaoUser = await axios
      .get(`https://kapi.kakao.com/v2/user/me`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': `application/x-www-form-urlencoded;charset=utf-8`,
        },
      })
      .then((res) => res.data)
      .catch((err) => {
        console.error('Failed to fetch user');
        throw new Error(err.message);
      });

    return res.send(kakaoUser);
  } else {
    res.send(null);
  }
});

function kakaoAuthLogout() {
  const rootUrl = 'https://kauth.kakao.com/oauth/logout';
  const options = {
    client_id: KAKAO_CLIENT_ID,
    logout_redirect_uri: `${SERVER_ROOT_URI}${SERVER_LOGOUT_URI}`,
    state: 'kakao_oauth_tutorial',
  };
  return `${rootUrl}?${querystring.stringify(options)}`;
}
app.get('/auth/kakao/logout/url', (req, res) => {
  res.redirect(kakaoAuthLogout());
});

app.get('/auth/kakao/logout', (req, res) => {
  if (req.query.state === 'kakao_oauth_tutorial') {
    res.clearCookie(COOKIE_NAME);
    res.redirect(UI_ROOT_URI);
  } else {
    res.status(404);
  }
});

app.listen(port, () => {
  console.log(`App listening http://localhost:${port}`);
});
