import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconName, ICONS } from './icons';

/** Material Design Icon (see icons.ts). Takes the text color and the font size (1em). */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'inline-flex shrink-0', 'aria-hidden': 'true' },
    selector: 'app-icon',
    templateUrl: './icon.html',
})
export class Icon {
    name = input.required<IconName>();

    protected path = computed(() => ICONS[this.name()]);
}
