import { DestroyRef, inject, Service, signal } from '@angular/core';

const DURATION = 3000;

/** Short message at the bottom of the screen, like an Android Toast. The layout renders it. */
@Service()
export class Notice {
    /** Translation key of the message on screen. */
    readonly message = signal<string | null>(null);

    private timeout: ReturnType<typeof setTimeout> | undefined;

    constructor() {
        inject(DestroyRef).onDestroy(() => clearTimeout(this.timeout));
    }

    show(key: string): void {
        clearTimeout(this.timeout);
        this.message.set(key);
        this.timeout = setTimeout(() => this.message.set(null), DURATION);
    }
}
