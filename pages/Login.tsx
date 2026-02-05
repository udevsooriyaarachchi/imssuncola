import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.MEMBER);
  const [error, setError] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        if (login(username, password)) {
          navigate('/');
        } else {
          setError('Invalid credentials or account inactive.');
        }
      } else {
        // Default permissions for self-registered members
        register(username, password, role, { 
          inventory: true, 
          invoices: true,
          orders: false,
          reports: false,
          team: false
        });
        login(username, password);
        navigate('/');
      }
    } catch (err) {
      setError('An error occurred.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[32px] shadow-xl w-full max-w-[400px]">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-2xl mx-auto mb-6 shadow-lg shadow-blue-200"></div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">InvoiceFlow</h1>
          <p className="text-gray-500 mt-2 font-medium">{isLogin ? 'Welcome back' : 'Create an account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div>
                <input 
                type="text" 
                placeholder="Username"
                required
                className="w-full px-5 py-4 bg-gray-100 border-none rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#007AFF] focus:bg-white transition-all outline-none font-medium"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <div>
                <input 
                type="password" 
                placeholder="Password"
                required
                className="w-full px-5 py-4 bg-gray-100 border-none rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#007AFF] focus:bg-white transition-all outline-none font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            {!isLogin && (
                <div>
                <select 
                    className="w-full px-5 py-4 bg-gray-100 border-none rounded-2xl text-gray-900 focus:ring-2 focus:ring-[#007AFF] focus:bg-white transition-all outline-none font-medium appearance-none"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                >
                    <option value={UserRole.MEMBER}>Team Member</option>
                    <option value={UserRole.ADMIN}>Admin (Manager)</option>
                    <option value={UserRole.SUPERADMIN}>Superadmin (Demo)</option>
                </select>
                </div>
            )}
          </div>

          {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-xl">{error}</p>}

          <button 
            type="submit" 
            className="w-full bg-[#007AFF] text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-600 transition-all active:scale-[0.98] shadow-lg shadow-blue-200"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-[#007AFF] font-semibold text-sm hover:opacity-80 transition-opacity"
          >
            {isLogin ? 'Create new account' : 'Sign in to existing account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;