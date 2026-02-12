import React, { useState } from 'react';

const PaymentModal = ({ onClose, onPay, totalAmount }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        address: '',
        city: '',
        zip: '',
        cardNumber: '',
        expiry: '',
        cvv: ''
    });
    const [processing, setProcessing] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);

        // Mock Processing Delay
        setTimeout(async () => {
            await onPay(formData); // Pass details back to parent
            setProcessing(false);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Secure Checkout</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Shipping Address */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Shipping Address</h4>
                        <div className="space-y-3">
                            <input
                                type="text" name="fullName" placeholder="Full Name" required
                                value={formData.fullName} onChange={handleChange}
                                className="w-full bg-gray-50 border p-3 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                            />
                            <input
                                type="text" name="address" placeholder="Address Line 1" required
                                value={formData.address} onChange={handleChange}
                                className="w-full bg-gray-50 border p-3 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                            />
                            <div className="flex gap-3">
                                <input
                                    type="text" name="city" placeholder="City" required
                                    value={formData.city} onChange={handleChange}
                                    className="w-full bg-gray-50 border p-3 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                                />
                                <input
                                    type="text" name="zip" placeholder="ZIP Code" required
                                    value={formData.zip} onChange={handleChange}
                                    className="w-full bg-gray-50 border p-3 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 mt-4">Payment Details</h4>
                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text" name="cardNumber" placeholder="Card Number (Mock)" required maxLength="19"
                                    value={formData.cardNumber} onChange={handleChange}
                                    className="w-full bg-gray-50 border p-3 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none pl-10"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                            </div>
                            <div className="flex gap-3">
                                <input
                                    type="text" name="expiry" placeholder="MM/YY" required maxLength="5"
                                    value={formData.expiry} onChange={handleChange}
                                    className="w-full bg-gray-50 border p-3 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                                />
                                <input
                                    type="password" name="cvv" placeholder="CVV" required maxLength="3"
                                    value={formData.cvv} onChange={handleChange}
                                    className="w-full bg-gray-50 border p-3 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Total & Pay Button */}
                    <div className="mt-6 pt-4 border-t">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-600">Total Amount</span>
                            <span className="text-2xl font-bold text-gray-900">₹{totalAmount}</span>
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                `Pay ₹${totalAmount}`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
