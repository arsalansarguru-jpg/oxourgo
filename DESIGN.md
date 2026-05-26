# Oxour Go — Luxury Design System (Stitch Specification)

This specification defines the high-end, matte-black and electric-blue luxury theme for Oxour Go, aligning both the **Client Portal** and **Enterprise Admin Console** under a unified digital experience.

---

## 1. Color Palette

| Name | Hex Code | Utility / Context |
|------|----------|-------------------|
| **Matte Dark** | `#050816` | Main viewport background for a sleek, deep tone. |
| **Carbon Core** | `#0b1220` | Secondary panel backgrounds and cards. |
| **Carbon Deep** | `#111827` | Inner containers, table headers, and form fills. |
| **Electric Blue** | `#0066ff` | Primary CTA, focus states, and accent outlines. |
| **Electric Glow** | `rgb(0 102 255 / 0.55)` | Specular highlights, glowing shadows. |
| **Cyan Spark** | `#00c2ff` | Kicker tags, active sub-status, secondary glows. |
| **Emerald Pass** | `#10b981` | Verification success, approved badges, paid status. |

---

## 2. Elevation & Glassmorphism (Stitch Surface Tokens)

Both panels share three structural surface elevation filters to create visual depth and a premium sense of layering:

### Flat Surface
* **Tokens:** `bg-carbon/92 border border-stroke`
* **Vibe:** Standard utility list cards, settings inputs, and content wrappers.

### Glassmorphic Panel (`glass-panel`)
* **Tokens:** `background: rgb(255 255 255 / 0.04); backdrop-filter: blur(24px); border: 1px solid rgb(0 194 255 / 0.2);`
* **Vibe:** Booking details sidebar, summary drawers, active checkout overlays.

### Specular Active Card (`glow-electric`)
* **Tokens:** `border-electric/40 shadow-[0_0_48px_-12px_rgb(0_102_255/0.55)] scale-[1.02]`
* **Vibe:** Hovered catalog cars, currently active steps, highlighted KPI stats.

---

## 3. Framer Motion Motion Curves (Stitch Physics)

To keep the interface feeling responsive and organic rather than linear, all transitions use standard physical spring variables:

### Page & Large Section Wipe
```typescript
initial: { opacity: 0, y: 12 }
animate: { opacity: 1, y: 0 }
exit: { opacity: 0, y: -12 }
transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } // Custom luxury bezier
```

### Spring Button / Card Hover
```typescript
whileHover: { scale: 1.025, y: -4 }
whileTap: { scale: 0.975 }
transition: { type: 'spring', stiffness: 350, damping: 22 }
```

### Shared Layout Grid Slide
```typescript
layout: true
transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
```

---

## 4. Layout Architecture Stitching

### Client Front-End
* Center-stage layouts with dynamic parallax specular highlights, floating glassmorphic navs, and floating ambient light elements (`absolute bg-electric/10 filter blur-3xl rounded-full`).

### Admin Console
* Left-fixed collapsing kinetic navigation menu expanding on hover, fluid dynamic charts, and spring-loaded operational KPI cards.
