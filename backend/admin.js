const bcrypt = require("bcrypt");

const User = require("./models/user");
const Recipe = require("./models/recipe");

async function buildAdminRouter() {
    // AdminJS est ESM -> import dynamique
    const AdminJSImport = await import("adminjs");
    const AdminJS = AdminJSImport.default || AdminJSImport;

    const AdminJSExpressImport = await import("@adminjs/express");
    const AdminJSExpress = AdminJSExpressImport.default || AdminJSExpressImport;

    const AdminJSMongooseImport = await import("@adminjs/mongoose");
    const AdminJSMongoose = AdminJSMongooseImport.default || AdminJSMongooseImport;

    const Database = AdminJSMongoose.Database || (AdminJSMongoose.default && AdminJSMongoose.default.Database);
    const Resource = AdminJSMongoose.Resource || (AdminJSMongoose.default && AdminJSMongoose.default.Resource);

    AdminJS.registerAdapter({
        Database,
        Resource,
    });

    const admin = new AdminJS({
        rootPath: "/admin",
        resources: [{ resource: User }, { resource: Recipe }],
        branding: {
            companyName: "Cooking Recipes – Admin",
        },
        locale: {
            translations: {
                messages: {
                    loginWelcome: "Backoffice administrateur",
                },
                labels: {
                    loginWelcome: "Connexion administrateur",
                },
                properties: {},
                actions: {},
                buttons: {},
                resources: {},
            },
            language: "fr",
        },
    });

    const buildAuthenticatedRouter =
        AdminJSExpress.buildAuthenticatedRouter ||
        (AdminJSExpress.default && AdminJSExpress.default.buildAuthenticatedRouter);

    const router = buildAuthenticatedRouter(
        admin,
        {
            authenticate: async (identifier, password) => {
                const input = String(identifier || "").trim();
                if (!input) return null;

                // recherche insensible à la casse sur username
                const user = await User.findOne({
                    username: { $regex: new RegExp(`^${input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
                }).select("+password role username");

                if (!user) return null;

                const ok = await bcrypt.compare(password, user.password);
                if (!ok) return null;

                // accès réservé aux admins
                if (user.role !== 0) return null;

                return {
                    id: user._id.toString(),
                    username: user.username,
                    role: user.role,
                };
            },

            cookiePassword: process.env.ADMIN_COOKIE_PASSWORD || "change-me",
            loginPath: "/admin/login",
        },
        null,
        {
            resave: false,
            saveUninitialized: false,
            secret: process.env.ADMIN_SESSION_SECRET || "change-me",
            cookie: { httpOnly: true },
        }
    );

    return { admin, router };
}

module.exports = { buildAdminRouter };
