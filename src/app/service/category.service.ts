import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../config';
import { Category } from '../model/category.model';

@Injectable({
    providedIn: 'root',
})
export class CategoryService {
    private apiUrl = `${environment.apiUrl}/api/categories`;

    constructor(private http: HttpClient) {}

    getAllCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(this.apiUrl).pipe(catchError(this.handleError));
    }

    getCategoryById(id: number): Observable<Category> {
        return this.http.get<Category>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
    }

    createCategory(category: Category): Observable<Category> {
        return this.http.post<Category>(this.apiUrl, category).pipe(catchError(this.handleError));
    }

    updateCategory(id: number, category: Category): Observable<Category> {
        return this.http
            .put<Category>(`${this.apiUrl}/${id}`, category)
            .pipe(catchError(this.handleError));
    }

    deleteCategory(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
    }

    /**
     * The API answers {"error": {"message"}} or, for validation, {"errors": {"field": "message"}}, already
     * translated through Accept-Language. The Error message is that text, empty when there is none.
     */
    private handleError(error: HttpErrorResponse): Observable<never> {
        const body = error.error;
        const message = (body?.error?.message ?? Object.values(body?.errors ?? {})[0] ?? '') as string;

        return throwError(() => new Error(message));
    }
}
