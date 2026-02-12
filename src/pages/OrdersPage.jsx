import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { fetchOrders, fetchProducts } from '../api/strapi';

const OrdersPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productImages, setProductImages] = useState({});

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // 1. Fetch Orders from Strapi
                const ordersData = await fetchOrders({ userId: user.id });

                // Sort orders in memory (Strapi sort might be available but let's be safe)
                // Strapi returns ISO strings for createdAt
                ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrders(ordersData);

                // 2. Fetch Products to get live images
                const productsData = await fetchProducts();
                const imagesMap = {};
                productsData.forEach(p => {
                    imagesMap[p.id] = p.imageUrl || p.image;
                });
                setProductImages(imagesMap);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, navigate]);

    if (loading) return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-xl font-bold text-gray-500">Loading Orders...</div>
            </div>
        </>
    );

    return (
        <div className="min-h-screen animated-dark-bg pb-12">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white">My Orders</h1>
                    <button onClick={() => navigate('/shop')} className="text-sm font-bold text-gray-300 hover:text-white hover:underline">
                        Example: Continue Shopping
                    </button>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-md rounded-xl shadow p-12 text-center text-white border border-white/20">
                        <div className="text-6xl mb-4">🛍️</div>
                        <h2 className="text-xl font-bold mb-2">No orders yet</h2>
                        <p className="text-gray-200 mb-6">You haven't placed any orders yet. Go add something to your cart!</p>
                        <button
                            onClick={() => navigate('/shop')}
                            className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition"
                        >
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map(order => (
                            <div key={order.documentId || order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                                {/* Order Header */}
                                <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap justify-between items-center gap-4">
                                    <div className="flex gap-8 text-sm">
                                        <div>
                                            <p className="text-gray-500 font-medium uppercase text-xs">Order Placed</p>
                                            <p className="font-bold text-gray-900">
                                                {order.createdAt
                                                    ? new Date(order.createdAt).toLocaleDateString()
                                                    : 'Just now'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 font-medium uppercase text-xs">Total</p>
                                            <p className="font-bold text-gray-900">₹{order.totalAmount}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 font-medium uppercase text-xs">Order ID</p>
                                            <p className="font-mono text-gray-700">#{(order.documentId || String(order.id)).slice(0, 8)}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${order.status === 'delivered' ? 'bg-green-600 text-white shadow-green-200' :
                                            order.status === 'shipped' ? 'bg-blue-600 text-white shadow-blue-200' :
                                                'bg-amber-500 text-white shadow-amber-200'
                                            }`}>
                                            {order.status === 'paid' ? 'PAID & PROCESSING' : order.status || 'Processing'}
                                        </span>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="p-6">
                                    {order.items && order.items.map((item, idx) => {
                                        // Resolution Logic: Saved Image -> DB Image -> Placeholder
                                        const displayImage = item.imageUrl || productImages[item.productId] || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=2070&auto=format&fit=crop';

                                        return (
                                            <div key={idx} className="flex items-center gap-4 mb-4 last:mb-0">
                                                <div className="h-16 w-16 bg-gray-100 rounded md:border overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={displayImage}
                                                        alt={item.name}
                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=2070&auto=format&fit=crop'; }}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                                                    <p className="text-sm text-gray-500">Size: {item.selectedSize} | Qty: {item.quantity || 1}</p>
                                                    <p className="text-sm font-bold text-purple-600">₹{item.price}</p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {order.shippingAddress && (
                                        <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                                            <span className="font-bold text-gray-700">Shipping to: </span>
                                            {order.shippingAddress.fullName}, {order.shippingAddress.city}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersPage;
