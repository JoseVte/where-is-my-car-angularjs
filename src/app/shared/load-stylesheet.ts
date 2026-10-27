const loading = new Map<string, Promise<void>>();

/**
 * Adds a stylesheet built with `"inject": false` in angular.json (so it is not in the initial bundle)
 * and resolves once it is applied. Each file is only added once.
 */
export function loadStylesheet(href: string): Promise<void> {
    let promise = loading.get(href);

    if (!promise) {
        promise = new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => resolve();
            link.onerror = () => {
                loading.delete(href);
                link.remove();
                reject(new Error(`Could not load ${href}`));
            };
            document.head.append(link);
        });
        loading.set(href, promise);
    }

    return promise;
}
