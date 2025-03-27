import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'bedManager'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Check if using default admin credentials
      if (formData.username === 'admin' && formData.password === 'admin') {
        // Use selected role from form
        onLogin({ 
          username: 'admin', 
          role: formData.role,
          token: 'admin-token'
        });
        return;
      }
      
      // Regular login - sending role with the request
      const response = await axios.post(`${API_URL}/auth/login`, formData);
      onLogin({
        ...response.data.user,
        role: formData.role // Make sure role is included
      });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <h2 className="text-center text-xl font-normal mb-8">
          Sign in to your account
        </h2>
        
        {error && (
          <div className="mb-4 text-red-700">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="block">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full border border-gray-300 p-2"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full border border-gray-300 p-2"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="role" className="block">Role</label>
            <select
              id="role"
              name="role"
              className="w-full border border-gray-300 p-2"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="bedManager">Bed Manager</option>
              <option value="equipmentManager">Equipment Manager</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-gray-300 p-2 bg-white hover:bg-gray-50"
          >
            Sign in
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p>
            Don't have an account? <Link to="/register" className="underline">Register here</Link>
          </p>
          <p className="text-sm mt-2 text-gray-600">
            Default admin login: username admin, password admin
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login; 