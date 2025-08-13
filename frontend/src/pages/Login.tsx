import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

type LoginProps = {
  onLogin: () => void;
};

export default function Login({onLogin}: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
      setError('Login failed. Please check your email and password.');
    }
  };

  return (
    <section className="min-h-screen flex items-stretch text-white">

      {/* Left side with image */}
      <div className="lg:flex w-1/2 hidden bg-black bg-no-repeat bg-cover relative items-center" style={{ backgroundImage: "url(https://i1.sndcdn.com/artworks-uPglqmr31j5N4tJ6-sAz4QQ-t1080x1080.jpg)" }}>

        

        <div className="w-full px-24 z-10">
          <h1 className="text-5xl font-heading font-bold text-left tracking-wide"> Welcome Back</h1>
        </div>

      </div>
      {/*Left side end*/}

      {/*Right side with form*/}
      <div className="lg:w-1/2 w-full flex items-center justify-center text-center md:px-16 px-0 z-0 bg-gradient-to-br from-[#1a0b2e] to-black relative">

        <div className="absolute z-10 inset-0 bg-gray-500 bg-no-repeat bg-cover items-center" style={{ backgroundImage: "url(https://i.pinimg.com/originals/bd/4b/45/bd4b45c72d463584da6fd4d4baf309aa.gif)" }}>
          <div className="absolute bg-black opacity-60 inset-0 z-0"></div> {/* Background dark overlay */}
        </div>

        <div className="w-full py-6 z-10">
          <h2 className="font-heading text-3xl">Login</h2> {/* Login form */}
          <form onSubmit={handleSubmit} className="sm:w-2/3 w-full px-4 lg:px-0 mx-auto">
          
            <div className="pb-2 pt-4">
              <input 
                type="email" value={email} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
                placeholder="Email" 
                required 
                className="block w-full p-4 text-lg rounded-sm bg-black font-body placeholder-white text-white bg-black"
              />
            </div>

            <div className="pb-2 pt-4">
              <input 
                type="password" value={password} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
                placeholder="Password" 
              required 
              className="block w-full p-4 text-lg rounded-sm bg-black font-body font-body placeholder-white text-white bg-black"
            />
            </div>
            <div className="px-4 pb-2 pt-4">
              <button className="uppercase block w-full p-4 text-lg font-body rounded-full bg-pink-600 hover:bg-indigo-600 focus:outline-none hover:drop-shadow-[0_0_0.3rem_#ffffff]">sign in</button>
            </div>

          </form>

          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
          <p>Don't have an account? <a href="/register" className="text-pink-400 hover:text-red-600">Register here</a></p>
          
        </div>

      </div>
      {/*Right side end*/}

    </section>    
  );
}
