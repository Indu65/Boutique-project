import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('buyer'); // Default
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleRegister = async (e) => {
        e.preventDefault();
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (!trimmedUsername) {
            setError("Username is required.");
            return;
        }

        try {
            const user = await register(trimmedUsername, trimmedEmail, trimmedPassword, role);

            // Redirect
            if (role === 'admin') navigate('/admin-dashboard');
            else if (role === 'seller') navigate('/seller-dashboard');
            else navigate('/shop');

        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error.message);
            } else {
                setError("Registration failed. Please try again.");
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 relative overflow-hidden">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                {/* Extra Color: Teal/Cyan */}
                <div className="absolute top-[20%] left-[40%] w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            {/* Form Container */}
            <div className="bg-gray-900/80 backdrop-blur-md p-8 rounded-lg shadow-2xl w-full max-w-lg border border-white/10 relative z-10">
                <h2 className="text-4xl font-bold mb-8 text-center text-white">Registration</h2>
                {error && (
                    <div className="bg-red-500/20 border border-red-500 p-4 mb-4 rounded">
                        <p className="text-red-100 text-base">{error}</p>
                        {error.includes("already registered") && (
                            <button
                                onClick={() => navigate('/login')}
                                className="mt-2 text-base font-bold text-white hover:underline focus:outline-none"
                            >
                                &rarr; Go to Login Page
                            </button>
                        )}
                    </div>
                )}
                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full p-4 text-lg rounded bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-4 text-lg rounded bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full p-4 text-lg rounded bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-4 text-lg rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 [&>option]:text-black"
                        >
                            <option value="buyer">Buyer</option>
                            <option value="seller">Seller</option>
                            <option value="admin">Admin (Testing Only)</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-4 text-xl rounded-lg hover:from-purple-600 hover:to-indigo-700 transition shadow-lg transform hover:scale-[1.02] mt-6">Register</button>
                </form>
                <div className="mt-8 text-center">
                    <span className="text-base text-gray-300">Already have an account? </span>
                    <Link to="/login" className="text-white text-base font-semibold hover:text-purple-300 transition">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
