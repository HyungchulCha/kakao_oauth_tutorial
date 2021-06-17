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
    return <p>hi {JSON.stringify(me)}</p>;
  }

  return (
    <div className='App'>
      <a href='http://localhost:4000/auth/google/url'>LOGIN WITH GOOGLE</a>
    </div>
  );
}

export default Login;
