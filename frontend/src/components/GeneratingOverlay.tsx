import React from 'react';
import { motion } from 'framer-motion';

export default function GeneratingOverlay({
  text = "Generating your quiz…",
}: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-md">
      <div className="relative w-72 h-72 grid place-items-center">
        {/* rotating neon ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4"
          style={{
            borderImage: 'linear-gradient(45deg,#ff00cc,#7c3aed,#06b6d4) 1',
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.8, ease: 'linear' }}
        />
        {/* inner glow pulse */}
        <motion.div
          className="w-40 h-40 rounded-full"
          style={{
            boxShadow: '0 0 50px rgba(255,0,204,0.35), 0 0 100px rgba(124,58,237,0.25)',
            background:
              'radial-gradient(closest-side, rgba(255,0,204,.2), rgba(0,0,0,0))',
          }}
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        />
        {/* text */}
        <div className="text-center px-6">
          <p className="text-lg font-semibold text-pink-300 drop-shadow-[0_0_0.4rem_#ff77e966]">
            {text}
          </p>
          <p className="mt-2 text-sm text-indigo-200/80">
            Cooking questions, options & answers…
          </p>
        </div>
        {/* progress shimmer bar */}
        <motion.div
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-56 h-2 rounded-full bg-white/10 overflow-hidden"
          initial={false}
        >
          <motion.span
            className="absolute inset-y-0 w-24 rounded-full"
            style={{
              background:
                'linear-gradient(90deg,transparent,#22d3ee,transparent)',
              filter: 'drop-shadow(0 0 8px #22d3ee)',
            }}
            animate={{ x: ['-30%', '110%'] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          />
        </motion.div>
      </div>
    </div>
  );
}
