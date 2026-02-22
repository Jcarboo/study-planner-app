import React from 'react';

export default function Home() {
  return (
    <div className="relative w-screen h-[calc(100vh+64px)] overflow-hidden -mt-16">

      <video
        src="/assets/videos/homepage_background.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="/assets/videos/homepage_background.mp4" type="video/mp4" />
      </video>

      <div className="absolute top-0 left-0 w-full h-full bg-black/30" />

      <div className="relative z-10 flex flex-col items-center text-white text-center h-full pt-[14vh]">
        <h1 className="font-heading text-6xl">Dreamer</h1>
        <h3 className="font-body text-2xl mt-4">Your one-stop solution for planning</h3>
      </div>
    </div>
  );
}
