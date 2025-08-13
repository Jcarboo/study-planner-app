// pages/Profile.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DeleteAccount from '../components/DeleteAccount';
import StudyStats from '../components/StudyStats';

export default function Profile() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [courses, setCourses] = useState<string[]>([]);
  const [newCourse, setNewCourse] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchProfile = () => {
    axios.get('https://study-planner-backend-xjed.onrender.com/profile', { withCredentials: true })
      .then(res => {
        setUsername(res.data.username);
        setEmail(res.data.email);
        setCourses(res.data.courses || []);
      })
      .catch(err => console.error("Error fetching profile data", err));
  };

  const fetchPhoto = () => {
    axios.get('https://study-planner-backend-xjed.onrender.com/profile/photo', {
      withCredentials: true,
      responseType: 'blob'
    })
    .then(res => setPhotoUrl(URL.createObjectURL(res.data)))
    .catch(() => {});
  };

  useEffect(() => {
    fetchProfile();
    fetchPhoto();
  }, []);

  const addCourse = (c: string) => {
    const normalized = c.trim().toLowerCase();
    const normalizedCourses = courses.map(x => x.trim().toLowerCase());

    if (normalized.length < 7 || normalized.length > 8) {
      alert("Course must be 7–8 characters e.g. 'CMSC470H'");
      return;
    }
    if (normalizedCourses.includes(normalized)) {
      alert("You've already added this course.");
      return;
    }

    const updated = [...courses, c.trim().toUpperCase()];
    setCourses(updated);
    setNewCourse('');
    axios.post('https://study-planner-backend-xjed.onrender.com/profile/courses', { courses: updated }, { withCredentials: true });
  };

  const removeCourse = (courseToRemove: string) => {
    const updated = courses.filter(course => course !== courseToRemove);
    setCourses(updated);
    axios.post('https://study-planner-backend-xjed.onrender.com/profile/courses', { courses: updated }, { withCredentials: true });
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('photo', selectedFile);
    axios.post('https://study-planner-backend-xjed.onrender.com/profile/upload-photo', formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(() => {
      fetchPhoto();
      alert("Photo uploaded!");
    }).catch(err => console.error("Upload failed", err));
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden font-body text-white">
      {/* Background */}
      <img
        src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/12cbe8a4-f55c-4b40-85bb-d8e1405e7b84/datjp1z-fc3069a4-9ffc-40d0-861b-a53e6a267634.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzEyY2JlOGE0LWY1NWMtNGI0MC04NWJiLWQ4ZTE0MDVlN2I4NFwvZGF0anAxei1mYzMwNjlhNC05ZmZjLTQwZDAtODYxYi1hNTNlNmEyNjc2MzQuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.3wHOSA8fr6drprY3vNEo-4rCuIpzJlStCJtNg3iJR2o"
        alt="background"
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />
      <div className="absolute top-0 left-0 w-full h-full bg-black/30 z-0" />

      {/* Content */}
      <div className="relative z-10 flex flex-col xl:flex-row gap-12 px-6 xl:px-16 py-24 items-start">
        {/* LEFT COLUMN: PROFILE INFO */}
        <div className="w-full xl:w-[35%] max-w-full bg-[#140032]/70 border border-pink-500/30 rounded-2xl shadow-[0_0_30px_rgba(255,20,147,0.15)] backdrop-blur-md">
          <div className="bg-[#120020]/70 border border-pink-500/70 rounded-2xl p-8 shadow-xl backdrop-blur-md">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-indigo-400 to-cyan-300 bg-clip-text drop-shadow-[0_0_0.15rem_#ff77e9] mb-8">Your Profile</h2>

            {/* Avatar & Upload */}
            <div className="flex items-center gap-4 mb-6">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-pink-500 shadow-md object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-pink-500/50 bg-black/40" />
              )}
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="text-sm text-white font-body"
                />
                <button
                  onClick={handleUpload}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-md shadow-md transition"
                >
                  Upload Photo
                </button>
              </div>
            </div>

            <div className="border-t border-pink-400/40 my-6" />

            {/* Info */}
            <p className="text-lg mb-2"><span className="text-indigo-300 font-semibold">Username:</span> {username}</p>
            <p className="text-lg mb-4"><span className="text-indigo-300 font-semibold">Email:</span> {email}</p>

            {/* Courses */}
            <h3 className="text-xl font-semibold text-indigo-300 mb-3">My Courses</h3>
            <ul className="space-y-2 mb-4">
              {courses.map((course, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center bg-black/40 border border-indigo-500/40 rounded-lg px-3 py-2 transition-colors hover:bg-indigo-950/40"
                >
                  <span>{course}</span>
                  <button
                    onClick={() => removeCourse(course)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                placeholder="e.g., CMSC421"
                className="flex-grow px-3 py-2 rounded-md bg-black/60 text-white placeholder-white border border-indigo-500/40"
              />
              <button
                onClick={() => addCourse(newCourse)}
                className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-md transition-all hover:scale-105 shadow-lg hover:shadow-pink-500/50"
              >
                Add
              </button>
            </div>

            <div className="mt-6">
              <DeleteAccount />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STUDY STATS */}
        <div className="flex-1 w-full">
          <StudyStats />
        </div>
      </div>
    </div>
  );
}
