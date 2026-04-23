# BizUnity Design Principles
## Claude Code Prompt — UI/UX Brand Reference

> Use this file as a system-level design brief whenever generating, scaffolding, or refining any BizUnity UI. All components, pages, and interactions must conform to these principles.

---

## 1. Brand Identity

BizUnity is a **premium SME SaaS platform** rooted in the Southern African market. The visual language must feel like a boutique fintech tool — authoritative, clean, and quietly luxurious. It is not a startup MVP. It is not corporate grey. It is not a generic dashboard.

**Personality:** Confident. Precise. Minimal with purpose. Gold accents signal trust and aspiration without being flashy.

---

## 2. Color System

Always use these exact tokens. Never substitute with generic Tailwind defaults (e.g. `blue-500`, `gray-200`). Always define them as CSS custom properties at the `:root` level and reference them by name.

```css
:root {
  /* Brand */
  --brand-gold:        #C9A24D;
  --brand-black:       #0F0F0F;
  --brand-white:       #FFFFFF;

  /* Text */
  --text-primary:      #0F0F0F;
  --text-secondary:    #2E2E2E;
  --text-muted:        #6F6F6F;
  --text-inverse:      #FFFFFF;
  --text-accent:       #C9A24D;

  /* Backgrounds */
  --bg-page:           #FFFFFF;
  --bg-section:        #F4F4F4;
  --bg-card:           #FFFFFF;
  --bg-dark:           #0F0F0F;
  --bg-overlay:        rgba(15, 15, 15, 0.75);

  /* Borders */
  --border-default:    #E0E0E0;
  --border-strong:     #2E2E2E;
  --border-accent:     #C9A24D;

  /* Actions */
  --action-primary:        #C9A24D;
  --action-primary-hover:  #B08F3F;
  --action-secondary:      #0F0F0F;
  --action-secondary-hover:#2E2E2E;
  --action-disabled:       #D6D6D6;

  /* Status */
  --status-success:    #2E7D32;
  --status-warning:    #ED6C02;
  --status-error:      #C62828;
  --status-info:       #0277BD;

  /* Data Viz */
  --data-primary:      #C9A24D;
  --data-secondary:    #1C2A3A;
  --data-neutral:      #9E9E9E;
  --data-positive:     #2E7D32;
  --data-negative:     #C62828;
}
```

### Color Usage Rules

- **Gold (`--brand-gold`)** is the single accent color. Use it sparingly — primary CTAs, active nav states, status badges, chart highlights, and decorative rule lines. Never use it as a background fill over large areas.
- **Black (`--brand-black`)** is the primary surface for sidebars, headers, and hero sections. White text only on dark surfaces.
- **`--bg-section` (`#F4F4F4`)** is the default page background. Cards sit on this as white islands.
- **Monetary values** must always render in `--text-primary` with the currency symbol in `--text-muted`.
- **Status colors** are for badges and inline indicators only — never full-panel backgrounds.

---

## 3. Typography

```css
/* Import in your global CSS or index.html */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

:root {
  --font-sans: 'DM Sans', sans-serif;
  --font-mono: 'DM Mono', monospace;
}
```

### Type Scale

| Role               | Size   | Weight | Color              | Usage                          |
|--------------------|--------|--------|--------------------|--------------------------------|
| Page title         | 24px   | 500    | `--text-primary`   | Section headings               |
| Card title         | 16px   | 500    | `--text-primary`   | Card headers, modal titles     |
| Body               | 14px   | 400    | `--text-primary`   | All body copy                  |
| Label / Meta       | 12px   | 400    | `--text-muted`     | Field labels, table sub-text   |
| Amount / Number    | 20px   | 500    | `--text-primary`   | Invoice totals, KPI values     |
| Badge / Tag        | 11px   | 500    | Semantic           | Status chips                   |
| Code / Reference   | 13px   | 400    | `--text-secondary` | Doc numbers (INV-2024-0001)    |

### Rules
- Use **DM Sans** for all UI. **DM Mono** for document numbers, amounts in tables, and reference codes.
- Weight palette: `300` for subtle labels, `400` for body, `500` for emphasis. Never 600 or 700.
- Letter-spacing: `-0.01em` on headings 18px+. `0` on body.
- Line-height: `1.6` for body, `1.2` for headings and numeric displays.

---

## 4. Layout & Spacing

### App Shell
```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (240px, bg: --brand-black)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  TOPBAR (56px, bg: --bg-card, border-bottom)     │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  CONTENT AREA (--bg-section, padding 32px) │  │   │
│  │  │                                            │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Spacing Scale (use consistently — no arbitrary values)
```
4px   — micro gaps (icon to label)
8px   — tight (within a component)
12px  — compact (between related fields)
16px  — default (between components)
24px  — relaxed (section internal padding)
32px  — section gap (between major regions)
48px  — page section separation
```

### Grid
- Content area: `max-width: 1200px`, centered with `margin: 0 auto`
- Card grids: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`, `gap: 16px`
- KPI metric row: 4 columns max, `gap: 16px`
- Form fields: single-column on mobile, 2-column on ≥768px

