import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
const STRAPI_URL = rawUrl.replace(/\/admin\/?$/, ''); // Remove /admin or /admin/ from the end
console.log("Strapi API URL:", STRAPI_URL); // Debugging log
const API_URL = `${STRAPI_URL}/api`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('jwt');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper to unwrap Strapi response
const normalizeStrapiData = (data) => {
    if (!data) return null;
    if (Array.isArray(data)) {
        return data.map(item => normalizeStrapiData(item));
    }
    if (data.id && data.attributes) {
        return { id: data.id, documentId: data.documentId, ...data.attributes };
    }
    if (data.id && !data.attributes && !data.data) {
        // Handle cases where data is just the object (Strapi 5 sometimes)
        return { ...data };
    }
    if (data.data) {
        return normalizeStrapiData(data.data);
    }
    return data;
};

// --- AUTHENTICATION ---

export const login = async (identifier, password) => {
    try {
        const response = await axios.post(`${API_URL}/auth/local`, {
            identifier,
            password
        });
        return response.data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

export const register = async (username, email, password, user_type) => {
    try {
        const response = await axios.post(`${API_URL}/auth/local/register`, {
            username,
            email,
            password,
            user_type
        });
        return response.data;
    } catch (error) {
        console.error("Registration error:", error);
        throw error;
    }
};

export const fetchMe = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/users/me?populate=*`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Fetch Me error:", error);
        throw error;
    }
};

export const fetchUsers = async () => {
    try {
        const response = await axios.get(`${API_URL}/users?populate=role`, {
            headers: getAuthHeaders()
        });
        return normalizeStrapiData(response.data);
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
};

// --- PRODUCTS ---

export const fetchProducts = async (filters = {}) => {
    try {
        const params = {
            'populate': '*'
        };

        Object.keys(filters).forEach(key => {
            params[`filters[${key}][$eq]`] = filters[key];
        });

        const response = await axios.get(`${API_URL}/products`, { params, headers: getAuthHeaders() });
        return normalizeStrapiData(response.data);
    } catch (error) {
        console.error("Error fetching products from Strapi:", error);
        throw error;
    }
};

export const fetchProductById = async (documentId) => {
    try {
        const response = await axios.get(`${API_URL}/products/${documentId}?populate=*`);
        return normalizeStrapiData(response.data);
    } catch (error) {
        console.error(`Error fetching product ${documentId} from Strapi:`, error);
        throw error;
    }
};

export const createProduct = async (productData) => {
    try {
        // Strapi expects wrapped data: { data: { ... } }
        const response = await axios.post(`${API_URL}/products`, { data: productData }, {
            headers: getAuthHeaders()
        });
        return normalizeStrapiData(response.data);
    } catch (error) {
        console.error("Error creating product in Strapi:", error);
        if (error.response?.data?.error) {
            throw new Error(`${error.response.data.error.message} ${JSON.stringify(error.response.data.error.details || '')}`);
        }
        throw error;
    }
};

export const updateProduct = async (documentId, productData) => {
    try {
        const response = await axios.put(`${API_URL}/products/${documentId}`, { data: productData }, {
            headers: getAuthHeaders()
        });
        return normalizeStrapiData(response.data);
    } catch (error) {
        console.error(`Error updating product ${documentId} in Strapi:`, error);
        if (error.response?.data?.error) {
            throw new Error(`${error.response.data.error.message} ${JSON.stringify(error.response.data.error.details || '')}`);
        }
        throw error;
    }
};

// --- ORDERS ---

export const fetchOrders = async (filters = {}) => {
    try {
        // Construct Strapi filters
        // Example filters: { sellerId: '123', userId: 'abc' }
        const params = {
            'populate': '*',
            'sort': ['createdAt:desc'] // Default sort
        };

        Object.keys(filters).forEach(key => {
            params[`filters[${key}][$eq]`] = filters[key];
        });

        const response = await axios.get(`${API_URL}/orders`, { params, headers: getAuthHeaders() });
        return normalizeStrapiData(response.data);
    } catch (error) {
        console.error("Error fetching orders from Strapi:", error);
        throw error;
    }
};

export const createOrder = async (orderData) => {
    try {
        const response = await axios.post(`${API_URL}/orders`, { data: orderData }, {
            headers: getAuthHeaders()
        });
        return normalizeStrapiData(response.data);
    } catch (error) {
        console.error("Error creating order in Strapi:", error);
        throw error;
    }
};

// --- Notifications API ---

export const createNotification = async (notificationData) => {
    try {
        const payload = { ...notificationData, publishedAt: new Date().toISOString() };
        const response = await axios.post(`${API_URL}/notifications`, { data: payload }, {
            headers: getAuthHeaders()
        });
        return normalizeStrapiData(response.data);
    } catch (error) {
        console.error("Error creating notification:", error);
        // Don't throw, just log. Notifications shouldn't break the main flow.
    }
};

export const fetchNotifications = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/notifications`, {
            params: {
                'filters[userId][$eq]': userId,
                'sort': ['createdAt:desc'],
                'pagination[limit]': 20
            },
            headers: getAuthHeaders()
        });
        return normalizeStrapiData(response.data);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
};

export const markNotificationRead = async (documentId) => {
    try {
        const response = await axios.put(`${API_URL}/notifications/${documentId}`, {
            data: { read: true }
        }, {
            headers: getAuthHeaders()
        });
        return normalizeStrapiData(response.data);
    } catch (error) {
        console.error("Error marking notification read:", error);
    }
};

export const updateOrderStatus = async (documentId, status) => {
    try {
        const response = await axios.put(`${API_URL}/orders/${documentId}`, {
            data: { status }
        }, {
            headers: getAuthHeaders()
        });
        return normalizeStrapiData(response.data);
    } catch (error) {
        console.error(`Error updating order ${documentId} in Strapi:`, error);
        throw error;
    }
};
