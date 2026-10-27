import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from '../../shared/components/icon/icon';

const TILE_SIZE = 256;

interface Tile {
    url: string;
    left: number;
    top: number;
}

/**
 * Static OpenStreetMap preview centered on a point, like the non interactive map of the Android list
 * items (zoom 18 with the pin on top). Only the 1 to 4 tiles that cover the box are loaded, lazily.
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'relative block shrink-0 overflow-hidden', '[style.width.px]': 'size()', '[style.height.px]': 'size()' },
    imports: [Icon],
    selector: 'app-map-thumbnail',
    templateUrl: './map-thumbnail.html',
})
export class MapThumbnail {
    latitude = input.required<number>();
    longitude = input.required<number>();
    zoom = input(18);
    size = input(80);

    protected readonly tiles = computed<Tile[]>(() => {
        const zoom = this.zoom();
        const size = this.size();
        const scale = TILE_SIZE * 2 ** zoom;

        // Web Mercator pixel of the point at this zoom, and the box around it
        const x = ((this.longitude() + 180) / 360) * scale;
        const latitude = (this.latitude() * Math.PI) / 180;
        const y = ((1 - Math.log(Math.tan(latitude) + 1 / Math.cos(latitude)) / Math.PI) / 2) * scale;
        const left = x - size / 2;
        const top = y - size / 2;

        const tiles: Tile[] = [];
        for (let tileX = Math.floor(left / TILE_SIZE); tileX <= Math.floor((left + size - 1) / TILE_SIZE); tileX++) {
            for (let tileY = Math.floor(top / TILE_SIZE); tileY <= Math.floor((top + size - 1) / TILE_SIZE); tileY++) {
                tiles.push({
                    url: `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`,
                    left: tileX * TILE_SIZE - left,
                    top: tileY * TILE_SIZE - top,
                });
            }
        }

        return tiles;
    });
}
