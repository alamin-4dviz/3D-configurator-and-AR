# 3D AR Model Viewer & Admin Platform - Design Guidelines

## Design Approach

**Selected Approach:** Hybrid - Material Design System foundation with custom 3D viewer components

**Rationale:** This application requires clean, functional UI for admin operations while showcasing visual 3D content. Material Design provides robust patterns for data-heavy dashboards, forms, and CRUD operations, while allowing custom treatment for the 3D viewer and AR preview components.

**Key Design Principles:**
- Content-first: 3D models are the hero, UI supports and enhances
- Clear hierarchy: Distinguish user features from admin functions
- Technical clarity: Make device selection and conversion status obvious
- Progressive disclosure: Show complexity only when needed

---

## Typography

**Font System:** Google Fonts
- **Primary:** Inter (400, 500, 600, 700) - UI, body text, admin dashboard
- **Accent:** Space Grotesk (500, 700) - Headers, feature callouts

**Hierarchy:**
- Hero/Page Headers: text-4xl to text-5xl, font-bold, Space Grotesk
- Section Headers: text-2xl to text-3xl, font-semibold, Inter
- Card Titles: text-lg to text-xl, font-semibold
- Body Text: text-base, font-normal, line-height relaxed
- Captions/Meta: text-sm, font-medium
- Buttons/CTAs: text-base, font-medium, uppercase tracking-wide

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16
- Micro spacing: p-2, gap-2 (tight groupings)
- Standard spacing: p-4, m-4, gap-4 (cards, form fields)
- Section spacing: py-8, py-12 (between content blocks)
- Large spacing: py-16, my-16 (page sections on desktop)

**Grid System:**
- Container max-width: max-w-7xl for main content
- Admin dashboard: 12-column grid with sidebar
- Model galleries: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Upload interface: centered, max-w-2xl

**Responsive Breakpoints:**
- Mobile: Single column, stacked navigation
- Tablet (md): 2-column grids, side-by-side forms
- Desktop (lg+): Full layouts with sidebars, 3-column grids

---

## Component Library

### Navigation
**Public User Header:**
- Horizontal navigation: Logo left, menu items center/right
- Menu items: "Upload Model" | "Admin Models" | [Admin Login button]
- Sticky header on scroll with subtle shadow
- Mobile: Hamburger menu with slide-out drawer

**Admin Dashboard Sidebar:**
- Fixed left sidebar (w-64) with navigation links
- Sections: Dashboard | Models | Upload | Settings | Logout
- Active state: Highlighted background + left border accent
- Collapsible on mobile with overlay

### Upload Interface Components

**Device Selection (Critical UX):**
- Large radio cards with icons (not tiny radio buttons)
- Three options displayed horizontally on desktop, stacked on mobile
- Each card shows: Device icon + label + format badge (USDZ/GLB)
- Visual feedback: Selected card has border highlight + subtle background
- Cards: min-h-32, p-6, rounded-lg borders

**File Upload Zone:**
- Drag-and-drop area: Dashed border, min-h-64, centered content
- States: Default (gray dashed) | Hover (solid border) | Uploading (progress bar) | Success (checkmark)
- Supported formats displayed below: text-sm with file type badges
- File preview after upload: Thumbnail + filename + file size + remove button

**Conversion Status:**
- Progress indicator with stages: Uploading → Converting → Ready
- Each stage: Icon + label + progress percentage
- Loading spinner during active conversion
- Success state: Green checkmark + "View in AR" button

### 3D Model Viewer

**Viewer Container:**
- Full-width responsive container, aspect-ratio-video or min-h-96
- Rounded corners (rounded-xl) with subtle shadow
- Loading skeleton while model loads
- Controls overlay: Semi-transparent bottom toolbar with AR button, rotation reset, zoom controls
- AR button: Prominent, blurred background backdrop, large touch target (min-h-12)

**Model Card (Gallery View):**
- Card structure: Image preview thumbnail (16:9) + title + metadata row
- Hover state: Lift effect (transform translate-y) + increased shadow
- Metadata: Category badge + file size + upload date
- CTA: "View in AR" button with device-appropriate icon
- Compact grid layout with consistent aspect ratios

### Admin Dashboard Components

