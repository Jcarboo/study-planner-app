import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
    console.log("Test");
      const res = await axios.post('http://localhost:5000/auth/register', {
        email,
        username,
        password
      }, { withCredentials: true });
      console.log("Registered:", res.data);
      navigate('/dashboard');
    } catch (err) {
      console.error("Registration failed:", err.response?.data || err.message);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <a href="/">Login here</a></p>
    </div>
  );
}
