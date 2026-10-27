import { afterNextRender, Component, inject, Injector, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { initMaterialTailwind } from '@material-tailwind/html';

@Component({
    imports: [RouterOutlet],
    selector: 'app-root',
    styleUrl: './app.css',
    templateUrl: './app.html',
})
export class App {
    protected readonly title = signal('where-is-my-car');

    private readonly injector = inject(Injector);

    constructor() {
        // Material Tailwind binds its interactive components to the DOM, so re-run it once each new view is rendered
        inject(Router).events.pipe(
            filter((event) => event instanceof NavigationEnd),
            takeUntilDestroyed(),
        ).subscribe(() => {
            afterNextRender(() => initMaterialTailwind(), { injector: this.injector });
        });
    }
}
