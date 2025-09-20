"use client";

import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage('Sign up successful! Please check your email.');
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else setMessage('login success!');
  }

  return (
    <div>
      <h1>Login / Sign Up</h1>
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '25%' }}
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>
      <div>
        <button onClick={() => signUp(email, password)}>Sign Up</button>
      </div>
      <div>
        <button onClick={() => signIn(email, password)}>Login</button>
      </div>
      <p>Message: {message}</p>
    </div>
  );
}