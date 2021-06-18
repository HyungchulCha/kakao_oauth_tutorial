import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Login() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    async function getMe() {
      await axios
        .get('http://localhost:4000/auth/me', {
          withCredentials: true,
        })
        .then((res) => setMe(res.data));
    }
    getMe();
  }, []);

  if (me) {
    return (
      <div>
        <p>hi {JSON.stringify(me)}</p>
        <a href='http://localhost:4000/auth/kakao/logout/url'>로그아웃</a>
      </div>
    );
  }

  return (
    <div className='App'>
      <a href='http://localhost:4000/auth/kakao/url'>LOGIN WITH KAKAO</a>
    </div>
  );
}

export default Login;
