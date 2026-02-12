import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const SellerNavbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        logout();
        navigate('/');
    };

    return (
        <header className="sticky top-0 z-50 bg-teal-50 shadow-sm border-b border-teal-100 border-t-4 border-teal-600">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                {/* Brand / Logo */}
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate('/seller-dashboard')}
                >
                    <div className="bg-teal-600 text-white text-sm font-bold px-3 py-1 rounded tracking-wider">SELLER</div>
                    <div className="text-2xl font-bold tracking-tight brand-gradient">
                        CHROMATIQUE
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-6">
                    {/* Switch to Shop Link */}
                    <button
                        onClick={() => navigate('/shop')}
                        className="text-lg font-bold text-teal-600 hover:text-teal-800 transition hidden sm:flex items-center gap-1 group"
                    >
                        <span>Go to Shop</span>
                        <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </button>

                    <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>

                    {/* User Profile & Logout */}
                    {user && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold uppercase text-xs shadow-md">
                                    {user.email?.charAt(0)}
                                </div>
                                <span className="hidden md:inline text-sm font-bold text-gray-700">
                                    {user.email?.split('@')[0]}
                                </span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="text-sm font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white px-5 py-2.5 rounded transition shadow-sm"
                            >
                                LOGOUT
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default SellerNavbar;
