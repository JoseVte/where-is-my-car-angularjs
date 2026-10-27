import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { Auth } from '../../service/auth';
import { Icon } from '../../shared/components/icon/icon';
import { IconName } from '../../shared/components/icon/icons';
import { Notice } from '../../shared/notice';

interface NavItem {
    /** Translation key. */
    label: string;
    icon: IconName;
    link: string;
}

/** Layout of the signed in pages: top bar with the sections from lg, Android bottom navigation below it. */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon, RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
    selector: 'app-app-layout',
    styleUrl: './app-layout.css',
    templateUrl: './app-layout.html',
})
export class AppLayout {
    private readonly auth = inject(Auth);
    private readonly router = inject(Router);

    /** Settings opens from the avatar and categories from Settings, as in the Android app. */
    protected readonly navItems: NavItem[] = [
        { label: 'map', icon: 'map', link: '/map' },
        { label: 'history', icon: 'history', link: '/history' },
    ];

    protected readonly user = this.auth.user;
    protected readonly notice = inject(Notice).message;
    /** Android keeps the Settings tab selected on Settings and the screens it opens (categories). */
    protected readonly onSettingsSection = toSignal(
        this.router.events.pipe(
            filter((event) => event instanceof NavigationEnd),
            map((event) => isSettingsSection(event.urlAfterRedirects)),
        ),
        { initialValue: isSettingsSection(this.router.url) },
    );
    protected readonly initial = computed(() => (this.user()?.displayName || this.user()?.email || '?').charAt(0).toUpperCase());
}

function isSettingsSection(url: string): boolean {
    return url.startsWith('/settings') || url.startsWith('/categories');
}
