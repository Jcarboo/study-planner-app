import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function DeleteAccount() {
  const navigate = useNavigate();

  const handleDelete = async () => {
    const confirm1 = window.confirm("Are you sure you want to delete your account?");
    if (!confirm1) return;

    const confirm2 = window.confirm("This will permanently remove your account and all your study data. Final warning — proceed?");
    if (!confirm2) return;

    try {
      await axios.post("http://localhost:5000/auth/delete-account", {}, { withCredentials: true });
      navigate('/');
    } catch (err) {
      console.error("Account deletion failed", err);
    }
  };

  return (
    <button onClick={handleDelete} style={{ color: "red" }}>
      Delete My Account
    </button>
  );
}
