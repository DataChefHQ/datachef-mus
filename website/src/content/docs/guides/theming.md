---
title: Theming & Icons
description: Customize MUS colors and icons to match your brand.
---

MUS renders in the light DOM, so its colors are controlled by CSS custom properties with a `--mus-` prefix. Override any of them in your own stylesheet — no config changes needed.

## Quick start

Add this to your global CSS file (e.g. `globals.css`, `app.css`):

```css
:root {
  --mus-primary: #6366f1;           /* your brand color */
  --mus-primary-foreground: #ffffff;
}
```

That's it. Every button, recording indicator, and interactive element picks up the new color.

## All available tokens

| Token | Default (dark) | Controls |
|---|---|---|
| `--mus-primary` | `#f44336` | Buttons, recording dot, active states |
| `--mus-primary-foreground` | `#f5f8fd` | Text/icons on primary color |
| `--mus-background` | `#121b2b` | Dialog and toolbar background |
| `--mus-foreground` | `#f5f8fd` | Primary text |
| `--mus-card` | `#1a2540` | Card / panel background |
| `--mus-card-foreground` | `#f5f8fd` | Text inside cards |
| `--mus-muted` | `rgba(255,255,255,0.06)` | Subtle fill backgrounds |
| `--mus-muted-foreground` | `rgba(255,255,255,0.45)` | Secondary / placeholder text |
| `--mus-accent` | `rgba(255,255,255,0.05)` | Hover fills |
| `--mus-accent-foreground` | `#f5f8fd` | Text on accent |
| `--mus-border` | `rgba(255,255,255,0.08)` | Borders and dividers |
| `--mus-input` | `rgba(255,255,255,0.08)` | Input field borders |
| `--mus-ring` | `#f44336` | Focus ring |
| `--mus-destructive` | `#ef4444` | Destructive / error states |

## Scoped overrides

To style MUS differently on one page without affecting others, scope your overrides to a parent element:

```css
.my-dashboard [data-mus-theme] {
  --mus-primary: #0ea5e9;
  --mus-primary-foreground: #ffffff;
}
```

## Light mode

MUS respects the `theme` prop passed to `MusProvider` (`'light'`, `'dark'`, or `'auto'`). Light-mode defaults are defined separately — override them the same way:

```css
[data-mus-theme="light"] {
  --mus-primary: #4f46e5;
  --mus-background: #ffffff;
  --mus-foreground: #0f172a;
}
```

## Border radius

Roundness is also configurable:

| Token | Default | Controls |
|---|---|---|
| `--mus-radius-xs` | `4px` | Smallest elements (tags, badges) |
| `--mus-radius-sm` | `6px` | Buttons |
| `--mus-radius-md` | `8px` | Inputs, toolbars |
| `--mus-radius-lg` | `12px` | Dialogs |
| `--mus-radius-xl` | `16px` | Large panels |

## Custom icons

Replace any default icon with any React node via the `icons` config on `MusProvider`:

```tsx
import { Star, HeartHandshake, Mic, ThumbsUp, ThumbsDown, Play } from 'lucide-react'

<MusProvider config={{
  ...
  icons: {
    trigger:    <Star size={16} />,
    support:    <HeartHandshake size={16} />,
    voice:      <Mic size={16} />,
    thumbsUp:   <ThumbsUp size={16} />,
    thumbsDown: <ThumbsDown size={16} />,
    video:      <Play size={16} />,
    standalone: <Star size={24} />,   // standalone FAB icon
  },
}}>
```

You can pass any React node — Lucide icons, custom SVGs, emoji, images. Omit any key to keep the default.

| Key | Default icon | Used in |
|---|---|---|
| `trigger` | Lightbulb | Hover trigger button |
| `support` | Slack | Support action |
| `voice` | Mic | Voice action |
| `thumbsUp` | ThumbsUp | Thumbs up action |
| `thumbsDown` | ThumbsDown | Thumbs down action |
| `video` | Youtube | Video action |
| `standalone` | MessageCircle | Standalone FAB button |
