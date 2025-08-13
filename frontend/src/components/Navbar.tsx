import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

type NavbarProps = {
  isLoggedIn: boolean;
  onLogout: () => void;
};
export default function Navbar({ isLoggedIn, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('users');

  const handleLogout = async () => {
    try {
      await axios.post('https://study-planner-backend-xjed.onrender.com/auth/logout', {}, { withCredentials: true });
      onLogout();
      navigate('/');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search-results?type=${searchType}&q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="fixed top-0 z-50 flex items-center justify-between w-full p-4 bg-black bg-opacity-5 backdrop-filter backdrop-blur-lg text-white border-b border-black">
      {/* Left section: Links */}
      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <>
            <Link to="/dashboard">Dashboard</Link> |{" "}
            <Link to="/profile">Profile</Link> |{" "}
            <Link to="/ai-tools">Study Help</Link> |{" "}
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mx-2 p-1 bg-black bg-opacity-20 border border-white rounded"
            />
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="mx-2 p-1 bg-black bg-opacity-20 border border-white rounded"
            >
              <option value="users">Users</option>
              <option value="courses">Courses</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-3 py-1 border border-white rounded hover:bg-white hover:text-black"
            >
              Search
            </button>
            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-1 border border-white rounded hover:bg-white hover:text-black"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
          </>
        )}
      </div>

      {/* Right section: Logo */}
      <div className="flex items-center gap-4">
        <Link to="/about">About</Link>|{" "}
        <Link to="/">
          <img
            src="https://cdna.artstation.com/p/assets/images/images/030/272/556/original/vinicius-aguiar-cyberpunk.gif?1600111804"
            alt="Logo"
            className="h-10 object-contain"
          />
        </Link>
      </div>
    </nav>
  );
}
