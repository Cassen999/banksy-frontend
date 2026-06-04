# TODOs

## Homepage desktop layout — PLACEHOLDER

**File:** `src/components/Homepage/homepage.scss`

The current desktop layout uses `grid-column: 1 / -1` to force the homepage to span both columns of the `Layout` grid. This is a direct violation of the layout contract — page components must not override the grid established by `Layout`.

**What needs to change:**
The desktop homepage layout must work within the two-column grid, not override it. The image and the message need to be placed into the two separate grid cells that `Layout` provides, rather than having the homepage span across both.

**Approaches to consider:**
- Restructure `HomepagePage` so that the image and message are separate top-level children rendered inside the grid (may require a layout escape hatch or a homepage-specific layout variant)
- Introduce a full-bleed layout option in `Layout` for pages that need it
- Coordinate with whatever the final homepage design requires before implementing properly
