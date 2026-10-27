import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageSelect } from '../../shared/components/language-select/language-select';
import { ThemeSelect } from '../../shared/components/theme-select/theme-select';

@Component({
    imports: [LanguageSelect, RouterOutlet, ThemeSelect],
    selector: 'app-public-layout',
    styleUrl: './public-layout.css',
    templateUrl: './public-layout.html',
})
export class PublicLayout {}
