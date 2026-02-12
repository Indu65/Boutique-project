import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal';

const CartPage = () => {
    const { cart, removeFromCart, getCartTotal, checkout, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showPayment, setShowPayment] = useState(false);

    const handleCheckoutClick = () => {
        if (!user) {
            alert("Please login to checkout.");
            navigate('/login');
            return;
        }
        if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }
        setShowPayment(true);
    };

    const handlePayment = async (shippingData) => {
        try {
            await checkout(user.id, shippingData);
            setShowPayment(false);
            alert("Order Placed Successfully!");
            navigate('/shop');
        } catch (error) {
            console.error("Checkout failed:", error);
            alert("Checkout Failed: " + error.message);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
                    <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
                    <button
                        onClick={() => navigate('/shop')}
                        className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition transform hover:scale-105"
                    >
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
            {showPayment && (
                <PaymentModal
                    onClose={() => setShowPayment(false)}
                    onPay={handlePayment}
                    totalAmount={getCartTotal()}
                />
            )}

            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-10">Shopping Cart ({cart.length} items)</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items List */}
                    <div className="lg:col-span-2 space-y-4">
                        {cart.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="bg-white p-4 rounded-xl shadow-sm flex gap-4 items-center">
                                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                    <img
                                        src={item.imageUrl || 'https://via.placeholder.com/100'}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                                    <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                                    <p className="text-sm text-gray-500">Size: <span className="font-bold text-black">{item.selectedSize || 'N/A'}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-purple-600">₹{item.price}</p>
                                    <button
                                        onClick={() => removeFromCart(index)}
                                        className="text-red-500 text-xs font-bold uppercase mt-2 hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-lg sticky top-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>₹{getCartTotal()}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span className="text-green-600 font-bold">Free</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-4 border-t">
                                    <span>Total</span>
                                    <span>₹{getCartTotal()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckoutClick}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
                            >
                                CHECKOUT NOW
                            </button>

                            <button
                                onClick={() => navigate('/shop')}
                                className="w-full mt-4 text-gray-500 text-sm font-bold hover:text-black"
                            >
                                ← Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
