import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchProducts, fetchOrders, fetchUsers } from '../api/strapi';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    ArcElement,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    ArcElement,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProducts: 0,
        globalRevenue: 0,
    });
    const [sellers, setSellers] = useState([]);
    const [topProducts, setTopProducts] = useState({ labels: [], data: [] });
    const [topDressTypes, setTopDressTypes] = useState({ labels: [], data: [] });
    const [salesTrend, setSalesTrend] = useState({ labels: [], data: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Users
                const usersData = await fetchUsers();
                console.log("AdminDashboard: Fetched Users:", usersData);

                // Filter users: include all fetched users (Strapi returns authenticated users by default)
                // If role/user_type is missing, fall back to counting them anyway.
                // If role/user_type is missing, fall back to counting them anyway.
                const safeUsersList = Array.isArray(usersData) ? usersData : [];
                const totalUsers = safeUsersList.length;

                // Filter Sellers - use user_type or role
                const sellersList = safeUsersList.filter(u => u.user_type === 'seller' || (u.role && u.role.name === 'Seller'));

                // 2. Fetch Products (Map ID to Category)
                const productsData = await fetchProducts();
                const totalProducts = productsData.length;
                const productCategories = {}; // { productId: categoryName }
                productsData.forEach(p => {
                    const cat = p.category || 'Other';
                    if (p.id) productCategories[p.id] = cat;
                    if (p.documentId) productCategories[p.documentId] = cat;
                });

                // 3. Fetch Orders (Revenue & Category & Trend Aggregation)
                const ordersData = await fetchOrders({});

                let globalRevenue = 0;
                // Initialize with 0 to ensure these always appear
                const categorySales = {
                    'Men': 0,
                    'Women': 0,
                    'Kids': 0,
                    'Seniors': 0
                };
                const detailedSales = {}; // { smartCategory: count } -> For Pie Chart
                const dailyRevenue = {}; // { 'YYYY-MM-DD': totalAmount }

                // Helper: Get Dates for Last 7 Days
                // Helper: Get Dates for Last 7 Days (UTC)
                const getLast7Days = () => {
                    const dates = [];
                    for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        // Format: DD/MM/YYYY (UTC)
                        const day = String(d.getUTCDate()).padStart(2, '0');
                        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
                        const year = d.getUTCFullYear();
                        dates.push(`${day}/${month}/${year}`);
                    }
                    return dates;
                };
                const last7Days = getLast7Days();

                ordersData.forEach(order => {
                    globalRevenue += (order.totalAmount || 0);

                    // Aggregate sales by Category and Dress Type
                    if (order.items && Array.isArray(order.items)) {
                        order.items.forEach(item => {
                            const qty = item.quantity || 1;

                            // 1. Main Category (Women, Men, Kids, Seniors) for Bar Chart
                            // Try to look up by productId (which might be id or documentId)
                            const mainCategory = productCategories[item.productId] || 'Other';

                            // Only count if it's one of our target categories or Other
                            // If it's a new category not in our init list, it will be added here
                            categorySales[mainCategory] = (categorySales[mainCategory] || 0) + qty;

                            // 2. Smart Detailed Category (Lehenga, Kurta, etc.) for Pie Chart
                            const name = (item.name || '').toLowerCase();
                            let smartCategory = 'Other';

                            if (name.includes('lahanga') || name.includes('lehenga')) smartCategory = 'Lehenga';
                            else if (name.includes('saree') || name.includes('sari')) smartCategory = 'Saree';
                            else if (name.includes('kurta') || name.includes('kurti')) smartCategory = 'Kurta/Kurti';
                            else if (name.includes('shirt') || name.includes('tee')) smartCategory = 'T-Shirt/Shirt';
                            else if (name.includes('frock') || name.includes('frok')) smartCategory = 'Frock';
                            else if (name.includes('jeans') || name.includes('denim')) smartCategory = 'Jeans';
                            else if (name.includes('pajama') || name.includes('pyjama')) smartCategory = 'Pajama';
                            else if (productCategories[item.productId]) {
                                smartCategory = productCategories[item.productId];
                            }

                            detailedSales[smartCategory] = (detailedSales[smartCategory] || 0) + qty;
                        });
                    }

                    // Aggregate daily revenue (Trend)
                    let orderDate = order.date;
                    if (!orderDate && order.createdAt) {
                        // Fallback: Convert ISO string to DD/MM/YYYY (UTC)
                        const d = new Date(order.createdAt);
                        const day = String(d.getUTCDate()).padStart(2, '0');
                        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
                        const year = d.getUTCFullYear();
                        orderDate = `${day}/${month}/${year}`;
                    }

                    if (orderDate) {
                        dailyRevenue[orderDate] = (dailyRevenue[orderDate] || 0) + (order.totalAmount || 0);
                    }
                });

                // Process Main Categories (Bar Chart)
                // We want to keep the main ones even if 0, but maybe sort others?
                // Or just display specific ones? User said "like men woman ,kids,senior".
                // Let's filter to ensure these 4 are top priority or just show everything including them.
                const sortedCategories = Object.entries(categorySales)
                    // Optional: Sort by count descending, but maybe we want fixed order?
                    // User request implies existence is key. Let's do descending count but ensure they exist.
                    .sort(([, a], [, b]) => b - a);

                // Process Detailed Types (Pie Chart)
                const sortedTypes = Object.entries(detailedSales)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10);

                setSellers(sellersList);
                setStats({ totalUsers, totalProducts, globalRevenue });
                setTopProducts({
                    labels: sortedCategories.map(([cat]) => cat),
                    data: sortedCategories.map(([, count]) => count)
                });
                setTopDressTypes({
                    labels: sortedTypes.map(([type]) => type),
                    data: sortedTypes.map(([, count]) => count)
                });
                setSalesTrend({
                    labels: last7Days,
                    data: last7Days.map(date => dailyRevenue[date] || 0)
                });

            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleLogout = async () => {
        try {
            logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

    return (

        <div className="min-h-screen p-8 bg-cover bg-center bg-fixed admin-circuit-bg">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">Admin Dashboard</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                        >
                            <span>↻</span> Refresh Data
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                        >
                            <span>🚪</span> Logout
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-white/10 hover:border-blue-400 transform hover:scale-105 transition-all duration-300 group">
                        <h3 className="text-blue-300 text-sm uppercase font-bold tracking-wider group-hover:text-blue-200 transition-colors">Total Users</h3>
                        <p className="text-4xl font-extrabold text-white mt-2 drop-shadow-md">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-white/10 hover:border-green-400 transform hover:scale-105 transition-all duration-300 group">
                        <h3 className="text-green-300 text-sm uppercase font-bold tracking-wider group-hover:text-green-200 transition-colors">Total Revenue</h3>
                        <p className="text-4xl font-extrabold text-white mt-2 drop-shadow-md">₹{stats.globalRevenue.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-white/10 hover:border-purple-400 transform hover:scale-105 transition-all duration-300 group">
                        <h3 className="text-purple-300 text-sm uppercase font-bold tracking-wider group-hover:text-purple-200 transition-colors">Active Products</h3>
                        <p className="text-4xl font-extrabold text-white mt-2 drop-shadow-md">{stats.totalProducts}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Performing Categories Chart */}
                    <div className="bg-black/40 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/10">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Sales by Category</h2>
                        <div className="h-72">
                            <Bar
                                data={{
                                    labels: topProducts.labels,
                                    datasets: [{
                                        label: 'Items Sold',
                                        data: topProducts.data,
                                        backgroundColor: [
                                            'rgba(236, 72, 153, 0.8)', // Pink
                                            'rgba(168, 85, 247, 0.8)', // Purple
                                            'rgba(59, 130, 246, 0.8)', // Blue
                                            'rgba(16, 185, 129, 0.8)', // Emerald
                                            'rgba(245, 158, 11, 0.8)', // Amber
                                            'rgba(239, 68, 68, 0.8)',  // Red
                                            'rgba(14, 165, 233, 0.8)', // Sky
                                            'rgba(139, 92, 246, 0.8)', // Violet
                                            'rgba(20, 184, 166, 0.8)', // Teal
                                            'rgba(234, 179, 8, 0.8)'   // Yellow
                                        ],
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                        borderWidth: 1,
                                        borderRadius: 8,
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: 'rgba(255, 255, 255, 0.7)' } },
                                        x: { grid: { display: false }, ticks: { color: 'rgba(255, 255, 255, 0.7)' } }
                                    },
                                    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', titleColor: '#fff', bodyColor: '#fff' } }
                                }}
                            />
                        </div>
                    </div>

                    {/* Sales Trend Line Chart */}
                    <div className="bg-black/40 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/10">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Daily Revenue Trend (7 Days)</h2>
                        <div className="h-72">
                            <Line
                                data={{
                                    labels: salesTrend.labels,
                                    datasets: [{
                                        label: 'Revenue (₹)',
                                        data: salesTrend.data,
                                        borderColor: '#22d3ee', // Cyan
                                        backgroundColor: 'rgba(34, 211, 238, 0.2)', // Cyan Glow
                                        pointBackgroundColor: '#ffffff',
                                        pointBorderColor: '#22d3ee',
                                        pointHoverBackgroundColor: '#22d3ee',
                                        pointHoverBorderColor: '#ffffff',
                                        tension: 0.4, // Smooth curve
                                        fill: true,
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                                        },
                                        x: {
                                            grid: { display: false },
                                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                                        }
                                    },
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            titleColor: '#fff',
                                            bodyColor: '#fff',
                                            callbacks: {
                                                label: (context) => `₹${context.raw}`
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Sales Distribution Pie Chart */}
                    <div className="bg-black/40 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/10">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Dress Category Distribution</h2>
                        <div className="h-72 flex justify-center">
                            <Pie
                                data={{
                                    labels: topDressTypes.labels,
                                    datasets: [{
                                        data: topDressTypes.data,
                                        backgroundColor: [
                                            'rgba(236, 72, 153, 0.8)', // Pink
                                            'rgba(168, 85, 247, 0.8)', // Purple
                                            'rgba(59, 130, 246, 0.8)', // Blue
                                            'rgba(16, 185, 129, 0.8)', // Emerald
                                            'rgba(245, 158, 11, 0.8)', // Amber
                                            'rgba(239, 68, 68, 0.8)',  // Red
                                            'rgba(14, 165, 233, 0.8)', // Sky
                                            'rgba(139, 92, 246, 0.8)', // Violet
                                            'rgba(20, 184, 166, 0.8)', // Teal
                                            'rgba(234, 179, 8, 0.8)'   // Yellow
                                        ],
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                        borderWidth: 2,
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'right',
                                            labels: { color: 'white', font: { size: 12 } }
                                        },
                                        tooltip: {
                                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                            titleColor: '#fff',
                                            bodyColor: '#fff',
                                            callbacks: {
                                                label: (context) => {
                                                    const label = context.label || '';
                                                    const value = context.raw || 0;
                                                    const total = context.chart._metasets[context.datasetIndex].total;
                                                    const percentage = Math.round((value / total) * 100) + '%';
                                                    return `${label}: ${value} (${percentage})`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* User Management Table */}
                    <div className="bg-black/40 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Registered Sellers</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {sellers.length > 0 ? (
                                        sellers.map((seller) => (
                                            <tr key={seller.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200">{seller.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 capitalize">
                                                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs font-bold border border-blue-500/30">
                                                        {seller.role ? (seller.role.name || seller.role.type || 'Unknown') : 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button className="text-red-400 hover:text-red-300 text-xs font-bold uppercase hover:underline">
                                                        Manage
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-500 italic">No active sellers found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
