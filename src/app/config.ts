/** Environment values (from .env.local through @ngx-env). Read them here, not with import.meta.env elsewhere. */
export const environment = {
    /** Base URL of the Where Is My Car API, without trailing slash. */
    apiUrl: import.meta.env['NG_APP_API_URL'] as string,
    firebase: {
        apiKey: import.meta.env['NG_APP_FIREBASE_API_KEY'] as string,
        authDomain: import.meta.env['NG_APP_FIREBASE_AUTH_DOMAIN'] as string,
        projectId: import.meta.env['NG_APP_FIREBASE_PROJECT_ID'] as string,
    },
};
