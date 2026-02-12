import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { fetchNotifications, markNotificationRead } from '../api/strapi';

const Navbar = ({ activeCategory, setActiveCategory, searchQuery: propSearchQuery, setSearchQuery: propSetSearchQuery }) => {
    const { user, loading, logout } = useAuth();
    const { cart } = useCart();
    const navigate = useNavigate();
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [popupNotification, setPopupNotification] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    // Sync local search with prop if provided
    useEffect(() => {
        if (propSearchQuery !== undefined) {
            setLocalSearchQuery(propSearchQuery);
        }
    }, [propSearchQuery]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setLocalSearchQuery(val);
        if (propSetSearchQuery) {
            propSetSearchQuery(val);
        }
    };

    // Listen for Notifications
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        const loadNotifications = async () => {
            try {
                const data = await fetchNotifications(user.id);
                setNotifications(data || []);
            } catch (err) {
                console.error("Failed to load notifications", err);
            }
        };

        loadNotifications();

        // Optional: Poll every 10 seconds (faster for demo)
        const interval = setInterval(loadNotifications, 10000);
        return () => clearInterval(interval);
    }, [user]);

    // Handle Pop-up Logic
    useEffect(() => {
        // Find the most recent UNREAD order_status notification
        const latestUnreadOrderNotif = notifications.find(n => !n.read && n.type === 'order_status');

        if (latestUnreadOrderNotif) {
            // Only show if it's different from the current one to avoid re-triggering closed popups
            // (Unless we want it to persist until read? User asked: "after that pop up should not come")
            // Current logic: If there is an unread order notif, show it.
            // When user clicks it -> read -> it disappears.
            setPopupNotification(latestUnreadOrderNotif);
            setShowPopup(true);
        } else {
            setShowPopup(false);
        }
    }, [notifications]);

    const handleNotificationClick = async (notif) => {
        if (!notif.read) {
            await markNotificationRead(notif.documentId);
            setNotifications(prev => prev.map(n => n.documentId === notif.documentId ? { ...n, read: true } : n));
        }
        // Close popup if the clicked notification was the popup one
        if (popupNotification && popupNotification.documentId === notif.documentId) {
            setShowPopup(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;


    const handleLogout = async () => {
        logout();
        navigate('/');
    };

    // Removed unused handleSearch to avoid ReferenceErrors

    // Wrapper to handle navigation vs local state
    const handleCategoryClick = (cat) => {
        if (setActiveCategory) {
            setActiveCategory(cat);
        } else {
            // Navigate to shop with category filter? For now just go to shop.
            navigate('/shop');
        }
    };

    // Determine if we should treat search input as valid prop updater
    // For this specific request, I will mirror the exact structure.

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm">
            {/* Top Bar */}
            <div className="bg-indigo-600 py-2 text-center text-sm font-medium text-white tracking-wide">
                Free Shipping on Orders over ₹999 | Use Code: NEWUSER
            </div>

            {/* Main Nav */}
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo/Brand */}
                <div
                    className="text-4xl font-extrabold tracking-tighter cursor-pointer brand-gradient py-2"
                    onClick={() => {
                        if (setActiveCategory) setActiveCategory("All");
                        navigate('/');
                    }}
                >
                    CHROMATIQUE
                </div>

                {/* Category Links (Desktop) */}
                <nav className="hidden md:flex gap-8 font-medium text-sm text-gray-600">
                    {["Women", "Men", "Kids", "Seniors"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryClick(cat)}
                            className={`text-lg font-bold uppercase tracking-wider transition-all duration-300 transform hover:-translate-y-0.5 hover:text-indigo-600 ${activeCategory === cat ? 'text-indigo-700 border-b-2 border-indigo-700' : 'text-slate-800'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </nav>

                {/* Right Actions: Search, Cart, User */}
                <div className="flex items-center gap-6">
                    {/* Gradient Border Search */}
                    <div
                        className="hidden sm:flex items-center rounded-full px-4 py-1.5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] shadow-sm"
                        style={{
                            background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(to right, #ec4899, #3b82f6) border-box',
                            border: '3px solid transparent', // Increased border thickness
                        }}
                    >
                        <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent border-none text-sm focus:ring-0 w-32 focus:w-56 transition-all outline-none text-gray-700 placeholder-gray-400 font-medium"
                            value={localSearchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>

                    {/* Notifications */}
                    {user && (
                        <div className="relative">
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="relative p-2 text-gray-700 hover:text-black transition"
                            >
                                {/* Solid Filled Bell Icon */}
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 h-5 w-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm transform translate-x-1 -translate-y-1">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {isNotifOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in origin-top-right">
                                    <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                                        <span className="text-xs text-gray-500">{unreadCount} unread</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-gray-400">No notifications yet</div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div
                                                    key={notif.documentId || notif.id}
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`px-4 py-3 border-b last:border-0 hover:bg-gray-50 transition border-gray-100 cursor-pointer ${!notif.read ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''}`}
                                                >
                                                    <p className="text-sm font-bold text-gray-800">Order Update</p>
                                                    <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-2 text-right">
                                                        {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Just now'}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Pop-up Notification Toast (Anchored to Bell) */}
                            {showPopup && popupNotification && !isNotifOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-80 z-[60] bg-white border-l-4 border-indigo-600 shadow-2xl rounded-lg p-4 animate-fade-in-down cursor-pointer hover:bg-gray-50 transition-all duration-300"
                                    style={{ top: '100%' }}
                                    onClick={() => handleNotificationClick(popupNotification)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-gray-900">Order Update 🔔</h4>
                                            <p className="text-sm text-gray-600 mt-1">{popupNotification.message}</p>
                                            <p className="text-xs text-indigo-500 mt-2 font-medium">Click to mark as read</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowPopup(false);
                                            }}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cart */}
                    <div
                        className="relative cursor-pointer group"
                        onClick={() => navigate('/cart')}
                    >
                        {/* Gradient Cart Icon */}
                        <svg className="w-8 h-8 transition-transform transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#ec4899" />
                                    <stop offset="100%" stopColor="#f97316" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.70711 15.2929C4.07714 15.9229 4.52331 17 5.41421 17H17M17 17C15.8954 17 15 17.8954 15 19C15 20.1046 15.8954 21 17 21C18.1046 21 19 20.1046 19 19C19 17.8954 18.1046 17 17 17ZM9 19C9 20.1046 8.10457 21 7 21C5.89543 21 5 20.1046 5 19C5 17.8954 5.89543 17 7 17C8.10457 17 9 17.8954 9 19Z"
                                stroke="url(#cartGradient)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {cart.length}
                        </span>
                    </div>

                    {/* User / Login */}
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 text-sm focus:outline-none"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-pink-500 flex items-center justify-center text-white font-bold uppercase text-xs">
                                    {user.email?.charAt(0)}
                                </div>
                                <span className="hidden lg:inline font-bold text-gray-700">
                                    Hi, {user.email?.split('@')[0]}
                                </span>
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border overflow-hidden z-50 animate-fade-in">
                                    <div className="py-1">
                                        <button
                                            onClick={() => { navigate('/orders'); setIsDropdownOpen(false); }}
                                            className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition"
                                        >
                                            📦 My Orders
                                        </button>
                                        <div className="border-t"></div>
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-50 transition"
                                        >
                                            LOGOUT
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <a href="/login" className="text-sm font-bold hover:text-gray-600">LOGIN</a>
                    )}
                </div>
            </div>

            {/* Mobile Category Nav (Scrollable) */}
            <div className="md:hidden flex gap-4 overflow-x-auto px-4 py-2 border-t scrollbar-hide">
                {["Women", "Men", "Kids", "Seniors"].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className={`whitespace-nowrap text-sm font-medium ${activeCategory === cat ? 'text-black' : 'text-gray-500'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </header>
    );
};

export default Navbar;
