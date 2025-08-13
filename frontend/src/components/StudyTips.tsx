import React, { useEffect, useState } from 'react';
import axios from 'axios';

type TipsPayload = {
  quickTips: string[];
  habits: string[];
  weekPlan: { day: string; suggestion: string }[];
};

export default function StudyTips() {
  const [tips, setTips] = useState<TipsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await axios.get<TipsPayload>('https://study-planner-backend-xjed.onrender.com/ai/tips', { withCredentials: true });
      setTips(res.data);
    } catch (e) {
      console.error(e);
      setErr('Could not load AI tips.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="bg-[#0b0018]/70 border border-indigo-500/40 rounded-2xl p-6 shadow-[0_0_24px_rgba(99,102,241,0.35)] backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-heading bg-gradient-to-r from-pink-400 via-indigo-400 to-cyan-300 bg-clip-text">
          AI Study Tips
        </h3>
        <button
          onClick={load}
          className="text-sm px-3 py-1 rounded-full bg-black/40 border border-cyan-400/40 hover:border-cyan-300 hover:shadow-[0_0_12px_#22d3ee66] transition"
          aria-label="Refresh tips"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-white/80">Thinking…</p>}
      {err && <p className="text-red-300">{err}</p>}
      {!loading && !err && tips && (
        <div className="space-y-6">
          {/* Quick Tips */}
          {tips.quickTips?.length > 0 && (
            <div>
              <h4 className="text-pink-300 font-semibold mb-2">Quick wins</h4>
              <ul className="space-y-2">
                {tips.quickTips.map((t, i) => (
                  <li key={i} className="bg-black/40 border border-pink-500/30 rounded-lg px-3 py-2 text-white/90">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Habits */}
          {tips.habits?.length > 0 && (
            <div>
              <h4 className="text-indigo-300 font-semibold mb-2">Habits to adopt</h4>
              <ul className="space-y-2">
                {tips.habits.map((t, i) => (
                  <li key={i} className="bg-black/40 border border-indigo-500/30 rounded-lg px-3 py-2 text-white/90">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Week Plan */}
          {tips.weekPlan?.length > 0 && (
            <div>
              <h4 className="text-cyan-300 font-semibold mb-2">Suggested week</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tips.weekPlan.map((d, i) => (
                  <div
                    key={`${d.day}-${i}`}
                    className="bg-[#140032]/60 border border-cyan-400/30 rounded-lg p-3 text-white/90"
                  >
                    <div className="text-sm text-cyan-300 font-semibold mb-1">{d.day}</div>
                    <div className="text-sm">{d.suggestion}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
