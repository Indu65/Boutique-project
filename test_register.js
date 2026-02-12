import axios from 'axios';

const registerUser = async () => {
    try {
        const username = `testuser_${Date.now()}`;
        const email = `${username}@example.com`;

        console.log(`Attempting to register: ${username} as 'buyer'`);

        const response = await axios.post('http://localhost:1337/api/auth/local/register', {
            username: username,
            email: email,
            password: 'Password123!',
            user_type: 'buyer'
        });

        console.log('Registration Successful:', response.data.user.username, response.data.user.user_type);
    } catch (error) {
        console.error('Registration Failed:', error.response ? error.response.data : error.message);
    }
};

registerUser();
