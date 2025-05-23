import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


type RegisterProps = {
  onLogin: () => void;
};

export default function Register({ onLogin }: RegisterProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
    console.log("Test");
      const res = await axios.post('https://study-planner-backend-xjed.onrender.com/auth/register', {
        email,
        username,
        password
      }, { withCredentials: true });
      console.log("Registered:", res.data);
      onLogin();
      navigate('/dashboard');
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input type="text" value={username} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)} placeholder="Username" required />
        <input type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} placeholder="Password" required />
        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <a href="/">Login here</a></p>
    </div>
  );
}
