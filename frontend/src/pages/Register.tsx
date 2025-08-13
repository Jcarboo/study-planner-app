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
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        'http://study-planner-backend-xjed.onrender.com/auth/register',
        { email, username, password },
        { withCredentials: true }
      );
      console.log('Registered:', res.data);
      onLogin();
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <section className="min-h-screen flex items-stretch text-white">
      {/* Left side with image */}
      <div
        className="lg:flex w-1/2 hidden bg-black bg-no-repeat bg-cover relative items-center"
        style={{
          backgroundImage:
            "url(https://i1.sndcdn.com/artworks-uPglqmr31j5N4tJ6-sAz4QQ-t1080x1080.jpg)",
        }}
      >
        <div className="w-full px-24 z-10">
          <h1 className="text-5xl font-heading font-bold text-left tracking-wide">Join The Legion</h1>
        </div>
      </div>

      {/* Right side with form */}
      <div className="lg:w-1/2 w-full flex items-center justify-center text-center md:px-16 px-0 z-0 bg-gradient-to-br from-[#1a0b2e] to-black relative">
        <div
          className="absolute z-10 inset-0 bg-gray-500 bg-no-repeat bg-cover items-center"
          style={{
            backgroundImage:
              "url(https://i.pinimg.com/originals/bd/4b/45/bd4b45c72d463584da6fd4d4baf309aa.gif)",
          }}
        >
          <div className="absolute bg-black opacity-60 inset-0 z-0"></div>
        </div>

        <div className="w-full py-6 z-10">
          <h2 className="font-heading text-3xl">Register</h2>
          <form onSubmit={handleRegister} className="sm:w-2/3 w-full px-4 lg:px-0 mx-auto">
            <div className="pb-2 pt-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                className="block w-full p-4 text-lg rounded-sm bg-black font-body placeholder-white text-white"
              />
            </div>

            <div className="pb-2 pt-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="block w-full p-4 text-lg rounded-sm bg-black font-body placeholder-white text-white"
              />
            </div>

            <div className="pb-2 pt-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="block w-full p-4 text-lg rounded-sm bg-black font-body placeholder-white text-white"
              />
            </div>

            <div className="px-4 pb-2 pt-4">
              <button className="uppercase block w-full p-4 text-lg font-body rounded-full bg-pink-600 hover:bg-indigo-600 focus:outline-none hover:drop-shadow-[0_0_0.3rem_#ffffff]">
                sign up
              </button>
            </div>
          </form>

          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

          <p>
            Already have an account?{' '}
            <a href="/login" className="text-pink-400 hover:text-red-600">
              Login here
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
