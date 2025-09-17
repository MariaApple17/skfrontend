import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [roleId, setRoleId] = useState(4); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    if (!username || !password || !fullName) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.post('/api/auth/register', {
        username,
        password,
        full_name: fullName,
        role_id: roleId,
      });

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        nav('/');
      }, 2000);

    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || err.response?.data?.error || 'Registration failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Register</h2>

        {error && (
          <div style={{ color: 'red', background: '#ffe6e6', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ color: 'green', background: '#e6ffe6', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
            {success}
          </div>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Full Name
          <input
            type="text"
            placeholder="Enter full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Username
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Password
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
          />
          Show Password
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px',
            background: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
