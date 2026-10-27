import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SavedLocation } from '../model/saved-location.model';
import { Notice } from '../shared/notice';
import { SavedLocationService } from './saved-location.service';

/** Actions of the Android location menu (location_item_menu) shared by the map and the history. */
@Service()
export class LocationActions {
    private readonly savedLocationService = inject(SavedLocationService);
    private readonly notice = inject(Notice);
    private readonly router = inject(Router);

    /** Same text and link the Android app shares (LocationExtensions.share). */
    async share(location: SavedLocation): Promise<void> {
        const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;

        if (navigator.share) {
            try {
                await navigator.share({ title: location.displayName, text: location.displayName, url });
            } catch {
                // Closing the share sheet rejects, nothing to do
            }
            return;
        }

        await navigator.clipboard.writeText(`${location.displayName}\n${url}`);
        this.notice.show('web_link_copied');
    }

    /** Resolves to true when the location was deleted. */
    async delete(location: SavedLocation): Promise<boolean> {
        try {
            await firstValueFrom(this.savedLocationService.delete(location.id));
            this.notice.show('location_deleted');
            return true;
        } catch {
            this.notice.show('web_delete_error');
            return false;
        }
    }

    edit(location: SavedLocation): void {
        this.router.navigate(['/locations', location.id, 'edit']);
    }

    /** Android opens LocationDetails when a list item is tapped. */
    open(id: number): void {
        this.router.navigate(['/locations', id]);
    }
}
