const axios = require('axios');

async function enablePermissions() {
    try {
        // First, login as admin to get a token
        // You'll need to use valid admin credentials
        console.log("Note: You need to manually go to http://localhost:1337/admin");
        console.log("Settings → Users & Permissions Plugin → Roles → Authenticated");
        console.log("Then enable these permissions for Product:");
        console.log("  - create");
        console.log("  - update");
        console.log("  - delete");
        console.log("  - find");
        console.log("  - findOne");
        console.log("\nAnd enable these permissions for Order:");
        console.log("  - create");
        console.log("  - update");
        console.log("  - find");
        console.log("  - findOne");
        console.log("\nThen click Save.");
    } catch (error) {
        console.error("Error:", error.message);
    }
}

enablePermissions();
