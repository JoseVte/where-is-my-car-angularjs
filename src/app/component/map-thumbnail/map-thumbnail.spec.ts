import { TestBed } from '@angular/core/testing';
import { MapThumbnail } from './map-thumbnail';

function render(latitude: number, longitude: number, zoom: number): HTMLImageElement[] {
    const fixture = TestBed.createComponent(MapThumbnail);
    fixture.componentRef.setInput('latitude', latitude);
    fixture.componentRef.setInput('longitude', longitude);
    fixture.componentRef.setInput('zoom', zoom);
    fixture.detectChanges();
    return Array.from(fixture.nativeElement.querySelectorAll('img'));
}

describe('MapThumbnail', () => {
    it('loads the four tiles around a point on a tile corner, centered in the box', () => {
        // (0, 0) at zoom 1 is the corner shared by the four tiles
        const tiles = render(0, 0, 1);

        expect(tiles.map((tile) => tile.src).sort()).toEqual([
            'https://tile.openstreetmap.org/1/0/0.png',
            'https://tile.openstreetmap.org/1/0/1.png',
            'https://tile.openstreetmap.org/1/1/0.png',
            'https://tile.openstreetmap.org/1/1/1.png',
        ]);
        const topLeft = tiles.find((tile) => tile.src.endsWith('/1/0/0.png'))!;
        expect(topLeft.style.left).toBe('-216px');
        expect(topLeft.style.top).toBe('-216px');
    });

    it('loads a single tile when the box fits inside it', () => {
        // Center of tile 0/0/0
        expect(render(0, 0, 0).map((tile) => tile.src)).toEqual(['https://tile.openstreetmap.org/0/0/0.png']);
    });
});