---

## 5. Component Patterns

### Cards
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 20px 24px;
  /* No shadow — borders define elevation */
}

.card--accent {
  border-left: 3px solid var(--brand-gold);
  padding-left: 21px; /* compensate for border */
}
```

### Buttons
```css
/* Primary — gold fill */
.btn-primary {
  background: var(--action-primary);
  color: var(--brand-black);
  font-weight: 500;
  font-size: 14px;
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  letter-spacing: 0.01em;
}
.btn-primary:hover { background: var(--action-primary-hover); }

/* Secondary — outlined black */
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-strong);
  font-weight: 400;
  padding: 9px 20px;
  border-radius: 6px;
}
.btn-secondary:hover { background: var(--bg-section); }

/* Ghost — text only */
.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  border: none;
  padding: 8px 12px;
}
.btn-ghost:hover { color: var(--text-primary); }

/* Disabled state (all variants) */
.btn:disabled {
  background: var(--action-disabled);
  color: var(--text-muted);
  cursor: not-allowed;
}
```

### Inputs & Forms
```css
.input {
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 9px 12px;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-card);
  width: 100%;
  transition: border-color 150ms ease;
}
.input:focus {
  border-color: var(--brand-gold);
  outline: none;
  box-shadow: 0 0 0 3px rgba(201, 162, 77, 0.12);
}
.input::placeholder { color: var(--text-muted); }

/* Field label */
.label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 6px;
  display: block;
}
```

### Status Badges
```tsx
// Map these exactly — no custom colors
const statusStyles = {
  // Invoice
  DRAFT:          { bg: '#F4F4F4', text: '#6F6F6F', label: 'Draft' },
  SENT:           { bg: '#E3F2FD', text: '#0277BD', label: 'Sent' },
  PARTIALLY_PAID: { bg: '#FFF3E0', text: '#ED6C02', label: 'Partial' },
  PAID:           { bg: '#E8F5E9', text: '#2E7D32', label: 'Paid' },
  OVERDUE:        { bg: '#FFEBEE', text: '#C62828', label: 'Overdue' },
  CANCELLED:      { bg: '#F4F4F4', text: '#9E9E9E', label: 'Cancelled' },
  // Quotation
  ACCEPTED:       { bg: '#E8F5E9', text: '#2E7D32', label: 'Accepted' },
  REJECTED:       { bg: '#FFEBEE', text: '#C62828', label: 'Rejected' },
  CONVERTED:      { bg: '#EDE7F6', text: '#4527A0', label: 'Converted' },
};

// Badge component
<span style={{
  background: statusStyles[status].bg,
  color: statusStyles[status].text,
  fontSize: '11px',
  fontWeight: 500,
  padding: '3px 10px',
  borderRadius: '100px',
  display: 'inline-block',
  letterSpacing: '0.02em',
}}>
  {statusStyles[status].label}
</span>
```

### Data Tables
```css
.table { width: 100%; border-collapse: collapse; font-size: 14px; }
.table th {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-default);
  text-align: left;
}
.table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-default);
  color: var(--text-primary);
  vertical-align: middle;
}
.table tr:hover td { background: var(--bg-section); }
/* Right-align all monetary columns */
.table .col-amount { text-align: right; font-family: var(--font-mono); }
```

### Sidebar Navigation
```
Background: --brand-black
Logo area: 56px height, gold wordmark or logomark
Nav item inactive: text #6F6F6F (--text-muted equiv on dark)
Nav item hover: text #FFFFFF, left border 2px solid --brand-gold
Nav item active: text #FFFFFF, background rgba(201,162,77,0.08),
                 left border 2px solid --brand-gold
Section label: 10px, letter-spacing 0.1em, color #444
```

### KPI Metric Cards
```tsx
// Always 4-up grid on the dashboard
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
  <MetricCard
    label="Total Revenue"
    value="P 284,500"          // Always format with org currency
    delta="+12.4%"
    deltaPositive={true}
  />
</div>

// MetricCard anatomy:
// - label: 11px, uppercase, --text-muted
// - value: 24px, 500 weight, --text-primary, font-mono for the number part
// - delta: 12px, green or error color with ↑ ↓ indicator
// - border-left: 2px solid --brand-gold on the first/primary card
```

---

## 6. Micro-Interactions & Motion

Keep motion subtle and functional. This is a professional tool, not a marketing site.

```css
/* All interactive elements */
* { transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease; }

/* Buttons — physical press feel */
button:active { transform: scale(0.98); }

