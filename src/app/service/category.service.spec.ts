import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
    let service: CategoryService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(CategoryService);
        http = TestBed.inject(HttpTestingController);
    });

    it('passes on the translated API message of a conflict', async () => {
        const result = firstValueFrom(service.createCategory({ label: 'Home', icon: '@drawable/ic_home', color: '#E65100' }));
        http.expectOne(() => true).flush({ error: { message: 'Ya existe una categoría con ese nombre' } }, { status: 409, statusText: 'Conflict' });

        await expect(result).rejects.toThrow('Ya existe una categoría con ese nombre');
    });

    it('passes on the first validation message', async () => {
        const result = firstValueFrom(service.createCategory({ label: '', icon: 'x', color: 'red' }));
        http.expectOne(() => true).flush({ errors: { label: 'no debe estar vacío', color: 'formato inválido' } }, { status: 400, statusText: 'Bad Request' });

        await expect(result).rejects.toThrow('no debe estar vacío');
    });
});
