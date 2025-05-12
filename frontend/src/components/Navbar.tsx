import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

type NavbarProps = {
  isLoggedIn: boolean;
  onLogout: () => void;
};

export default function Navbar({ isLoggedIn, onLogout }: NavbarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('https://study-planner-backend-xjed.onrender.com/auth/logout', {}, { withCredentials: true });
      onLogout(); // update state
      navigate('/');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav style={{ padding: '10px', backgroundColor: '#f0f0f0' }}>
      <Link to="/dashboard">Dashboard</Link> |{" "}
      {isLoggedIn ? (
        <button onClick={handleLogout}>Logout</button>
      ) : (
        <>
          <Link to="/">Login</Link> | <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}
