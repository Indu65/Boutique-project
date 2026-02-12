
export default (config, { strapi }) => {
    return async (ctx, next) => {
        // Just log for debugging if needed, but don't mutate body anymore
        // as Index.ts handles validation bypass and parameter extraction.
        await next();
    };
};
