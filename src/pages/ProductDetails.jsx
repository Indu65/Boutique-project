import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import { fetchProductById, fetchProducts } from '../api/strapi';
import { useCart } from '../context/CartContext';

import PaymentModal from '../components/PaymentModal';
import ReviewSection from '../components/ReviewSection';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart, checkout } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState('');
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [showPayment, setShowPayment] = useState(false);

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Main Product
                const data = await fetchProductById(id);

                if (data) {
                    setProduct(data);

                    // Auto-select first size if available
                    if (data.sizes && data.sizes.length > 0) {
                        setSelectedSize(data.sizes[0]);
                    }

                    // 2. Fetch Related Products (Based on Category)
                    if (data.category) {
                        try {
                            // Fetch all products and filter for now (or optimize API later)
                            const allProducts = await fetchProducts();
                            const related = allProducts
                                .filter(p => p.category === data.category && p.documentId !== id) // Filter by documentId
                                .slice(0, 4);
                            setRelatedProducts(related);
                        } catch (err) {
                            console.error("Error fetching related:", err);
                        }
                    }
                } else {
                    console.log("No such product!");
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
        // Reset scroll to top when id changes
        window.scrollTo(0, 0);
    }, [id]);

    const handleAddToCart = () => {
        if (!selectedSize) {
            alert("Please select a size!");
            return;
        }
        addToCart({ ...product, selectedSize });
        alert("Added to Cart!");
    };

    const handleBuyNowClick = () => {
        if (!selectedSize && product.sizes && product.sizes.length > 0) {
            alert("Please select a size!");
            return;
        }

        if (!user) {
            alert("Please login to buy!");
            navigate('/login');
            return;
        }

        setShowPayment(true);
    };

    const handlePayment = async (shippingData) => {
        // Technically for "Buy Now" we might want to just buy THIS item,
        // but for simplicity, let's treat it as "Add to Cart + Checkout Cart"
        // OR clear cart, add this, checkout.
        // Current behavior: Add to Cart -> Checkout All.

        // Add current item to cart first
        addToCart({ ...product, selectedSize: selectedSize || 'N/A' });

        try {
            await checkout(user.id, shippingData);
            setShowPayment(false);
            alert("Order Placed Successfully!");
            navigate('/shop');
        } catch (err) {
            console.error(err);
            alert("Checkout Failed: " + err.message);
        }
    };

    if (loading) return <div className="text-center p-20 text-xl font-bold">Loading Product...</div>;
    if (!product) return <div className="text-center p-20 text-xl font-bold text-red-500">Product not found.</div>;

    return (
        <div className="min-h-screen animated-soft-bg pb-12">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Back Button */}
                <button onClick={() => navigate(-1)} className="mb-6 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm hover:shadow-md text-gray-700 hover:text-indigo-600 font-bold text-lg flex items-center gap-2 transition-all group">
                    <span className="transform group-hover:-translate-x-1 transition-transform">←</span> Back to Shop
                </button>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                        {/* Image Section */}
                        <div className="h-96 md:h-auto bg-gray-100 relative">
                            <img
                                src={product.imageUrl || 'https://via.placeholder.com/600'}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Details Section */}
                        <div className="p-8 md:p-12 flex flex-col justify-center">
                            <div className="uppercase tracking-wide text-sm text-indigo-500 font-bold mb-2">
                                {product.category}
                            </div>
                            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{product.name}</h1>
                            <p className="text-2xl text-gray-900 font-bold mb-6">₹{product.price}</p>

                            <p className="text-gray-600 leading-relaxed mb-8">
                                {product.description || "No description available for this product."}
                            </p>

                            {/* Size Selector */}
                            {product.sizes && product.sizes.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Select Size</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {product.sizes.map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-4 py-2 border rounded-md font-medium transition-all ${selectedSize === size
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stock Display */}
                            <div className="mb-8">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock <= 0}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ADD TO CART
                                </button>
                                <button
                                    onClick={handleBuyNowClick}
                                    disabled={product.stock <= 0}
                                    className="flex-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    BUY NOW
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendations Section */}
                {relatedProducts.length > 0 && (
                    <div className="mt-20">
                        <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">You May Also Like</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                            {relatedProducts.map(rec => (
                                <div
                                    key={rec.id}
                                    onClick={() => navigate(`/product/${rec.documentId}`)}
                                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                                >
                                    <div className="h-64 overflow-hidden relative">
                                        <img src={rec.imageUrl} alt={rec.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900 truncate">{rec.name}</h3>
                                        <p className="text-purple-600 font-bold mt-1">₹{rec.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reviews Section - Moved to Bottom */}
                <ReviewSection productId={id} />
            </div>

            {showPayment && (
                <PaymentModal
                    onClose={() => setShowPayment(false)}
                    onPay={handlePayment}
                    totalAmount={product.price}
                />
            )}
        </div>
    );
};

export default ProductDetails;
