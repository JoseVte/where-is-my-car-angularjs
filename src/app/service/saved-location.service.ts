import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../config';
import { SavedLocation, SavedLocationBody } from '../model/saved-location.model';

@Service()
export class SavedLocationService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/saved-locations`;

    getAll(): Observable<SavedLocation[]> {
        return this.http.get<SavedLocation[]>(this.apiUrl);
    }

    get(id: number): Observable<SavedLocation> {
        return this.http.get<SavedLocation>(`${this.apiUrl}/${id}`);
    }

    /** The API replaces the whole location, so send every field. */
    update(id: number, location: SavedLocationBody): Observable<SavedLocation> {
        return this.http.put<SavedLocation>(`${this.apiUrl}/${id}`, location);
    }

    create(location: SavedLocationBody): Observable<SavedLocation> {
        return this.http.post<SavedLocation>(this.apiUrl, location);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
