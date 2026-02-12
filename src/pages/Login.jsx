import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        try {
            const user = await login(trimmedEmail, trimmedPassword);

            // Redirect Logic based on user_type (role)
            const role = user.user_type || 'buyer';
            if (role === 'admin') navigate('/admin-dashboard');
            else if (role === 'seller') navigate('/seller-dashboard');
            else navigate('/shop');

        } catch (err) {
            console.error("Login Error:", err);
            // Strapi error structure might differ from Firebase
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error.message);
            } else {
                setError("Invalid email or password.");
            }
        }
    };

    const fillCredentials = (role) => {
        if (role === 'admin') {
            setEmail('admin@boutique.com');
            setPassword('admin123');
        } else if (role === 'seller') {
            setEmail('seller@boutique.com');
            setPassword('seller123');
        } else {
            setEmail('buyer@boutique.com');
            setPassword('buyer123');
        }
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-cover bg-center"
            style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop')` // Abstract Liquid Purple/Blue
            }}
        >
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
                <h2 className="text-3xl font-bold mb-2 text-center text-gray-900 tracking-tight">Welcome Back</h2>
                <p className="text-center text-gray-600 mb-8 font-medium">Login to your account</p>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r">
                        <p className="text-red-700 text-sm font-bold">{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            className="w-full bg-white border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition shadow-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-white border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition shadow-sm"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition transform hover:-translate-y-1 shadow-lg">
                        LOGIN
                    </button>
                </form>

                {/* Quick Access Demo Section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-xs text-center text-gray-500 uppercase tracking-widest mb-4 font-bold">Quick Demo Access</p>
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => fillCredentials('admin')} className="text-xs bg-purple-100 text-purple-800 py-2 rounded hover:bg-purple-200 font-bold transition">
                            Admin
                        </button>
                        <button onClick={() => fillCredentials('seller')} className="text-xs bg-blue-100 text-blue-800 py-2 rounded hover:bg-blue-200 font-bold transition">
                            Seller
                        </button>
                        <button onClick={() => fillCredentials('buyer')} className="text-xs bg-green-100 text-green-800 py-2 rounded hover:bg-green-200 font-bold transition">
                            Buyer
                        </button>
                    </div>
                    <p className="text-xs text-center text-gray-400 mt-2 italic">*Pre-fills test credentials</p>
                </div>

                <div className="mt-8 text-center">
                    <span className="text-sm text-gray-600">Don't have an account? </span>
                    <Link to="/register" className="text-black font-bold text-sm hover:underline">Register Now</Link>
                </div>
            </div>
        </div >
    );
};

export default Login;
