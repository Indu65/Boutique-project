import React, { createContext, useContext, useState, useEffect } from 'react';
import { createOrder } from '../api/strapi';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const localData = localStorage.getItem('boutique_cart');
            const parsed = localData ? JSON.parse(localData) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("Cart data corrupted, resetting:", e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('boutique_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        setCart(prev => [...prev, product]);
    };

    const removeFromCart = (index) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const clearCart = () => {
        setCart([]);
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.price || 0), 0);
    };

    const checkout = async (userId, shippingData = {}) => {
        if (!userId) throw new Error("User must be logged in");
        if (cart.length === 0) return;

        const cartBySeller = {};
        cart.forEach(item => {
            const sId = item.sellerId || 'unknown';
            if (!cartBySeller[sId]) cartBySeller[sId] = [];
            cartBySeller[sId].push(item);
        });

        await Promise.all(Object.keys(cartBySeller).map(async (sellerId) => {
            const items = cartBySeller[sellerId];
            const totalAmount = items.reduce((sum, item) => sum + (item.price || 0), 0);

            await createOrder({
                userId: String(userId),
                sellerId: String(sellerId),
                items: items.map(i => ({
                    productId: i.documentId || i.id, // Prefer documentId
                    name: i.name,
                    price: i.price,
                    imageUrl: i.imageUrl || i.image || 'https://via.placeholder.com/150',
                    quantity: i.quantity || 1,
                    selectedSize: i.selectedSize || 'N/A'
                })),
                totalAmount: totalAmount,
                status: 'paid', // Mark as paid for mock system
                paymentMethod: 'Credit Card (Mock)',
                shippingAddress: shippingData,
                // date: new Date().toLocaleDateString('en-GB'), // REMOVED: Not in schema
                publishedAt: new Date().toISOString(), // Ensure published
            });
        }));

        // Notifications removed for Strapi migration (requires new backend logic)
        console.log("Order placed successfully. Notifications to be implemented via Strapi.");

        clearCart();
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, getCartTotal, checkout }}>
            {children}
        </CartContext.Provider>
    );
};
