// src/pages/ProfileView.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import StudyStatsView from '../components/StudyStatsView';

type PublicUser = {
  username: string;
  email?: string;
  courses: string[];
  bio?: string;
};

type FeaturedPlan = {
  _id: string;
  title: string;
  subject: string;
  tasks: { name: string; done: boolean }[];
  totalTasks: number;
};

export default function ProfileView() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [me, setMe] = useState<{ username: string; courses: string[] } | null>(null);
  const [featured, setFeatured] = useState<FeaturedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!userId) return;
      setLoading(true);
      setErr(null);

      try {
        // Try the new public endpoint first
        const userReq = axios.get<PublicUser>(
          `https://study-planner-backend-xjed.onrender.com/profile/${userId}/public`,
          { withCredentials: true }
        ).catch(async (e) => {
          // Fallback to old endpoint so page still works
          console.warn('Public profile route failed, falling back:', e?.response?.status, e?.response?.data);
          const fallback = await axios.get<PublicUser>(
            `https://study-planner-backend-xjed.onrender.com/search/user/${userId}`,
            { withCredentials: true }
          );
          return { data: fallback.data } as any;
        });

        const meReq = axios.get<{ username: string; email: string; courses: string[] }>(
          'https://study-planner-backend-xjed.onrender.com/profile',
          { withCredentials: true }
        );

        const featuredReq = axios.get<FeaturedPlan[]>(
          `https://study-planner-backend-xjed.onrender.com/profile/${userId}/featured-plans`,
          { withCredentials: true }
        ).catch((e) => {
          console.warn('featured-plans failed:', e?.response?.status, e?.response?.data);
          return { data: [] as FeaturedPlan[] } as any;
        });

        const [uRes, meRes, featRes] = await Promise.all([userReq, meReq, featuredReq]);

        if (!mounted) return;
        setUser(uRes.data);
        setMe({ username: meRes.data.username, courses: meRes.data.courses || [] });
        setFeatured(featRes.data || []);
      } catch (e: any) {
        console.error('Profile load error:', e?.response?.status, e?.response?.data || e);
        if (mounted) setErr('Failed to load profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [userId]);

  const mutualCourses = useMemo(() => {
    if (!user || !me) return [];
    const theirs = new Set((user.courses || []).map((c) => c.trim().toUpperCase()));
    return (me.courses || [])
      .map((c) => c.trim().toUpperCase())
      .filter((c) => theirs.has(c));
  }, [user, me]);

  if (!userId) return <div className="text-white p-6">No user specified.</div>;

  return (
    <div className="relative w-full min-h-screen overflow-hidden text-white font-body">
      {/* Background */}
      <img
        src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/12cbe8a4-f55c-4b40-85bb-d8e1405e7b84/d98qb8z-56df9d2f-1a24-41d4-ad7d-e4244cc189be.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzEyY2JlOGE0LWY1NWMtNGI0MC04NWJiLWQ4ZTE0MDVlN2I4NFwvZDk4cWI4ei01NmRmOWQyZi0xYTI0LTQxZDQtYWQ3ZC1lNDI0NGNjMTg5YmUuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.Nd7Pghx-n6PtcGxt3q1iXKcSmh0AlSH0jkMzXViaWqE"
        alt="background"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0013]/70 to-[#140022]/70 z-0" />

      {/* Content */}
      <div className="relative z-10 px-6 md:px-10 py-24">
        {/* widen container and give right panel space */}
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
          {/* Left panel – slightly narrower */}
          <div className="w-full lg:flex-[0_0_34rem]">
            <div className="bg-[#120020]/70 border border-pink-500/60 rounded-2xl p-8 shadow-[0_0_30px_rgba(255,20,147,0.25)] backdrop-blur-md">
              {loading ? (
                <div className="animate-pulse">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-24 h-24 rounded-full bg-black/40 border-4 border-pink-500/40" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/20 rounded w-1/3" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-pink-500/40 to-transparent mb-6" />
                  <div className="h-4 bg-white/10 rounded w-2/3 mb-3" />
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                </div>
              ) : err ? (
                <p className="text-red-300">{err}</p>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-5">
                    <img
                      src={`https://study-planner-backend-xjed.onrender.com/profile/photo/${userId}`}
                      onError={(e: any) => {
                        e.currentTarget.src = 'https://via.placeholder.com/128x128.png?text=No+Photo';
                      }}
                      alt={`${user?.username || 'User'} avatar`}
                      className="w-24 h-24 rounded-full border-4 border-pink-500/70 shadow-[0_0_18px_rgba(255,20,147,0.35)] object-cover"
                    />
                    <div className="flex-1">
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-indigo-400 to-cyan-300 bg-clip-text drop-shadow-[0_0_0.15rem_#ff77e9] mb-8">
                        {user?.username || 'User'}
                      </h1>
                      {user?.email && <p className="text-indigo-300/90 mt-1">{user.email}</p>}

                      {mutualCourses.length > 0 && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-indigo-500/40 shadow-[0_0_16px_rgba(99,102,241,0.35)]">
                          <span className="text-cyan-300 text-sm">
                            {mutualCourses.length} mutual course{mutualCourses.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-px w-full bg-gradient-to-r from-transparent via-pink-500/40 to-transparent my-6" />

                  {/* Mutual courses */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-indigo-300 mb-2">Mutual Courses</h3>
                    {mutualCourses.length ? (
                      <div className="flex flex-wrap gap-2">
                        {mutualCourses.map((c) => (
                          <span
                            key={c}
                            className="px-3 py-1 rounded-full bg-black/50 border border-indigo-500/40 text-white text-sm shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/70">No overlap yet.</p>
                    )}
                  </div>

                  {/* Public courses */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-indigo-300 mb-2">Courses</h3>
                    {user?.courses?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {user.courses.map((c, i) => (
                          <span
                            key={`${c}-${i}`}
                            className="px-3 py-1 rounded-full bg-black/40 border border-pink-500/30 text-white/95 text-sm"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/70">No public courses listed.</p>
                    )}
                  </div>

                  {/* Featured Plans (read-only) */}
                  <div>
                    <h3 className="text-xl font-semibold text-indigo-300 mb-3">Featured Plans</h3>
                    {featured.length ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {featured.map((p) => (
                          <div
                            key={p._id}
                            className="bg-[#0b0018]/70 border border-pink-500/30 rounded-xl p-4 shadow-[0_0_18px_rgba(255,20,147,0.2)]"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-lg font-heading text-pink-300">{p.title}</h4>
                              <span className="text-xs px-2 py-1 rounded-full bg-black/50 border border-indigo-500/30 text-indigo-200">
                                {p.subject}
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {p.tasks.map((t, i) => (
                                <li
                                  key={i}
                                  className="flex items-center justify-between bg-black/40 rounded-md px-2 py-1 text-sm"
                                >
                                  <span className={t.done ? 'line-through text-gray-400' : ''}>{t.name}</span>
                                  <span className={t.done ? 'text-green-400' : 'text-white/60'}>
                                    {t.done ? '✓' : '•'}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            {p.totalTasks > p.tasks.length && (
                              <p className="mt-2 text-xs text-white/60">
                                +{p.totalTasks - p.tasks.length} more…
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/70">No featured plans yet.</p>
                    )}
                  </div>

                  <div className="mt-6">
                    <Link to="/dashboard" className="text-cyan-300 hover:text-cyan-200 underline">
                      ← Back to Dashboard
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right panel – give it room */}
          <div className="flex-1 min-w-[640px]">
            {/* If StudyStatsView still feels tight, you can pass a prop to render a compact version */}
            <StudyStatsView userId={userId!} />
          </div>
        </div>
      </div>
    </div>
  );
}
