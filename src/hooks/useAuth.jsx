import React, { useState, useEffect, createContext, useContext } from 'react';
import { login as strapiLogin, register as strapiRegister, fetchMe } from '../api/strapi';

// 1. Create Context
const AuthContext = createContext();

// 2. Create Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'buyer', 'seller', 'admin'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('jwt');
            if (token) {
                try {
                    const userData = await fetchMe(token);
                    setUser(userData);
                    setRole(userData.user_type || 'buyer');
                } catch (error) {
                    console.error("Invalid token:", error);
                    logout();
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (identifier, password) => {
        const data = await strapiLogin(identifier, password);
        localStorage.setItem('jwt', data.jwt);
        setUser(data.user);
        setRole(data.user.user_type || 'buyer');
        return data.user;
    };

    const register = async (username, email, password, user_type) => {
        const data = await strapiRegister(username, email, password, user_type);
        localStorage.setItem('jwt', data.jwt);
        setUser(data.user);
        setRole(data.user.user_type || 'buyer');
        return data.user;
    };

    const logout = () => {
        localStorage.removeItem('jwt');
        setUser(null);
        setRole(null);
    };

    const value = { user, role, loading, login, register, logout };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
            {loading && (
                <div className="flex items-center justify-center min-h-screen bg-white">
                    <div className="text-xl font-bold animate-pulse">Initializing App...</div>
                </div>
            )}
        </AuthContext.Provider>
    );
};

// 3. Export Hook
export const useAuth = () => {
    return useContext(AuthContext);
};
