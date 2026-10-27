import { Component, computed, input, output } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    imports: [NgClass, NgTemplateOutlet, RouterLink, RouterLinkActive],
    selector: 'app-button',
    styleUrl: './button.css',
    templateUrl: './button.html',
})
export class Button {
    btnType = input<'submit' | 'button' | 'route'>('button');

    type = input('', { transform: setClass });

    disabled = input(false);

    disabledClass = computed(() => {
        return this.disabled() ? 'cursor-not-allowed opacity-50' : ''
    })

    customClass = input('');

    link = input('');

    activeLink = input(['']);

    onClickAction = output();
}

function setClass(type: string) {
    if (type === 'primary') {
        return 'btn-primary';
    } else if (type === 'secondary') {
        return 'btn-secondary';
    } else {
        return '';
    }
}