/* Page-level fade in */
.page-enter {
  animation: fadeUp 200ms ease both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Table rows — stagger on load */
.table tr { animation: fadeIn 150ms ease both; }
.table tr:nth-child(1) { animation-delay: 0ms; }
.table tr:nth-child(2) { animation-delay: 30ms; }
.table tr:nth-child(3) { animation-delay: 60ms; }
/* cap at 5 stagger steps, then 0 delay */
```

No bounce. No spring physics. No parallax. Transitions serve clarity, not delight.

---

## 7. Financial Data Rules

These are non-negotiable given BizUnity's domain.

- **All monetary values stored and received as integers (cents)**. Format on render:
  ```ts
  const formatMoney = (cents: number, currency = 'BWP') =>
    new Intl.NumberFormat('en-BW', { style: 'currency', currency }).format(cents / 100);
  // Output: "P 2,280.00"
  ```
- **Document numbers** (`QUO-2024-0001`, `INV-2024-0001`) always render in `font-family: var(--font-mono)` with `color: var(--text-muted)`.
- **Due dates** — if overdue, render the date in `--status-error`. If due within 7 days, `--status-warning`.
- **Amount columns** in tables are always right-aligned.
- **Totals rows** in tables have `border-top: 2px solid var(--border-strong)` and `font-weight: 500`.

---

## 8. Empty States

Every list view must handle 0 results:

```tsx
<div style={{ textAlign: 'center', padding: '64px 24px' }}>
  {/* Simple SVG icon — no stock illustrations */}
  <div style={{
    width: 48, height: 48, borderRadius: 12,
    background: 'var(--bg-section)',
    border: '1px solid var(--border-default)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px'
  }}>
    {/* context-appropriate icon */}
  </div>
  <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 6px' }}>
    No invoices yet
  </p>
  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>
    Create your first invoice to get started.
  </p>
  <button className="btn-primary">Create Invoice</button>
</div>
```

---

## 9. What to Avoid

| Avoid                            | Use instead                                   |
|----------------------------------|-----------------------------------------------|
| Purple/blue gradient backgrounds | White cards on `--bg-section`                 |
| Heavy shadows (box-shadow: 0 8px 32px…) | Borders `1px solid --border-default`   |
| Rounded pill buttons (border-radius 999px) | 6px radius — professional, not playful |
| Full-color status backgrounds    | Light tint bg + dark text (see badge spec)    |
| Multiple accent colors           | Gold only — all other accents are grays       |
| Roboto, Inter, System UI fonts   | DM Sans + DM Mono                             |
| Emoji in UI                      | SVG icons or simple CSS shapes                |
| Toast/notification overload      | Inline validation, single success state       |
| Dark mode as an afterthought     | All color tokens must work in both modes      |

---

## 10. Page-Level Templates

### List Page (e.g. Invoices, Customers)
```
┌─ Page Header ────────────────────────────────────────────┐
│  Title (24px/500)              [+ New Invoice] (btn-primary)│
│  Subtitle / count (14px, muted)                            │
├─ Filters ──────────────────────────────────────────────────┤
│  [All Status ▾]  [Date Range ▾]  [Search...         ]      │
├─ Table ────────────────────────────────────────────────────┤
│  #   Customer   Amount   Status   Due Date   Actions       │
│  ─── rows ────────────────────────────────────────── ─────│
├─ Pagination ───────────────────────────────────────────────┤
│  Showing 1–20 of 143          [← Prev]  [1] [2] [Next →]  │
└────────────────────────────────────────────────────────────┘
```

### Detail / Form Page (e.g. New Quotation)
```
┌─ Breadcrumb ──────────────────────────────────────────────┐
│  Quotations / New Quotation                                │
├─ Two-Column Layout ────────────────────────────────────────┤
│  ┌─ Main (2/3) ───────────────┐  ┌─ Summary (1/3) ───────┐│
│  │  Customer selector         │  │  Subtotal              ││
│  │  Line items table          │  │  Tax                   ││
│  │  [+ Add Item]              │  │  ─────────────────     ││
│  │  Notes                     │  │  Total (bold, large)   ││
│  └────────────────────────────┘  │  [Save Draft]          ││
│                                  │  [Send to Customer]    ││
│                                  └────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

---

## 11. Tailwind Config Reference

If using Tailwind, extend the config with BizUnity tokens so utility classes match the design system:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: { gold: '#C9A24D', black: '#0F0F0F', white: '#FFFFFF' },
        biz: {
          'text-primary':   '#0F0F0F',
          'text-secondary': '#2E2E2E',
          'text-muted':     '#6F6F6F',
          'text-accent':    '#C9A24D',
          'bg-page':        '#FFFFFF',
          'bg-section':     '#F4F4F4',
          'bg-dark':        '#0F0F0F',
          'border':         '#E0E0E0',
          'border-strong':  '#2E2E2E',
          'border-accent':  '#C9A24D',
          'action':         '#C9A24D',
          'action-hover':   '#B08F3F',
          'success':        '#2E7D32',
          'warning':        '#ED6C02',
          'error':          '#C62828',
          'info':           '#0277BD',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: { DEFAULT: '6px', card: '8px', modal: '10px' },
    }
  }
}
```

---

*BizUnity Design Principles v1.0 — Reference this document when prompting Claude Code for any UI task.*
