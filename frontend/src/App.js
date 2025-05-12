import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkSession = async () => {
    try {
      const res = await axios.get('http://localhost:5000/auth/check', { withCredentials: true });
      setIsLoggedIn(res.data.loggedIn);
    } catch (err) {
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} onLogout={() => setIsLoggedIn(false)} />
      <Routes>
        <Route path="/" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <Dashboard />
            </PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
