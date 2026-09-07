import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await signUp(email, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    }
  };

  return (
    <div className="min-h-screen bg-dark-100 flex items-center justify-center p-4">
      <div className="bg-dark-200 p-8 rounded-2xl border border-dark-300 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-gray-400 hover:text-white transition text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          <div className="text-xl font-bold text-green-400">MacroPulse</div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-6">Create Account</h2>

        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4">{error}</div>
        )}
        {success && (
          <div className="bg-green-500/20 text-green-400 p-3 rounded mb-4">
            Account created! You will be redirected to login. Please wait for admin approval.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark-300 text-white border border-dark-400 rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-300 text-white border border-dark-400 rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
              required
              minLength={6}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-400 mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-dark-300 text-white border border-dark-400 rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-dark-100 font-bold py-2 rounded-lg hover:opacity-90 transition"
          >
            Register
          </button>
        </form>

        <p className="text-center text-gray-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-green-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;