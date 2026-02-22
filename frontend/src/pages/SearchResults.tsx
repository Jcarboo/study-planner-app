import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, Link } from 'react-router-dom';

type UserHit = {
  user_id: string;
  username: string;
};

export default function SearchResults() {
  const location = useLocation();
  const [results, setResults] = useState<any[]>([]);
  const [members, setMembers] = useState<UserHit[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse query params
  const params = new URLSearchParams(location.search);
  const searchType = params.get('type'); // 'users' | 'courses'
  const searchQuery = params.get('q') || '';

  useEffect(() => {
    if (!searchType || !searchQuery) return;

    setLoading(true);
    setError(null);
    setResults([]);                // NEW: clear stale results
    setSelectedCourse(null);       // NEW: clear selection on a new search
    setMembers([]);                // NEW: clear members too

    const url =
      searchType === 'users'
        ? `https://study-planner-app-123478359200.us-east4.run.app/search/users?q=${encodeURIComponent(searchQuery)}`
        : `https://study-planner-app-123478359200.us-east4.run.app/search/courses?q=${encodeURIComponent(searchQuery)}`;

    axios
      .get(url, { withCredentials: true })
      .then((res) => {
        let data = res.data || [];

        if (searchType === 'courses') {
          // normalize to array of course-name strings
          data = (Array.isArray(data) ? data : [])
            .map((item: any) =>
              typeof item === 'string'
                ? item
                : item.course ?? item.code ?? item.name ?? item.subject ?? ''
            )
            .filter(Boolean);
        }

        setResults(data);
      })
      .catch((err) => {
        console.error('Search failed', err);
        setError('Something went wrong. Try again in a sec.');
      })
      .finally(() => setLoading(false));
  }, [searchType, searchQuery]);

  const fetchCourseMembers = (course: string) => {
    setMembersLoading(true);
    setSelectedCourse(course);
    setMembers([]);
    axios
      .get(`https://study-planner-app-123478359200.us-east4.run.app/search/course-members/${encodeURIComponent(course)}`, {
        withCredentials: true,
      })
      .then((res) => {
        setMembers(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to fetch course members', err);
      })
      .finally(() => setMembersLoading(false));
  };

  // NEW: only strings for course pills
  const courseResults: string[] = useMemo(
    () => results.filter((r): r is string => typeof r === 'string'),
    [results]
  );

  return (
    <div className="relative min-h-screen w-full text-white font-body overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#120020] via-[#0b0116] to-black" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_10%,rgba(255,0,153,0.12),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(0,255,255,0.10),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(138,43,226,0.10),transparent_40%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-24">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-pink-500/40 bg-black/40 px-4 py-1.5 text-sm shadow-[0_0_20px_rgba(255,20,147,0.2)]">
            <span className="text-pink-400">Search type:</span>
            <span className="font-semibold text-indigo-300">{searchType || '—'}</span>
          </span>
          {searchQuery && (
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-black/40 px-4 py-1.5 text-sm shadow-[0_0_20px_rgba(99,102,241,0.25)]">
              <span className="text-indigo-300">Query:</span>
              <span className="font-semibold text-cyan-300">{searchQuery}</span>
            </span>
          )}
        </div>

        {/* Error / Loading / Empty */}
        {error && (
          <div className="mb-8 rounded-xl border border-red-500/40 bg-black/50 p-4 text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-pink-500/20 bg-black/30 animate-pulse"
              />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-indigo-500/30 bg-black/40 p-8 text-center">
            <p className="text-indigo-300">
              No results for <span className="text-pink-400 font-semibold">{searchQuery}</span>.
            </p>
          </div>
        ) : (
          <>
            {/* USERS MODE */}
            {searchType === 'users' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((user: UserHit) => (
                  <Link
                    key={user.user_id}
                    to={`/profile/${user.user_id}`}
                    className="group relative rounded-2xl border border-pink-500/40 bg-black/40 p-5 shadow-[0_0_30px_rgba(255,20,147,0.15)] backdrop-blur hover:border-pink-400/70 hover:shadow-[0_0_35px_rgba(255,20,147,0.35)] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={`https://study-planner-app-123478359200.us-east4.run.app/profile/photo/${user.user_id}`}
                          alt={`${user.username}'s profile`}
                          onError={(e: any) => {
                            e.currentTarget.src =
                              'https://avatars.githubusercontent.com/u/9919?s=200&v=4';
                          }}
                          className="h-16 w-16 rounded-full object-cover border-2 border-pink-500/60 shadow-[0_0_20px_rgba(255,20,147,0.35)]"
                        />
                        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-black/80" />
                      </div>
                      <div>
                        <p className="font-heading text-lg text-pink-300 group-hover:text-pink-200 transition">
                          {user.username}
                        </p>
                        <p className="text-sm text-indigo-300/80">View profile →</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* COURSES MODE */}
            {searchType === 'courses' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Course list (left) */}
                <div className="lg:col-span-1 rounded-2xl border border-indigo-500/40 bg-black/40 p-6 shadow-[0_0_25px_rgba(99,102,241,0.25)]">
                  <h3 className="mb-4 text-xl font-heading text-indigo-300">Courses</h3>
                  <div className="flex flex-wrap gap-2">
                    {courseResults.map((courseName) => {
                      const active = selectedCourse === courseName;
                      return (
                        <button
                          key={courseName}
                          onClick={() => fetchCourseMembers(courseName)}
                          className={[
                            'px-3 py-1.5 rounded-full border transition-all',
                            active
                              ? 'border-pink-500/60 bg-pink-500/20 text-pink-300 shadow-[0_0_20px_rgba(255,20,147,0.3)]'
                              : 'border-indigo-500/40 bg-black/40 text-indigo-200 hover:border-pink-500/50 hover:text-pink-300',
                          ].join(' ')}
                        >
                          {courseName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Members panel (right) */}
                <div className="lg:col-span-2 rounded-2xl border border-pink-500/40 bg-black/40 p-6 shadow-[0_0_30px_rgba(255,20,147,0.2)] min-h-[14rem]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-heading text-pink-300">
                      {selectedCourse ? `Members of ${selectedCourse}` : 'Select a course'}
                    </h3>
                    {membersLoading && (
                      <span className="text-sm text-indigo-300/80">Loading…</span>
                    )}
                  </div>

                  {!selectedCourse ? (
                    <p className="text-indigo-300/80">Choose a course to see who’s in it.</p>
                  ) : membersLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="h-24 rounded-xl border border-pink-500/20 bg-black/30 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : members.length === 0 ? (
                    <p className="text-indigo-300/80">No members found for this course (yet!).</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                      {members.map((m) => (
                        <Link
                          to={`/profile/${m.user_id}`}
                          key={m.user_id}
                          className="group rounded-xl border border-indigo-500/40 bg-black/40 p-4 hover:border-pink-500/60 hover:shadow-[0_0_20px_rgba(255,20,147,0.25)] transition-all"
                        >
                          <img
                            src={`https://study-planner-app-123478359200.us-east4.run.app/profile/photo/${m.user_id}`}
                            alt={`${m.username}'s profile`}
                            onError={(e: any) => {
                              e.currentTarget.src =
                                'https://avatars.githubusercontent.com/u/9919?s=200&v=4';
                            }}
                            className="mb-3 h-16 w-16 rounded-full object-cover border-2 border-pink-500/50 shadow-[0_0_15px_rgba(255,20,147,0.25)]"
                          />
                          <p className="text-sm text-pink-300 group-hover:text-pink-200 transition">
                            {m.username}
                          </p>
                          <p className="text-xs text-indigo-300/70">View profile →</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
