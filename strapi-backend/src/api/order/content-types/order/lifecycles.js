module.exports = {
    async afterUpdate(event) {
        const { result, params } = event;

        // Check if status was updated to 'delivered'
        if (result.status === 'delivered') {
            try {
                // Create a notification for the user
                await strapi.entityService.create('api::notification.notification', {
                    data: {
                        message: `Your order #${result.id} has been delivered!`,
                        userId: result.userId,
                        type: 'order_status',
                        read: false,
                        relatedOrderId: result.id.toString(),
                        publishedAt: new Date(),
                    },
                });

                console.log(`Notification created for Order #${result.id}`);
            } catch (error) {
                console.error('Error creating notification in afterUpdate lifecycle:', error);
            }
        }
    },
};
