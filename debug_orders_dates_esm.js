
// Standalone script to debug order dates (ES Module)
// Run with: node debug_orders_dates_esm.js

const API_URL = 'http://localhost:1337/api';

async function debugOrders() {
    try {
        console.log("Fetching orders from " + API_URL);

        // Native fetch is available in Node 18+
        const response = await fetch(`${API_URL}/orders?populate=*&sort=createdAt:desc`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        // Check if data is wrapped in 'data' property (Strapi standard)
        let orders = json.data;

        if (!orders) {
            console.log("No orders found or error in response structure:", json);
            return;
        }

        console.log(`Found ${orders.length} orders.`);
        console.log('--- ORDER DATA ---');

        orders.forEach(o => {
            // In Strapi v4/v5, response data items might be flattened or nested in .attributes
            const id = o.id;
            const documentId = o.documentId;
            const attrs = o.attributes || o;

            const createdAt = attrs.createdAt;
            const dateField = attrs.date;
            const amount = attrs.totalAmount;

            // Calculate local date string as Dashboard does
            let calculatedDate = "N/A";
            if (createdAt) {
                const d = new Date(createdAt);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                calculatedDate = `${day}/${month}/${year}`;

                // Also print full ISO string to check time
                console.log(`ID: ${id} | CreatedAt: ${createdAt} | DateField: ${dateField} | Calculated: ${calculatedDate} | Amount: ${amount}`);
            } else {
                console.log(`ID: ${id} | NO CREATED AT FOUND`);
            }
        });

    } catch (error) {
        console.error("Error:", error.message);
    }
}

debugOrders();
