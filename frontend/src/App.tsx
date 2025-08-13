import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';

import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import ProfileView from './pages/ProfileView';
import SearchResults from './pages/SearchResults';
import AiTools from './pages/AiTools';
import AboutPage from './pages/About';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkSession = async () => {
    try {
      const res = await axios.get('http://study-planner-backend-xjed.onrender.com/auth/check', { withCredentials: true });
      setIsLoggedIn(res.data.loggedIn);
    } catch {
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <Router>
      <Layout isLoggedIn={isLoggedIn} onLogout={() => setIsLoggedIn(false)}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
          <Route path="/register" element={<Register onLogin={() => setIsLoggedIn(true)} />} />
          <Route path="/dashboard" element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <Dashboard />
            </PrivateRoute>} />
          <Route path="/profile" element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <Profile />
            </PrivateRoute>} />
          <Route path="/profile/:userId" element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <ProfileView />
            </PrivateRoute>} />
          <Route path="/search-results" element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <SearchResults />
            </PrivateRoute>} />
          <Route path="/ai-tools" element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <AiTools />
            </PrivateRoute>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
