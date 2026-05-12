---
name: Wordle Duel Brand Identity
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#94d78c'
  on-tertiary: '#003908'
  tertiary-container: '#609f5b'
  on-tertiary-container: '#003206'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#aff4a6'
  tertiary-fixed-dim: '#94d78c'
  on-tertiary-fixed: '#002203'
  on-tertiary-fixed-variant: '#125217'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-md:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  grid-tile:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  grid-gutter: 8px
---

## Brand & Style

This design system is built for a high-stakes, competitive 1v1 environment where speed and precision are paramount. The brand personality is aggressive yet refined—balancing the "Dark Mode Gaming" aesthetic with the clarity of "Modern Minimalism." It avoids the cluttered tropes of traditional gaming interfaces in favor of a focused, performance-driven UI.

The emotional response should be one of "focused adrenaline." By utilizing high-contrast elements against a deep, non-distracting background, the design system ensures the user’s cognitive load is dedicated entirely to the word-solving task, while vibrant accents signal competitive milestones and status.

**Key Style Pillars:**
- **Modern Minimalism:** Heavy use of negative space around the word grid to eliminate distractions.
- **Glassmorphism:** Used sparingly for modal overlays and HUD elements to maintain a sense of depth without breaking the dark-mode immersion.
- **High-Contrast:** Sharp color transitions to provide immediate visual feedback during fast-paced play.

## Colors

The palette is anchored by a "Deep Charcoal" base to reduce eye strain during extended sessions. The primary brand flair is driven by "Electric Purple" and "Cyan," used for interactive elements, player identifiers, and win-state celebrations.

- **Backgrounds:** Use `#121212` for the main canvas. Use `#1e1e1e` for secondary surfaces like tile containers or player cards.
- **Competitive Accents:** Electric Purple (#8b5cf6) represents Player 1 or primary actions. Cyan (#06b6d4) represents Player 2 or secondary competitive metrics.
- **Logic States:** This design system strictly adheres to the established Wordle vocabulary—Green (#6aaa64) for correct hits and Yellow (#c9b458) for misplaced letters—but boosts their vibrance to stand out against the dark background.

## Typography

Typography in this design system prioritizes "impact" and "legibility." **Montserrat** is the voice of the competition—used for headings, timers, and the word tiles themselves to provide a geometric, high-energy feel. **Inter** handles the functional data, providing a systematic and neutral counter-balance for settings, chat, and instructions.

All caps are used strategically for labels and tiles to evoke a technical, authoritative tone. Tracking (letter-spacing) is tightened on large displays for a more aggressive look and loosened on labels for better readability at small sizes.

## Layout & Spacing

This design system utilizes a **fixed-center grid** for the primary game board to ensure focus, while using a **fluid 12-column grid** for the surrounding dashboard and social elements. 

The spacing rhythm is based on an **8px linear scale**. 
- **The Word Grid:** Tiles are separated by an 8px gutter to maintain a tight, cohesive unit.
- **Margins:** A 24px minimum safe area is maintained at the screen edges.
- **Competitive HUD:** The 1v1 status bar (health/score) is pinned to the top with a 48px vertical margin from the grid to separate "gameplay" from "status."

## Elevation & Depth

Depth is achieved through **tonal layering** and **glassmorphism** rather than traditional shadows. 

1.  **Base Layer:** `#121212` (The arena).
2.  **Surface Layer:** `#1e1e1e` (The word grid container and keyboard).
3.  **Overlay Layer:** Semi-transparent glass (Background blur 12px, 20% opacity white border) for modals and pause menus.

Borders are the primary method of defining hierarchy. Elements like active input tiles use a 2px "Electric Purple" border to draw immediate focus without the need for heavy shadows which can feel muddy in dark mode.

## Shapes

The shape language of this design system is "Sharp but Accessible." An **8px (0.5rem)** base radius is applied to all standard components (buttons, cards, tiles). This provides enough rounding to feel modern and premium, but remains sharp enough to feel "fast" and "technical."

- **Tiles:** Precise 8px corners.
- **Action Buttons:** Large 8px rounded rectangles.
- **Interactive Icons:** Housed in subtle circular containers or 8px rounded squares.
- **Progress Bars:** Use a 4px radius for a sleeker, more "needle-like" appearance in high-speed matches.

## Components

### Word Tiles
The core component. Default state features a 2px border (#3f3f46) with no fill. Active/Focused state uses a 2px Electric Purple border. Success states use solid Green (#6aaa64) or Yellow (#c9b458) fills with white text.

### Buttons
- **Primary:** Electric Purple fill, white Montserrat Bold text. 
- **Secondary:** Transparent with a 2px Cyan border. 
- **Interaction:** 8px rounding. On hover, apply a subtle inner glow or increase saturation.

### The HUD (Heads-Up Display)
Contains player avatars, score, and a "Duel Timer." The timer should use a monospace variant of Montserrat or a heavy weight to prevent layout shift as numbers change.

### Glass Modals
Used for "Match Results." These should utilize a backdrop-filter: blur(16px) and a subtle 1px border. The background should be a 60% opaque version of the Neutral color.

### Keyboards
The virtual keyboard uses the Surface color (#1e1e1e) for keys with 4px spacing. Keys should provide haptic-like visual feedback, changing to the state color (Green/Yellow/Dark Gray) once guessed.