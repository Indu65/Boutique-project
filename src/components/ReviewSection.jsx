import React from 'react';

const ReviewSection = ({ productId }) => {
    return (
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h3>
            <p className="text-gray-500">Reviews are currently being upgraded to our new system.</p>
            <p className="text-indigo-600 font-bold mt-2">Check back soon!</p>
        </div>
    );
};

export default ReviewSection;
