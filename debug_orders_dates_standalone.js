
// Standalone script to debug order dates
// Run with: node debug_orders_dates_standalone.js

const axios = require('axios'); // Assuming axios is installed, if not we'll use fetch - wait, allow 'import' syntax in mjs or use require if commonjs. 
// The user environment seems to be using ES modules for src but let's stick to CommonJS for this script if possible, or use .mjs.
// The previous error was due to import.meta.env.
// Let's use standard node fetch (avail in node 18+) or axios if installed. 
// "type": "module" might be set in package.json.

const API_URL = 'http://localhost:1337/api';

async function debugOrders() {
    try {
        console.log("Fetching orders from " + API_URL);

        let fetchFn;
        if (typeof fetch === 'function') {
            fetchFn = fetch;
        } else {
            const ax = require('axios');
            fetchFn = (url) => ax.get(url).then(r => ({ json: () => r.data, ok: true }));
        }

        const response = await fetch(`${API_URL}/orders?populate=*&sort=createdAt:desc`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        const orders = json.data;

        if (!orders) {
            console.log("No orders found or error in response structure:", json);
            return;
        }

        console.log(`Found ${orders.length} orders.`);
        console.log('--- ORDER DATA ---');

        orders.forEach(o => {
            const id = o.id;
            const documentId = o.documentId;
            const attrs = o; // Strapi 5 rest api usually flattens? No, wait. 
            // In Strapi v4 response.data is array of { id, attributes: {...} }
            // In Strapi v5 it might be flattened. Based on previous `strapi.js` `normalizeStrapiData`, it handles both.
            // Let's assume standard response and inspect.

            // Just print the whole date related fields
            const createdAt = o.createdAt || (o.attributes && o.attributes.createdAt);
            const dateField = o.date || (o.attributes && o.attributes.date);
            const amount = o.totalAmount || (o.attributes && o.attributes.totalAmount);

            // Calculate local date string as Dashboard does
            // Note: Node.js timezone might be different from Browser (User's) timezone.
            // But we can check the rough offset.

            let calculatedDate = "N/A";
            if (createdAt) {
                const d = new Date(createdAt);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                calculatedDate = `${day}/${month}/${year}`;
            }

            console.log(`ID: ${id} | CreatedAt: ${createdAt} | DateField: ${dateField} | Calc(Node): ${calculatedDate} | Amount: ${amount}`);
        });

    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) console.error(error.response.data);
    }
}

debugOrders();
