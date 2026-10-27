import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, input, model, signal } from '@angular/core';

export type BottomSheetState = 'collapsed' | 'half' | 'expanded';

/** Pixels a pointer has to move before a press on the header counts as a drag instead of a tap. */
const DRAG_THRESHOLD = 6;

/**
 * Android BottomSheetBehavior (fitToContents false, not hideable). Fills its positioned parent;
 * `[sheetHeader]` drags the sheet and `[sheetBody]` scrolls.
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '(focusin)': 'onFocusIn($event)',
        class: 'absolute inset-x-0 bottom-0 z-[1001] flex flex-col rounded-t-[40px] bg-background px-6 shadow-[0_-4px_24px_rgb(0_0_0/0.15)]',
        '[class.transition-transform]': '!dragging()',
        '[class.duration-300]': '!dragging()',
        '[style.height.px]': 'sheetHeight()',
        '[style.transform]': '"translateY(" + offset() + "px)"',
    },
    selector: 'app-bottom-sheet',
    templateUrl: './bottom-sheet.html',
})
export class BottomSheet {
    peekHeight = input(140);
    expandedOffset = input(100);
    state = model<BottomSheetState>('collapsed');

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly destroyRef = inject(DestroyRef);
    private readonly parentHeight = signal(0);
    protected readonly dragging = signal(false);
    private readonly dragOffset = signal(0);

    protected readonly sheetHeight = computed(() => Math.max(this.parentHeight() - this.expandedOffset(), this.peekHeight()));

    /** translateY: 0 when expanded, sheetHeight - peekHeight when collapsed. */
    protected readonly offset = computed(() => (this.dragging() ? this.dragOffset() : this.offsetFor(this.state())));

    /** Height of the sheet on screen, live while dragging. Used to keep the map controls above it. */
    readonly visibleHeight = computed(() => this.sheetHeight() - this.offset());

    private dragStart: { pointerY: number; offset: number; moved: boolean } | null = null;

    constructor() {
        afterNextRender(() => {
            const parent = this.host.nativeElement.parentElement!;
            const observer = new ResizeObserver(() => this.parentHeight.set(parent.clientHeight));
            observer.observe(parent);
            this.destroyRef.onDestroy(() => observer.disconnect());
        });
    }

    /** Moves are followed on window: a fast swipe leaves the header before the drag threshold is reached. */
    protected onPointerDown(event: PointerEvent): void {
        if (event.button !== 0) {
            return;
        }

        // Start from where the sheet is drawn, which differs from offset() while it is still animating
        const drawnOffset = new DOMMatrixReadOnly(getComputedStyle(this.host.nativeElement).transform).m42;
        this.dragStart = { pointerY: event.clientY, offset: drawnOffset, moved: false };

        const move = (moveEvent: PointerEvent) => this.onPointerMove(moveEvent);
        const end = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', end);
            window.removeEventListener('pointercancel', end);
            this.onPointerUp();
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', end);
        window.addEventListener('pointercancel', end);
    }

    private onPointerMove(event: PointerEvent): void {
        if (!this.dragStart) {
            return;
        }

        const delta = event.clientY - this.dragStart.pointerY;
        if (!this.dragStart.moved) {
            if (Math.abs(delta) < DRAG_THRESHOLD) {
                return;
            }
            this.dragStart.moved = true;
            this.dragging.set(true);
        }

        this.dragOffset.set(Math.min(Math.max(this.dragStart.offset + delta, 0), this.offsetFor('collapsed')));
    }

    private onPointerUp(): void {
        if (!this.dragStart) {
            return;
        }

        const { moved } = this.dragStart;
        this.dragStart = null;

        if (moved) {
            this.state.set(this.nearestState(this.dragOffset()));
            this.dragging.set(false);
            this.swallowNextClick();
        }
    }

    /** Tabbing into the list while collapsed would focus elements below the screen edge. */
    protected onFocusIn(event: FocusEvent): void {
        if (this.state() === 'collapsed' && (event.target as Element).closest('[data-sheet-body]')) {
            this.state.set('half');
        }
    }

    /** Tapping the handle toggles between collapsed and half, like a quick swipe would. */
    protected toggle(): void {
        this.state.set(this.state() === 'collapsed' ? 'half' : 'collapsed');
    }

    private offsetFor(state: BottomSheetState): number {
        const height = this.sheetHeight();
        switch (state) {
            case 'expanded':
                return 0;
            case 'half':
                return Math.max(height - this.parentHeight() / 2, 0);
            default:
                return Math.max(height - this.peekHeight(), 0);
        }
    }

    private nearestState(offset: number): BottomSheetState {
        const states: BottomSheetState[] = ['expanded', 'half', 'collapsed'];
        return states.reduce((nearest, state) => (Math.abs(this.offsetFor(state) - offset) < Math.abs(this.offsetFor(nearest) - offset) ? state : nearest));
    }

    /** A drag that ends over a button (the save card) must not also press it. */
    private swallowNextClick(): void {
        const element = this.host.nativeElement;
        const swallow = (event: Event) => {
            event.stopPropagation();
            event.preventDefault();
        };
        element.addEventListener('click', swallow, { capture: true, once: true });
        setTimeout(() => element.removeEventListener('click', swallow, { capture: true }));
    }
}
