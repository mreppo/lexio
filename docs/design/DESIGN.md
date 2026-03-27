# The Design System: Editorial Learning Experience

## 1. Overview & Creative North Star: "The Luminous Mentor"
This design system moves away from the clinical, "spreadsheet" feel of traditional ed-tech. Our Creative North Star is **The Luminous Mentor**. Imagine a high-end study retreat at golden hour: warm, sophisticated, and deeply personal. 

We reject the "card soup" of generic PWAs. Instead, we embrace **intentional asymmetry** and **tonal depth**. By using oversized geometric typography paired with soft, organic body text, we create an editorial rhythm that guides the student's eye through a narrative of progress, rather than a checklist of tasks. The interface should feel like a living conversation with a personal coach—authoritative yet encouraging.

---

## 2. Colors & Surface Philosophy

### Color Palette (Material Design Convention)
*   **Primary (The Glow):** `primary` (#ffc174) and `primary_container` (#f59e0b). Use these to draw the eye to the single most important action.
*   **Secondary (The Depth):** `secondary` (#adc6ff). Used for supportive interactive elements.
*   **Surface (The Canvas):** `surface` (#0e131e) serves as our deep, midnight foundation.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts.
*   To separate a section, transition from `surface` to `surface_container_low`.
*   To highlight a featured word or card, use `surface_container_high` on top of a `surface` background.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use the "Tonal Lift" method:
1.  **Base Layer:** `surface` (The furthest back).
2.  **Sectioning Layer:** `surface_container_low` (Subtle grouping).
3.  **Active Component Layer:** `surface_container_highest` (High-prominence cards).

### The "Glass & Gradient" Rule
To achieve a "premium" feel, floating elements (like bottom navigation or modal headers) must use **Glassmorphism**. 
*   **Fill:** `surface_variant` at 60% opacity.
*   **Effect:** Backdrop blur (12px–20px).
*   **Signature Polish:** Use a linear gradient from `primary` to `primary_container` (at 15% opacity) as a subtle overlay on hero sections to create a "soulful" glow.

---

## 3. Typography: The Voice of the Coach

Our typography is a study in contrast: the rigid geometry of Epilogue (Sora alternative) for authority, and the friendly warmth of Plus Jakarta Sans (Nunito alternative) for accessibility.

*   **Display & Headlines (Epilogue):** These are your "Coach's Voice." Use `display-lg` for daily streaks and `headline-md` for new word introductions. These should feel bold and unmissable.
*   **Body & Titles (Plus Jakarta Sans):** The "Student's Workspace." Use `body-lg` for definitions and `title-md` for navigation labels. The rounded terminals of this typeface ensure the interface remains "warm" and never "academic."
*   **Intentional Scale:** Do not fear white space. A single word in `display-lg` surrounded by a `6` (2rem) spacing unit is more powerful than a paragraph of small text.

---

## 4. Elevation & Depth: Tonal Layering

Traditional shadows are too heavy for a modern PWA. We use **Ambient Depth**.

*   **The Layering Principle:** Instead of a shadow, place a `surface_container_lowest` element inside a `surface_container_high` area to create a "recessed" look for input fields.
*   **Ambient Shadows:** For floating action buttons or high-priority modals, use a shadow with a blur of `24px` and an opacity of `6%`. The shadow color must be a tinted version of `surface_container_highest`, never pure black.
*   **The "Ghost Border" Fallback:** If a boundary is required for accessibility, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.
*   **Softening the Edge:** Use the `xl` (1.5rem/24px) roundedness for large containers to lean into the "personal coach" feel.

---

## 5. Components

### Buttons
*   **Primary:** Background `primary_container` (#f59e0b), Text `on_primary_container`. Radius: `10px`. Use a subtle inner-glow (top-down white gradient at 10%) to give it a "tactile" feel.
*   **Secondary:** Ghost-style with `surface_container_highest` background. No border.

### Vocabulary Cards
*   **Forbid Dividers:** Never use a line to separate a word from its definition. Use a `1.5` (0.5rem) vertical spacing shift or a subtle background tint change from `surface_container` to `surface_container_high`.
*   **Layout:** Use asymmetrical padding (e.g., `4` on the left, `6` on the right) to create an editorial, non-grid feel.

### Progress Chips
*   Use `secondary_container` with `secondary_fixed` text. These should be pill-shaped (`full` roundedness) to contrast against the more aggressive `16px` card corners.

### Interactive Inputs
*   **States:** On focus, the input should not just gain a border; it should transition its background from `surface_container_lowest` to `surface_container_highest` to "lift" toward the user.

### New Component: The "Focus Hearth"
A dedicated area for the "Word of the Day." Use a `surface_bright` background with a `primary` glow (using a 40px blur radial gradient) behind the text to create a center of gravity for the user.

---

## 6. Do's and Don'ts

### Do
*   **Do** use the `20` (7rem) spacing unit to separate major sections. Breath is motivation.
*   **Do** use "Epilogue" in all-caps for `label-sm` to create a premium, "labeled" look.
*   **Do** overlap elements. A floating "Check" button should partially overlap the card above it to break the "stack of boxes" look.

### Don't
*   **Don't** use 100% white text. Use `on_surface` (#dee2f2) to maintain the warm, dark-mode aesthetic.
*   **Don't** use standard "Success Green" for everything positive. Mix it with `secondary` blue to create a more sophisticated "learning" palette.
*   **Don't** use cards inside cards. If you need a sub-section, use a background color shift, not a new border or shadow.