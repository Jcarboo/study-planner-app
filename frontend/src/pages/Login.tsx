import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

type LoginProps = {
  onLogin: () => void;
};

export default function Login({onLogin}: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://study-planner-backend-xjed.onrender.com/auth/login', {
        email,
        password
      }, { withCredentials: true });
      onLogin();
      console.log("Login successful:", res.data);
      navigate('/dashboard');
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? <a href="/register">Register here</a></p>
    </div>
  );
}
