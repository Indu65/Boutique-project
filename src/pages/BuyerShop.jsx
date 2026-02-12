import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { fetchProducts, fetchOrders } from '../api/strapi';

// Placeholder images for hero carousel (Using generic URLs for demo)
const HERO_IMAGES = [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop", // Fashion Generic
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop", // Women
    "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?q=80&w=2070&auto=format&fit=crop"  // Men
];

// --- Toast Notification Component ---
const Toast = ({ message, onClose }) => (
    <div className="fixed top-20 right-5 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-slide-in">
        <span className="text-green-400 text-xl">✓</span>
        <div>
            <h4 className="font-bold text-sm">Success</h4>
            <p className="text-xs text-gray-300">{message}</p>
        </div>
        <button onClick={onClose} className="ml-4 text-gray-500 hover:text-white">×</button>
    </div>
);

const BuyerShop = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { cart, addToCart, checkout } = useCart(); // Use Global Cart Context & Checkout
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    // const [cart, setCart] = useState([]); // REMOVED local state
    const [loading, setLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState(false);
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentSlide, setCurrentSlide] = useState(0);
    const [toast, setToast] = useState(null); // { message: string }

    // ... (Existing Effects) ...

    // Initial Fetch
    useEffect(() => {
        fetchProductsData();
        if (user) {
            fetchRecommendations();
        }
    }, [user]);



    // Carousel Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Filter Logic
    useEffect(() => {
        let result = products;

        if (activeCategory !== "All") {
            result = result.filter(p => p.category === activeCategory);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                (p.name && p.name.toLowerCase().includes(query)) ||
                (p.tags && Array.isArray(p.tags) && p.tags.some(t => t && t.toLowerCase().includes(query)))
            );
        }

        setFilteredProducts(result);
    }, [products, activeCategory, searchQuery]);


    const fetchProductsData = async () => {
        try {
            const prods = await fetchProducts();
            setProducts(prods);
            setFilteredProducts(prods);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching products:", error);
            setLoading(false);
        }
    };

    const fetchRecommendations = async () => {
        try {
            if (!user) return;
            const myOrders = await fetchOrders({ userId: user.id });

            if (myOrders && myOrders.length > 0) {
                // Get most recent order
                const lastOrder = myOrders[0];
                const tags = new Set();
                if (lastOrder.items) {
                    lastOrder.items.forEach(item => {
                        if (item.tags && Array.isArray(item.tags)) item.tags.forEach(t => tags.add(t));
                        // Fallback if tags are comma separated string in Strapi
                        if (item.tags && typeof item.tags === 'string') item.tags.split(',').forEach(t => tags.add(t.trim()));
                    });
                }

                const tagArray = Array.from(tags).slice(0, 10);
                if (tagArray.length > 0) {
                    // Filter products client side for recommendations since we might have them all or just fetch again
                    // For now, let's reuse `products` state if available, or fetchFresh
                    // Using simple client-side filter for now to avoid complex strapi queries
                    const allProducts = products.length > 0 ? products : await fetchProducts();

                    const recs = allProducts.filter(p => {
                        if (!p.tags) return false;
                        const pTags = Array.isArray(p.tags) ? p.tags : p.tags.split(',').map(t => t.trim());
                        return pTags.some(t => tagArray.includes(t));
                    }).slice(0, 5);

                    setRecommendations(recs);
                }
            }
        } catch (err) {
            console.error("Rec Engine Error:", err);
        }
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddToCart = (e, product) => {
        e.stopPropagation(); // Prevent navigating to details page
        addToCart(product);
        showToast(`Added ${product.name} to cart!`);
    };

    // Removed local addToCart function


    const handleCheckout = async () => {
        if (!user) {
            alert("Please login to checkout.");
            navigate('/login');
            return;
        }
        if (cart.length === 0) return;

        setCheckingOut(true);
        try {
            await checkout(user.id);
            alert(`Order Placed Successfully! (${cart.length} items)`);
            fetchRecommendations();
        } catch (err) {
            console.error("Checkout Error:", err);
            alert("Checkout Failed: " + err.message);
        } finally {
            setCheckingOut(false);
        }
    };

    const handleLogout = async () => {
        logout();
        window.location.reload();
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Content...</div>;

    return (
        <div className="min-h-screen bg-white font-sans text-gray-800 relative">
            {toast && <Toast message={toast} onClose={() => setToast(null)} />}

            {/* 1. HEADER */}
            <Navbar
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            {/* 2. HERO CAROUSEL */}
            <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden bg-gray-200">
                {HERO_IMAGES.map((img, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <img src={img} alt="Hero" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-white text-center p-4">
                            <h2 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-md tracking-wider">NEW ARRIVALS</h2>
                            <p className="text-lg md:text-xl mb-8 drop-shadow-sm font-light">Explore the latest trends for the season</p>
                            <button
                                onClick={() => document.getElementById('shop-collection')?.scrollIntoView({ behavior: 'smooth' })}
                                className="neon-button px-10 py-3 font-bold text-lg tracking-widest transition transform hover:scale-105"
                            >
                                SHOP NOW
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. MAIN CONTENT */}
            <div className="max-w-7xl mx-auto px-4 py-12">

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <div className="mb-16">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Recommended For You</h2>
                            <div className="h-0.5 bg-gray-200 flex-grow ml-6"></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {recommendations.map(product => (
                                <ProductCard key={product.id} product={product} addToCart={addToCart} showToast={showToast} />

                            ))}
                        </div>
                    </div>
                )}

                {/* Product Section Title */}
                <div id="shop-collection" className="flex flex-col items-center mb-10">
                    <h2 className="text-3xl font-bold uppercase tracking-wide text-gray-900 mb-2">{activeCategory === "All" ? "All Collections" : `${activeCategory}'s Collection`}</h2>
                    <div className="w-16 h-1 bg-black"></div>
                </div>

                {/* Product Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-lg">No products found in this category.</p>
                        <button onClick={() => setActiveCategory("All")} className="mt-4 text-blue-600 underline">View All Products</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} addToCart={addToCart} showToast={showToast} />

                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                    <div>
                        <h4 className="font-bold mb-4">ABOUT US</h4>
                        <p className="text-gray-400">Chromatique brings you the finest selection of apparel for the whole family.</p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">CUSTOMER CARE</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li>Contact Us</li>
                            <li>Shipping & Returns</li>
                            <li>Size Guide</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">NEWSLETTER</h4>
                        <div className="flex">
                            <input type="email" placeholder="Enter your email" className="bg-gray-800 border-none p-2 w-full text-white" />
                            <button className="bg-white text-black px-4 font-bold">JOIN</button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Sub-component for Product Card
const ProductCard = ({ product, addToCart, showToast }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/product/${product.documentId}`)}
            className="group cursor-pointer bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                <img
                    src={product.imageUrl || 'https://via.placeholder.com/400'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Quick Add Button */}
                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                            showToast(`Added ${product.name} to cart!`);
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2.5 rounded-xl font-bold hover:shadow-lg hover:from-purple-700 hover:to-blue-600 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                    >
                        ADD TO CART
                    </button>
                </div>
            </div>

            <div className="p-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{product.category}</div>
                <h3 className="font-bold text-gray-900 text-base mb-1 truncate">{product.name}</h3>

                <div className="flex justify-between items-center mt-2">
                    <p className="text-lg font-extrabold text-indigo-600">₹{product.price}</p>

                    {/* Rating Badge */}
                    {product.averageRating > 0 && (
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 shadow-sm">
                            <span className="text-xs font-bold text-amber-600">{product.averageRating.toFixed(1)}</span>
                            <span className="text-amber-400 text-xs text-amber-500">★</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default BuyerShop;
