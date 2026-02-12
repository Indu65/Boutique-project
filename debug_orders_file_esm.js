
import fs from 'fs';

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
            console.log("No orders found or error in response structure.");
            return;
        }

        let output = `Found ${orders.length} orders.\n`;
        output += `Current Local Time check: ${new Date().toString()}\n`;
        output += `Current ISO Time check: ${new Date().toISOString()}\n`;

        orders.forEach(o => {
            const id = o.id;
            const attrs = o.attributes || o;
            const createdAt = attrs.createdAt;
            const dateField = attrs.date;

            let dateObj = null;
            let localDateStr = "N/A";

            if (createdAt) {
                dateObj = new Date(createdAt);
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                localDateStr = `${day}/${month}/${year}`;
            }

            output += `ID: ${id} | CreatedAt(Raw): ${createdAt} | LocalStr: ${localDateStr} | FullDate: ${dateObj ? dateObj.toString() : 'N/A'}\n`;
        });

        fs.writeFileSync('debug_output.txt', output);
        console.log("Wrote to debug_output.txt");

    } catch (error) {
        console.error("Error:", error.message);
    }
}

debugOrders();