**Model Management Table:**
- Clean table with alternating row backgrounds
- Columns: Thumbnail (60px square) | Title | Category | Visibility Toggle | Upload Date | Actions
- Actions: Icon buttons for Edit (pencil), Delete (trash), Quick View (eye)
- Visibility toggle: Switch component with clear on/off states
- Responsive: Stack into cards on mobile with all info preserved

**Admin Upload Form:**
- Multi-step form with progress indicator at top
- Step 1: Basic Info (title, description, category dropdown)
- Step 2: Model Upload (same drag-drop as user interface)
- Step 3: Configurator Assets (expandable sections for textures, materials, parts)
- Step 4: Review & Publish (preview card + visibility toggle)
- Navigation: Previous/Next buttons at bottom, Save Draft option

**Configurator Metadata Builder:**
- Accordion sections for Parts, Textures, Materials, Colors
- Add/Remove items with + and - icon buttons
- Each item: Input field + color picker (for colors) + file upload (for textures)
- Visual preview of current configuration on right side (desktop) or below (mobile)

### Forms & Inputs

**Text Inputs:**
- Border-bottom style with label floating above when filled
- Focus state: Border thickens slightly
- Helper text below in text-sm
- Error state: Red border + error message

**Buttons:**
- Primary: Solid fill, rounded-lg, px-6 py-3, medium font weight
- Secondary: Outlined version of primary
- Icon buttons: Square (h-10 w-10), rounded-full, centered icon
- Disabled state: Reduced opacity (opacity-50), cursor-not-allowed

**File Upload Buttons:**
- Larger target: min-h-12, px-8
- Icon + text label
- Loading state: Spinner replaces icon, text changes to "Uploading..."

---

## Animations & Interactions

**Use Sparingly - Performance Critical:**
- Hover states: Subtle transform translate or scale (0.98 to 1.02)
- Page transitions: Fade in content (opacity 0 to 1, 200ms)
- Model loading: Skeleton pulse animation
- NO complex scroll-triggered animations
- NO auto-playing carousels
- AR viewer: Smooth rotation on drag only

---

## Page Layouts

### User Upload Page
- Centered layout, max-w-3xl
- Hero section: Large heading + brief description (py-12)
- Device selection cards immediately visible
- Upload zone below device selection
- AR viewer appears after successful conversion (replaces upload zone)

### Admin Models Browser (Public)
- Full-width header with search/filter bar
- Grid layout: 3 columns desktop, 2 tablet, 1 mobile
- Each model card shows preview + title + AR button
- No hero section - content starts immediately with filter options

### Admin Dashboard
- Sidebar + main content area layout
- Dashboard overview: Stats cards in grid (4 columns: Total Models, Visible, Hidden, Storage Used)
- Recent uploads table below stats
- Each stats card: Icon + number (large) + label (small)

### Admin Model Upload/Edit
- Two-column layout: Form on left (8 cols), live preview on right (4 cols)
- Form sections clearly separated with borders
- Fixed preview pane on desktop (scrolls with form on mobile)
- Action buttons sticky at bottom

---

## Images

**Hero Images:** Not applicable for this application - it's utility-focused

**Thumbnail Images:**
- Model preview thumbnails: Auto-generated from 3D model, 16:9 aspect ratio
- Default placeholder if thumbnail generation fails: Geometric wireframe icon

**Icon Usage:**
- Heroicons for all UI icons via CDN
- Device icons: Use phone/tablet glyphs from Heroicons
- File type icons: Document icons with badges
- AR-specific icons: Cube-transparent for 3D, viewfinder for AR mode

---

## Accessibility

- All interactive elements: min-height 44px for touch targets
- Form labels: Always visible, never placeholder-only
- Color contrast: Meet WCAG AA standards minimum
- Keyboard navigation: Logical tab order, visible focus states
- AR viewer: Keyboard controls documented, alternative text for 3D content
- Loading states: Announce to screen readers
- Error messages: Associated with form fields via aria-describedby

---

**Implementation Priority:**
1. Admin dashboard (high data density, clear hierarchy)
2. Upload interface (decision clarity for device selection)
3. Model viewer (immersive but controlled)
4. Public gallery (discoverable, browsable)