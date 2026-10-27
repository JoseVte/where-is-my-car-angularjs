import { Router } from '@angular/router';

/** Android back button: previous page inside the app, or `fallback` when the page was opened directly. */
export function goBack(router: Router, fallback: string): void {
    if (router.lastSuccessfulNavigation()?.previousNavigation) {
        history.back();
    } else {
        router.navigateByUrl(fallback);
    }
}
