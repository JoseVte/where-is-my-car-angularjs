import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { I18n } from '../../i18n/i18n';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { Category, isSystemLabel } from '../../model/category.model';
import { CategoryService } from '../../service/category.service';
import { categoryIcon } from '../../shared/components/category-icon/category-icon.util';
import { CATEGORY_ICONS, PICKER_ICONS } from '../../shared/components/category-icon/category-icons';
import { Icon } from '../../shared/components/icon/icon';
import { readableTextOn } from '../../shared/color';
import { goBack } from '../../shared/go-back';
import {
    DEFAULT_COLOR,
    DEFAULT_ICON,
    emojiShortcutKey,
    IconChoice,
    iconChoice,
    iconValue,
    isSingleEmoji,
    LABEL_MAX_LENGTH,
    PRESET_COLORS,
    presetColorName,
    SUGGESTED_EMOJIS,
} from './category-form';
import { resolveCategoryLabel } from '../../shared/pipes/category-label.pipe';

/** Emojis the Android emoji cell shows before one is picked. */
const SAMPLE_EMOJIS = ['🤩', '🚀', '🎨', '🎭', '🎮', '🎸', '⛺', '🌈', '🍦', '🍩'];

/**
 * Android EditCategoryFragment: live preview, label, preset or custom color and an icon grid with
 * "none" and a custom emoji. `/categories/new` creates, `/categories/:id/edit` edits.
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, Icon, RouterLink, TranslatePipe],
    selector: 'app-edit-category',
    templateUrl: './edit-category.html',
})
export class EditCategory implements OnInit {
    /** Route parameter, absent when creating. */
    id = input<string>();

    private readonly categoryService = inject(CategoryService);
    private readonly router = inject(Router);
    private readonly i18n = inject(I18n);
    private readonly emojiDialog = viewChild.required<ElementRef<HTMLDialogElement>>('emojiDialog');

    protected readonly labelMaxLength = LABEL_MAX_LENGTH;
    protected readonly presetColors = PRESET_COLORS.map((preset) => ({ ...preset, onColor: readableTextOn(preset.hex) }));
    protected readonly pickerIcons = PICKER_ICONS.map((name) => ({ name, path: CATEGORY_ICONS[name] }));
    protected readonly sampleEmoji = SAMPLE_EMOJIS[Math.floor(Math.random() * SAMPLE_EMOJIS.length)];
    protected readonly suggestedEmojis = SUGGESTED_EMOJIS;
    /** On a computer the system picker is the way to type any other emoji. */
    protected readonly emojiShortcut = emojiShortcutKey(
        (navigator as Navigator & { userAgentData?: { platform: string } }).userAgentData?.platform ?? navigator.platform,
        matchMedia('(pointer: coarse)').matches,
    );

    protected readonly isNew = computed(() => !this.id());
    protected readonly loading = signal(false);
    protected readonly notFound = signal(false);
    protected readonly saving = signal(false);
    /** Translation key, or the message the API sent (already translated). */
    protected readonly error = signal<{ key?: string; text?: string } | null>(null);

    protected readonly label = signal('');
    /** Label of a default category ("@string/category_home"): shown translated, read only and saved as is. */
    protected readonly systemLabel = signal<string | null>(null);
    protected readonly color = signal<string>(DEFAULT_COLOR);
    protected readonly icon = signal<IconChoice>(iconChoice(DEFAULT_ICON));
    protected readonly emojiDraft = signal('');
    protected readonly emojiInvalid = signal(false);

    protected readonly colorName = computed(() => presetColorName(this.color()) ?? 'custom');
    protected readonly isCustomColor = computed(() => presetColorName(this.color()) === null);
    protected readonly onColor = computed(() => readableTextOn(this.color()));
    /** Android updatePreview: pill in the color with the icon and the name ("Category" when empty). */
    protected readonly previewIcon = computed(() => categoryIcon({ label: '', icon: iconValue(this.icon()), color: this.color() }));

    ngOnInit(): void {
        if (!this.isNew()) {
            this.load();
        }
    }

    private async load(): Promise<void> {
        this.loading.set(true);
        try {
            const category = await firstValueFrom(this.categoryService.getCategoryById(Number(this.id())));
            if (isSystemLabel(category.label)) {
                this.systemLabel.set(category.label);
            }
            this.label.set(resolveCategoryLabel(this.i18n, category.label));
            this.color.set(category.color.toUpperCase());
            this.icon.set(iconChoice(category.icon));
        } catch {
            this.notFound.set(true);
        } finally {
            this.loading.set(false);
        }
    }

    protected back(): void {
        goBack(this.router, '/categories');
    }

    protected pickCustomColor(event: Event): void {
        this.color.set((event.target as HTMLInputElement).value.toUpperCase());
    }

    protected openEmojiDialog(): void {
        const current = this.icon();
        this.emojiDraft.set(current.kind === 'emoji' ? current.emoji : '');
        this.emojiInvalid.set(false);
        this.emojiDialog().nativeElement.showModal();
    }

    /** A suggestion is applied at once, like tapping an emoji on a keyboard. */
    protected pickEmoji(emoji: string): void {
        this.emojiDraft.set(emoji);
        this.applyEmoji();
    }

    protected applyEmoji(): void {
        const emoji = this.emojiDraft().trim();
        if (!isSingleEmoji(emoji)) {
            this.emojiInvalid.set(true);
            return;
        }
        this.icon.set({ kind: 'emoji', emoji });
        this.emojiDialog().nativeElement.close();
    }

    protected async save(): Promise<void> {
        const label = this.systemLabel() ?? this.label().trim();
        if (this.saving()) {
            return;
        }
        if (!label) {
            this.error.set({ key: 'web_field_required' });
            return;
        }

        this.saving.set(true);
        this.error.set(null);
        const body: Category = { label, icon: iconValue(this.icon()), color: this.color() };

        try {
            await firstValueFrom(this.isNew() ? this.categoryService.createCategory(body) : this.categoryService.updateCategory(Number(this.id()), body));
            this.back();
        } catch (error) {
            // A duplicated name comes back as a translated API message
            const text = error instanceof Error ? error.message : '';
            this.error.set(text ? { text } : { key: 'web_category_save_error' });
        } finally {
            this.saving.set(false);
        }
    }
}
