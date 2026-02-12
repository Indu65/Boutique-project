import { fetchOrders, login } from './src/api/strapi.js';

// Mock browser environment for axios/localstorage if needed, or just rely on node execution with some polyfills if strapi.js uses them?
// strapi.js uses `import.meta.env` which might fail in node.
// I'll assume I can run this via a node script if I stub the env.
// Actually, `fetchOrders` uses `localStorage` for token. I need to simulate that or login first.

// We will just write a simple script that uses axios directly to query the strapi backend, 
// bypassing the frontend code to avoid environment issues.

import axios from 'axios';

const API_URL = 'http://localhost:1337/api';

async function debugOrders() {
    try {
        // Login as an admin or just fetch if public (permissions were set to public earlier?)
        // Let's try fetching directly.

        console.log("Fetching orders...");
        const response = await axios.get(`${API_URL}/orders?populate=*&sort=createdAt:desc`);
        const orders = response.data.data;

        console.log(`Found ${orders.length} orders.`);

        orders.forEach(o => {
            const raw = o;
            const attrs = o.attributes || o; // handle structure

            const createdAt = attrs.createdAt;
            const dateField = attrs.date;

            // Replicate Dashboard Logic
            let calculatedDate = dateField;
            let logicUsed = "date field";

            if (!calculatedDate && createdAt) {
                const d = new Date(createdAt);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                calculatedDate = `${day}/${month}/${year}`;
                logicUsed = "createdAt fallback";
            }

            console.log(`Order ID: ${o.id} | CreatedAt: ${createdAt} | DateField: ${dateField} | Calculated: ${calculatedDate} | Logic: ${logicUsed} | Amount: ${attrs.totalAmount}`);
        });

    } catch (error) {
        console.error("Error:", error.message);
    }
}

debugOrders();
