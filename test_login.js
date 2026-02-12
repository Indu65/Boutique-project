import axios from 'axios';

const loginUser = async () => {
    try {
        console.log(`Attempting to login...`);

        const response = await axios.post('http://localhost:1337/api/auth/local', {
            identifier: 'buyer@boutique.com',
            password: 'buyer123'
        });

        console.log('Login Successful:', response.data.user.username);
    } catch (error) {
        console.error('Login Failed:', error.response ? error.response.data : error.message);
    }
};

loginUser();
