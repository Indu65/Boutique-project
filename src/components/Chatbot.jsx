import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchProducts as fetchStrapiProducts } from '../api/strapi';
import { useAuth } from '../hooks/useAuth';

const Chatbot = () => {
    const location = useLocation();
    const { user } = useAuth();

    // Hide Chatbot on specific routes (Login, Register, Dashboard)
    const hiddenRoutes = ['/login', '/register', '/seller-dashboard', '/admin-dashboard'];
    if (hiddenRoutes.some(route => location.pathname.startsWith(route))) {
        return null;
    }

    const [isOpen, setIsOpen] = useState(false);
    const [userInitial, setUserInitial] = useState('G');
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            const name = user.username || user.email || 'User';
            setUserInitial(name.charAt(0).toUpperCase());
        } else {
            setUserInitial('G');
        }
    }, [user]);

    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello! 👋 Welcome to Chromatique. How can I match your style today?",
            sender: 'bot',
            type: 'text'
        },
        {
            id: 2,
            text: "Ask me about a dress type (e.g., 'Show me Kurtas') or choose a quick option:",
            sender: 'bot',
            type: 'text'
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const quickOptions = [
        "Show Men's", "Show Women's", "Latest Kurtas", "Lehengas", "Track Order", "Return Policy"
    ];

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        // User Message
        const userMsg = { id: Date.now(), text: text, sender: 'user', type: 'text' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Analyze Intent
        setTimeout(async () => {
            const lowerText = text.toLowerCase();
            let botResponse = [];

            if (lowerText.includes('track') || lowerText.includes('order')) {
                botResponse.push({
                    text: "You can track your orders in the 'My Orders' section. Would you like me to take you there?",
                    type: 'text',
                    action: { label: "Go to Orders", path: "/orders" }
                });
            }
            else if (lowerText.includes('return') || lowerText.includes('refund')) {
                botResponse.push({
                    text: "We have a 7-day hassle-free return policy! Just go to your orders and click 'Return' on eligible items.",
                    type: 'text'
                });
            }
            else {
                // Default: Try to find products for ANY input
                botResponse.push({ text: `Checking our closet for "${text}"... 🧐`, type: 'text' });

                try {
                    // Using client-side filtering on all products for now, as Strapi fuzzy search needs a plugin or complex filters
                    // Fetching all products and filtering here for simplicity in this demo transition
                    const allProducts = await fetchStrapiProducts();
                    const products = allProducts.filter(p => {
                        const name = (p.name || '').toLowerCase();
                        const category = (p.category || '').toLowerCase();
                        // Simple inclusion check
                        return name.includes(lowerText) || category.includes(lowerText);
                    }).slice(0, 5);

                    if (products.length > 0) {
                        botResponse.push({
                            type: 'products',
                            items: products
                        });
                        botResponse.push({ text: "Here's what I found! Click to view details.", type: 'text' });
                    } else {
                        // Real matches failed, offer generic help
                        botResponse.push({
                            text: "I couldn't find exact matches for that. Try simpler keywords like 'Kurta', 'Saree', or 'Red Dress'.",
                            type: 'text'
                        });
                    }
                } catch (e) {
                    botResponse.push({ text: "I'm having a bit of trouble checking the stock right now.", type: 'text' });
                }
            }

            // specific "bot" id for response to avoid key clashes
            const botMsgs = botResponse.map((msg, idx) => ({
                ...msg,
                id: Date.now() + 1 + idx,
                sender: 'bot'
            }));

            setMessages(prev => [...prev, ...botMsgs]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">

            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-96 sm:w-[450px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col animate-fade-in-up transition-all duration-300 transform origin-bottom-right h-[600px]">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex items-center gap-3 shadow-md">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-white p-1">
                                <img src="/bot-avatar.png" alt="Bot" className="w-full h-full rounded-full object-cover" />
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-indigo-600 rounded-full"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Chromatique Bot</h3>
                            <p className="text-indigo-200 text-xs flex items-center gap-1">
                                <span className="animate-pulse">●</span> Online
                            </p>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="ml-auto text-white/80 hover:text-white transition">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end items-end' : 'justify-start items-end'}`}>

                                {msg.sender === 'bot' && (
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 mr-2 flex items-center justify-center overflow-hidden border border-indigo-200 mb-1">
                                        <img src="/bot-avatar.png" alt="Bot" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className={`max-w-[80%] space-y-2`}>
                                    {/* Text Bubble */}
                                    {msg.text && (
                                        <div className={`p-3 text-sm shadow-sm ${msg.sender === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-none rounded-2xl'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none rounded-2xl'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    {msg.action && (
                                        <button
                                            onClick={() => navigate(msg.action.path)}
                                            className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-indigo-700 transition block w-max"
                                        >
                                            {msg.action.label}
                                        </button>
                                    )}
                                    {/* Product Carousel */}
                                    {msg.type === 'products' && (
                                        <div className="flex overflow-x-auto gap-3 py-2 scrollbar-hide snap-x">
                                            {msg.items.map(product => (
                                                <div
                                                    key={product.id}
                                                    className="min-w-[140px] w-[140px] bg-white rounded-lg shadow-md border overflow-hidden snap-center cursor-pointer hover:shadow-lg transition-transform hover:scale-105"
                                                    onClick={() => navigate(`/product/${product.id}`)}
                                                >
                                                    <div className="h-28 bg-gray-100">
                                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="p-2">
                                                        <p className="text-xs font-bold text-gray-800 truncate">{product.name}</p>
                                                        <p className="text-xs text-purple-600 font-bold">₹{product.price}</p>
                                                        <button className="mt-2 w-full bg-black text-white text-[10px] py-1 rounded font-bold uppercase hover:bg-gray-800">
                                                            View
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {msg.sender === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex-shrink-0 ml-2 flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-white mb-1">
                                        {userInitial}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex items-center gap-2 text-gray-400 text-xs ml-10">
                                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150"></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chips */}
                    {!isTyping && messages[messages.length - 1]?.sender === 'bot' && (
                        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                            {quickOptions.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(opt)}
                                    className="whitespace-nowrap bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-xs font-bold hover:bg-indigo-100 transition"
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-100 border-none rounded-full px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            className="bg-indigo-600 text-white p-2 rounded-full disabled:opacity-50 hover:bg-indigo-700 transition"
                        >
                            <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409 8.729 8.729 0 014.722-.593 8.729 8.729 0 014.722.593 1 1 0 001.169-1.409l-7-14z" /></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${isOpen ? 'rotate-90 scale-0 opacity-0' : 'scale-100 opacity-100'} transition-all duration-300 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-lg hover:shadow-2xl flex items-center justify-center group relative`}
            >
                {/* Chat Icon */}
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>

                {/* Ping Animation */}
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                </span>
            </button>

            {/* Close Button (When open, replaces the big toggle or sit on top? Actually standard pattern is the toggle button turns into close, or just stays as toggle. I'll strictly use the top-right close for closing window and this button to OPEN.) */}
            {/* Actually, let's make the main button disappear when open to avoid clutter, relying on the window's close button, OR toggle logic. I'll stick to a persistent launcher for now but hide it when OPEN to match the "Tommy" vibe which likely just has the window open. */}

            {/* Correction: The standard UI often keeps a launcher. I'll keep it simple. */}

        </div>
    );
};

export default Chatbot;
