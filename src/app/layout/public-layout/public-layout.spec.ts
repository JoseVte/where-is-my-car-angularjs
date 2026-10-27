import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Theme } from '../../theme/theme';
import { PublicLayout } from './public-layout';

describe('PublicLayout', () => {
    let component: PublicLayout;
    let fixture: ComponentFixture<PublicLayout>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PublicLayout],
            // jsdom has no matchMedia, which the real Theme needs
            providers: [provideRouter([]), { provide: Theme, useValue: { selection: signal('system'), setTheme: () => {} } }],
        }).compileComponents();

        fixture = TestBed.createComponent(PublicLayout);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
