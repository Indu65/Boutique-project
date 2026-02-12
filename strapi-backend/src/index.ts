
export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }) {
    // 0. Programmatically add user_type to User content type
    // This is the safest way in Strapi 5 to extend a plugin's content type
    const userModel = strapi.contentType('plugin::users-permissions.user');
    if (userModel && userModel.attributes) {
      userModel.attributes.user_type = {
        type: 'enumeration',
        enum: ['buyer', 'seller', 'admin'],
        default: 'buyer'
      };
      console.log("[Index.ts] Injected user_type attribute into User model.");
    }

    const plugin = strapi.plugin('users-permissions');

    // 1. Disable validation for register to allow user_type
    const routes = plugin.routes['content-api'].routes;
    const registerRoute = routes.find(r => r.method === 'POST' && r.path === '/auth/local/register');
    if (registerRoute) {
      if (!registerRoute.config) registerRoute.config = {};
      registerRoute.config.validate = false;
      console.log("[Index.ts] Disabled validation for /auth/local/register");
    }

    // 2. Override the register controller
    plugin.controllers.auth.register = async (ctx) => {
      console.log("############################################################");
      console.log("### CUSTOM USERS-PERMISSIONS REGISTER CALLED (V3) ########");
      console.log("############################################################");

      const { email, username, password, user_type } = ctx.request.body;

      if (!email || !username || !password) {
        return ctx.badRequest('Email, username, and password are required');
      }

      const emailLower = email.toLowerCase();

      // Get default role
      const role = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'authenticated' } });

      if (!role) {
        throw new Error('Impossible to find the default role');
      }

      try {
        const user = await strapi.plugin('users-permissions').service('user').add({
          email: emailLower,
          username,
          password,
          user_type: user_type || 'buyer',
          role: role.id,
          confirmed: true,
          provider: 'local',
        });

        const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

        return ctx.send({
          jwt,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            user_type: user.user_type || 'buyer'
          }
        });
      } catch (err) {
        console.error("Error creating user:", err);
        return ctx.badRequest(err.toString());
      }
    };
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }) {
    // 1. Enable Public Permissions
    try {
      const publicRole = await strapi
        .query("plugin::users-permissions.role")
        .findOne({ where: { type: "public" } });

      if (publicRole) {
        const actions = [
          "api::product.product.find",
          "api::product.product.findOne",
          "plugin::users-permissions.auth.callback",
          "plugin::users-permissions.auth.register"
        ];

        for (const action of actions) {
          const permission = await strapi.query("plugin::users-permissions.permission").findOne({
            where: { role: publicRole.id, action: action },
          });
          if (!permission) {
            await strapi.query("plugin::users-permissions.permission").create({
              data: { action, role: publicRole.id },
            });
            strapi.log.info(`Enabled public permission: ${action}`);
          }
        }
      }
    } catch (error) {
      strapi.log.error("Bootstrap error:", error);
    }

    // 2. Enable Authenticated User Permissions for Products and Orders
    try {
      const authRole = await strapi
        .query("plugin::users-permissions.role")
        .findOne({ where: { type: "authenticated" } });

      if (authRole) {
        const authActions = [
          // Product permissions
          "api::product.product.find",
          "api::product.product.findOne",
          "api::product.product.create",
          "api::product.product.update",
          "api::product.product.delete",
          // Order permissions
          "api::order.order.find",
          "api::order.order.findOne",
          "api::order.order.create",
          "api::order.order.update",
          // User permissions (Needed for Admin Dashboard)
          "plugin::users-permissions.user.find",
          "plugin::users-permissions.user.findOne",
          "plugin::users-permissions.role.find",
          "plugin::users-permissions.role.findOne",
          // Notification permissions
          "api::notification.notification.find",
          "api::notification.notification.findOne",
          "api::notification.notification.create",
          "api::notification.notification.update"
        ];

        for (const action of authActions) {
          const permission = await strapi.query("plugin::users-permissions.permission").findOne({
            where: { role: authRole.id, action: action },
          });
          if (!permission) {
            await strapi.query("plugin::users-permissions.permission").create({
              data: { action, role: authRole.id },
            });
            strapi.log.info(`Enabled authenticated permission: ${action}`);
          }
        }
      }
    } catch (error) {
      strapi.log.error("Bootstrap authenticated permissions error:", error);
    }
  },
};
