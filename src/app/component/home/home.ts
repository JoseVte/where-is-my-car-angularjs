import { Component } from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { Button } from '../../shared/components/button/button';

@Component({
    imports: [Button, TranslatePipe],
    selector: 'app-home',
    styleUrl: './home.css',
    templateUrl: './home.html',
})
export class Home {}
