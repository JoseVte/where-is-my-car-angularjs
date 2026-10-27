import { DestroyRef, inject, Service, signal } from '@angular/core';

/** Below Tailwind's lg breakpoint (64rem) the app uses the Android interface. */
const MOBILE_QUERY = '(max-width: 63.999rem)';

@Service()
export class Breakpoint {
    private readonly query = matchMedia(MOBILE_QUERY);

    readonly isMobile = signal(this.query.matches);

    constructor() {
        const update = (event: MediaQueryListEvent) => this.isMobile.set(event.matches);
        this.query.addEventListener('change', update);
        inject(DestroyRef).onDestroy(() => this.query.removeEventListener('change', update));
    }
}
