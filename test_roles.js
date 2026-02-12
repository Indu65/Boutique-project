
import axios from 'axios';

const testLoginAndMe = async () => {
    const API_URL = 'http://localhost:1337/api';
    const TEST_EMAIL = 'seller_test_' + Date.now() + '@example.com';
    const TEST_USER = 'seller_test_' + Date.now();
    const TEST_PASS = 'Password123!';

    try {
        // 1. Register a seller
        console.log("Registering a test seller...");
        const regRes = await axios.post(`${API_URL}/auth/local/register`, {
            username: TEST_USER,
            email: TEST_EMAIL,
            password: TEST_PASS,
            user_type: 'seller'
        });
        console.log("Registration Response User:", JSON.stringify(regRes.data.user, null, 2));

        const token = regRes.data.jwt;

        // 2. Test Login
        console.log("\nTesting Login...");
        const loginRes = await axios.post(`${API_URL}/auth/local`, {
            identifier: TEST_EMAIL,
            password: TEST_PASS
        });
        console.log("Login Response User:", JSON.stringify(loginRes.data.user, null, 2));

        // 3. Test Me
        console.log("\nTesting Me...");
        const meRes = await axios.get(`${API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Me Response:", JSON.stringify(meRes.data, null, 2));

    } catch (error) {
        console.error("Test Failed:", error.response ? error.response.data : error.message);
    }
};

testLoginAndMe();
