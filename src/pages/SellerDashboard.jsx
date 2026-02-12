import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import SellerNavbar from '../components/SellerNavbar';
import { fetchProducts, createProduct, updateProduct, fetchOrders, updateOrderStatus, createNotification } from '../api/strapi';

// MINIMAL SAFE VERSION
const SellerDashboard = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: '',
        description: '',
        stock: '',
        sizes: [],
        imageUrl: '',
        tags: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'orders'

    // Only Fetch Products (No Revenue/Charts for now)
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchDashboardData = async () => {
            try {
                // Fetch products where sellerId matches current user
                // Note: Strapi filters might need exact field name mapping. Assuming 'sellerId' exists in schema.
                const myProducts = await fetchProducts({ sellerId: user.id });

                // Optimization: Filter client-side to ensure strict match (Strapi ID is string, user.id might be number)
                const filteredProducts = myProducts.filter(p => String(p.sellerId) === String(user.id));
                setProducts(filteredProducts);

                // Fetch orders
                const myOrders = await fetchOrders({ sellerId: user.id });
                // Strapi sort handled in API or here? API has sort.
                setOrders(myOrders);

            } catch (error) {
                console.error("Error fetching data:", error);
                alert("Error loading dashboard: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    const handleInput = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSizeChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setFormData(prev => ({ ...prev, sizes: [...prev.sizes, value] }));
        } else {
            setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(size => size !== value) }));
        }
    };

    const handleEdit = (product) => {
        setEditingId(product.documentId);
        setFormData({
            name: product.name,
            price: product.price,
            category: product.category,
            description: product.description || '',
            stock: product.stock || '',
            sizes: product.sizes || [],
            imageUrl: product.imageUrl || '',
            tags: product.tags || ''
        });
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ name: '', price: '', category: '', description: '', stock: '', sizes: [], imageUrl: '', tags: '' });
        setIsFormOpen(false);
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();

        // STRICT VALIDATION
        if (!formData.name || !formData.price || !formData.category || !formData.description || !formData.stock) {
            alert("REQUIRED: Name, Price, Category, Description, and Stock.");
            return;
        }

        const validPrice = parseFloat(formData.price);
        const validStock = parseInt(formData.stock);

        if (isNaN(validPrice) || isNaN(validStock)) {
            alert("Price and Stock must be valid numbers.");
            return;
        }

        try {
            const productData = {
                name: formData.name,
                price: validPrice,
                category: formData.category,
                description: formData.description,
                stock: validStock,
                sizes: formData.sizes,
                imageUrl: formData.imageUrl || '',
                tags: formData.tags || '',
                sellerId: String(user.id), // Ensure string format
                sellerName: user.email || 'Unknown Seller',
                publishedAt: new Date().toISOString(), // Ensure product is published immediately
            };

            if (editingId) {
                // UPDATE EXISTING PRODUCT
                await updateProduct(editingId, productData);
                alert('SUCCESS: Product Updated!');
                setEditingId(null);
            } else {
                // CREATE NEW PRODUCT
                await createProduct(productData);
                alert('SUCCESS: Product Added!');
            }

            // Reset Form
            setFormData({ name: '', price: '', category: '', description: '', stock: '', sizes: [], imageUrl: '', tags: '' });
            // Refresh Page to see new item
            window.location.reload();

        } catch (err) {
            console.error("Error adding product:", err);
            alert("FAILED: " + err.message);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus, buyerId) => {
        try {
            // 1. Update Order Status
            await updateOrderStatus(orderId, newStatus);

            // 2. Notify Buyer
            let message = `Your order #${orderId.slice(0, 8)} has been ${newStatus}.`;
            if (newStatus === 'accepted') message = `Great news! Your order #${orderId.slice(0, 8)} has been accepted and is being prepared.`;
            if (newStatus === 'delivered') message = `Your order #${orderId.slice(0, 8)} has been delivered! Enjoy your purchase.`;

            await createNotification({
                message,
                userId: String(buyerId),
                type: 'order_status',
                read: false,
                relatedOrderId: orderId
            });

            console.log(`Notification sent: ${message}`);

            // 3. Update Local State
            setOrders(prev => prev.map(o => o.documentId === orderId ? { ...o, status: newStatus } : o));
            alert(`Order marked as ${newStatus}!`);

        } catch (error) {
            console.error("Error updating order:", error);
            alert("Failed to update order: " + error.message);
        }
    };

    if (loading) return (
        <div className="p-10 text-center font-bold text-lg">
            Loading Seller Dashboard...
        </div>
    );

    return (
        <div className={`min-h-screen ${activeTab === 'inventory' ? 'inventory-bg' : 'orders-bg'}`}>
            <SellerNavbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold transition-colors duration-300 text-white drop-shadow-md">
                        Seller Dashboard
                    </h1>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`px-8 py-3 rounded-lg font-bold text-lg transition-all shadow-md text-white bg-gradient-to-r from-orange-400 to-pink-500 ${activeTab === 'inventory' ? 'scale-105 shadow-orange-300' : 'opacity-60 hover:opacity-100'}`}
                        >
                            📦 Inventory
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-8 py-3 rounded-lg font-bold text-lg transition-all shadow-md text-white bg-gradient-to-r from-purple-500 to-indigo-500 ${activeTab === 'orders' ? 'scale-105 shadow-purple-300' : 'opacity-60 hover:opacity-100'}`}
                        >
                            🔔 Orders ({orders.filter(o => o.status !== 'delivered').length})
                        </button>
                    </div>

                    {!isFormOpen && activeTab === 'inventory' && (
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition shadow-lg font-bold"
                        >
                            <span>➕</span> Add New Product
                        </button>
                    )}
                </div>

                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        {orders.length === 0 ? (
                            <div className="bg-white p-12 rounded-xl border-2 border-dashed border-gray-200 text-center">
                                <div className="text-4xl mb-4">📭</div>
                                <h3 className="text-xl font-bold text-gray-800">No Orders Yet</h3>
                                <p className="text-gray-500">Wait for customers to discover your amazing products!</p>
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order.documentId || order.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                                    {/* Order Header */}
                                    <div className="bg-gradient-to-r from-indigo-100 to-purple-100 px-6 py-4 border-b border-indigo-200 flex flex-wrap justify-between items-center gap-4">
                                        <div>
                                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Order ID</span>
                                            <p className="font-mono text-base font-bold text-gray-800">#{(order.documentId || String(order.id)).slice(0, 8)}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Date</span>
                                            <p className="text-base font-medium text-gray-700">
                                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Just now'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total</span>
                                            <p className="text-xl font-bold text-green-600">₹{order.totalAmount}</p>
                                        </div>
                                        <div>
                                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase text-white shadow-md tracking-wider ${order.status === 'delivered' ? 'bg-gradient-to-r from-green-400 to-emerald-600 shadow-green-200' :
                                                order.status === 'accepted' ? 'bg-gradient-to-r from-blue-400 to-indigo-600 shadow-blue-200' :
                                                    'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-orange-200'
                                                }`}>
                                                {order.status || 'Pending'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="p-6">
                                        <div className="space-y-4 mb-6">
                                            {(order.items || []).map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-4">
                                                    <div className="h-12 w-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900 line-clamp-1 text-lg">{item.name}</h4>
                                                        <p className="text-base text-gray-500">Size: {item.selectedSize} | Qty: {item.quantity}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium">₹{item.price}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Actions */}
                                        {order.status !== 'delivered' && (
                                            <div className="flex justify-end gap-3 pt-4 border-t">
                                                {(!order.status || order.status === 'paid') && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(order.documentId, 'accepted', order.userId)}
                                                        className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white px-8 py-2.5 rounded-lg font-bold text-base transition transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center"
                                                    >
                                                        Accept Order
                                                    </button>
                                                )}
                                                {order.status === 'accepted' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(order.documentId, 'delivered', order.userId)}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-lg font-bold text-base transition shadow-sm flex items-center gap-2"
                                                    >
                                                        🚚 Mark Delivered
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Customer Info (Simplified) */}
                                        <div className="mt-4 bg-gray-50 p-3 rounded text-base text-gray-700">
                                            <p><span className="font-bold">Shipping To:</span> {order.shippingAddress?.fullName}, {order.shippingAddress?.city}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* PRODUCT FORM (Collapsible) */}
                {isFormOpen && activeTab === 'inventory' && (
                    <div className="bg-gradient-to-br from-blue-200 to-pink-200 border border-blue-300 p-8 rounded-xl shadow-xl mb-12 animate-fade-in-down">
                        <div className="flex justify-between items-center mb-6 border-b border-blue-300 pb-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                                <span>{editingId ? '✏️' : '✨'}</span>
                                {editingId ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button onClick={handleCancelEdit} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition transform hover:scale-105 flex items-center gap-2">
                                Close
                            </button>
                        </div>

                        <form onSubmit={handleAddProduct} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Product Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInput}
                                        className="w-full bg-gray-50 text-gray-900 border border-gray-200 p-3 rounded focus:ring-2 focus:ring-black outline-none transition" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Price (₹)</label>
                                    <input type="number" name="price" value={formData.price} onChange={handleInput}
                                        className="w-full bg-gray-50 text-gray-900 border border-gray-200 p-3 rounded focus:ring-2 focus:ring-black outline-none transition" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Stock Quantity</label>
                                    <input type="number" name="stock" value={formData.stock} onChange={handleInput}
                                        className="w-full bg-gray-50 text-gray-900 border border-gray-200 p-3 rounded focus:ring-2 focus:ring-black outline-none transition" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Category</label>
                                    <select name="category" value={formData.category} onChange={handleInput}
                                        className="w-full bg-gray-50 text-gray-900 border border-gray-200 p-3 rounded focus:ring-2 focus:ring-black outline-none transition" required>
                                        <option value="">Select Category</option>
                                        <option value="Women">Women</option>
                                        <option value="Men">Men</option>
                                        <option value="Kids">Kids</option>
                                        <option value="Seniors">Seniors</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Description</label>
                                <textarea name="description" value={formData.description} onChange={handleInput} rows="3"
                                    className="w-full bg-gray-50 text-gray-900 border border-gray-200 p-3 rounded focus:ring-2 focus:ring-black outline-none transition" required></textarea>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Available Sizes</label>
                                <div className="flex flex-wrap gap-4">
                                    {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => (
                                        <label key={size} className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-4 py-2 rounded border border-gray-200 hover:bg-white transition">
                                            <input
                                                type="checkbox"
                                                value={size}
                                                checked={formData.sizes.includes(size)}
                                                onChange={handleSizeChange}
                                                className="w-4 h-4 text-black rounded focus:ring-black"
                                            />
                                            <span className="text-sm font-medium text-gray-900">{size}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Image URL</label>
                                <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleInput}
                                    className="w-full bg-gray-50 text-gray-900 border border-gray-200 p-3 rounded focus:ring-2 focus:ring-black outline-none transition" placeholder="https://..." />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Tags</label>
                                <input type="text" name="tags" value={formData.tags} onChange={handleInput}
                                    className="w-full bg-gray-50 text-gray-900 border border-gray-200 p-3 rounded focus:ring-2 focus:ring-black outline-none transition" placeholder="shirt, cotton, summer" />
                            </div>

                            <button type="submit" className={`w-full text-white font-bold py-3 rounded-lg hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest text-sm ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-black hover:bg-gray-800'}`}>
                                {editingId ? 'Update Product' : 'Publish Product'}
                            </button>
                        </form>
                    </div>
                )}

                {/* PRODUCT LIST */}
                {activeTab === 'inventory' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                            📦 Your Inventory <span className="text-lg font-normal text-gray-500">({products.length} items)</span>
                        </h2>

                        {products.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                                <div className="text-4xl mb-4">🏷️</div>
                                <p className="text-gray-500 font-medium">No products found.</p>
                                <button onClick={() => setIsFormOpen(true)} className="mt-4 text-blue-600 font-bold hover:underline">
                                    Start adding items!
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {products.map(p => (
                                    <div key={p.id} className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                        <div className="aspect-[4/5] bg-gray-100 overflow-hidden relative">
                                            {p.imageUrl ? (
                                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Image</div>
                                            )}
                                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded text-sm font-bold shadow-sm text-gray-900">
                                                {p.category}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-900 line-clamp-1 text-xl">{p.name}</h3>
                                                <span className="font-bold text-green-600 whitespace-nowrap text-lg">₹{p.price}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5em]">{p.description}</p>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(p)}
                                                    className="flex-1 bg-gradient-to-r from-[#00a1ff] to-[#00ff8f] text-white py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-lg hover:scale-105 transition-all duration-300"
                                                >
                                                    Edit
                                                </button>
                                                {/* Future: Add Delete Button Here */}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerDashboard;
