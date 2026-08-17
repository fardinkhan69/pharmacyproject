# PharmaCare — Design System Specification (Pharmly / shadcn UI Style)

Based on the modern SaaS pharmacy management moodboard (Pharmly aesthetic + shadcn design principles).

---

## 1. Design Direction & Aesthetic Philosophy

- **Vibe**: High-end healthcare SaaS, surgical precision, modern editorial clean, zero generic "AI slop".
- **Primary Contrast**: Deep forest pine (`#0C2520`) paired with high-contrast electric lime / chartreuse (`#D2F872`) and crisp clean whites / light sage neutrals (`#F4F6F5`).
- **Surface Elevation**: Subtle 1px borders (`#E5EAE8`) and soft diffused elevation (`0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(12,37,32,0.03)`).
- **Radius Strategy**:
  - Cards & Modals: `16px` – `20px` (`rounded-2xl`)
  - Buttons & Inputs & Badges: `9999px` (`rounded-full`) or `10px` (`rounded-lg`)
  - Table Header Rows: `8px` (`rounded-md`)

---

## 2. Color Palette (Tokens)

### Backgrounds
| Token | Hex | Usage |
|---|---|---|
| `--bg-app` | `#F4F6F5` | Main application canvas / body |
| `--bg-sidebar` | `#0C2520` | Dark deep pine sidebar background |
| `--bg-card` | `#FFFFFF` | Main cards, tables, panels |
| `--bg-card-dark` | `#113831` | Featured / Highlight metric cards |
| `--bg-subtle` | `#F0F4F2` | Subtle input / hover surfaces |
| `--bg-table-header`| `#EAF0EE` | Table header pill background |

### Brand Accents
| Token | Hex | Usage |
|---|---|---|
| `--brand-lime` | `#D2F872` | Active sidebar nav pill, primary CTA buttons, highlight tags |
| `--brand-lime-hover`| `#C2EC5E` | Button hover state |
| `--brand-pine` | `#0C2520` | Primary dark text, sidebar background, strong brand accents |
| `--brand-pine-light`| `#18463D` | Dark card secondary background |

### Typography Colors
| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#0F1E1B` | Primary headings, table row values, strong labels |
| `--text-secondary`| `#5E706B` | Subtitles, table headers, descriptions |
| `--text-muted` | `#94A39F` | Placeholder text, inactive hints, helper text |
| `--text-on-dark` | `#F4F9F6` | Sidebar text, featured card text |
| `--text-on-lime` | `#0C2520` | Text on electric lime buttons and pills |

### Semantic Badges (Pastel Pill System)
| Status | Background | Text Color | Border |
|---|---|---|---|
| **In Stock** | `#E3F9EC` | `#0EA554` | `rgba(14,165,84,0.15)` |
| **Low Stock** | `#FEF6D8` | `#D97706` | `rgba(217,119,6,0.15)` |
| **Out of Stock** | `#FEE8E8` | `#E11D48` | `rgba(225,29,72,0.15)` |
| **Expired** | `#FEE8E8` | `#E11D48` | `rgba(225,29,72,0.15)` |

---

## 3. Typography & Hierarchy

- **Font Family**: `'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- **Page Titles**: `22px – 24px`, weight `700`, tracking `-0.02em`
- **Metric Big Numbers**: `28px – 32px`, weight `700`, tracking `-0.03em`
- **Section Headers**: `15px – 16px`, weight `600`, color `--text-primary`
- **Table Headers**: `11px – 12px`, weight `600`, uppercase, tracking `0.05em`, color `--text-secondary`
- **Body & Data**: `13px – 14px`, weight `400 / 500`

---

## 4. Component Standards

### A. Sidebar
- Deep pine background with minimalist brand mark (`P` in pill shape + "Pharmly / PharmaCare").
- Active navigation item rendered as electric lime pill (`#D2F872`) with deep pine text and icon.
- Inactive items rendered with sleek outline Lucide icons and soft muted green/gray text.
- Clean bottom user/logout section.

### B. Top Header Bar
- Title + subtitle ("Let's check your pharmacy today").
- Search bar (pill shaped `#FFFFFF` with search icon).
- User profile pill with avatar, name, role and notification bell.

### C. Stat Cards
- Highlighted metric card (e.g. Total Medicines or Total Profit) in dark pine with electric lime accent badge.
- Secondary metric cards in crisp white with soft colored icon containers (e.g. amber for low stock, rose for out of stock, emerald for sales).
- Trend badge indicators (e.g. `+2.7% Since last week`).

### D. Data Tables
- Soft rounded container with pill-shaped soft sage header bar (`#EAF0EE`).
- High-density, clean typographic rows with crisp hover states.
- Clean action icon buttons (Lucide icons: Eye, Edit, Trash) in subtle gray with soft hover backgrounds.

### E. Modals & Forms
- Clean white popups with backdrop blur (`backdrop-blur-md bg-black/30`).
- Crisp rounded inputs (`rounded-lg` or `rounded-full`) with subtle borders and pine focus rings.
- Primary CTA buttons in electric lime with bold dark pine text.
