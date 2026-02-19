# SocialProofToast — Usage Guide

## Quick Setup

Import the component in your `App.jsx` (or any layout file):

```jsx
import SocialProofToast from './components/SocialProofToast';

function App() {
  return (
    <>
      {/* ... your existing routes/pages ... */}
      <SocialProofToast />
    </>
  );
}
```

That's it — it self-manages all state, timers, and animations.

---

## Configuration (inside `SocialProofToast.jsx`)

| Key | Default | Description |
|-----|---------|-------------|
| `initialDelay` | `6000` ms | Wait before FIRST toast appears |
| `displayDuration` | `6500` ms | How long toast stays on screen |
| `minInterval` | `15000` ms | Shortest gap between toasts |
| `maxInterval` | `40000` ms | Longest gap (creates random feel) |
| `calculatorUrl` | `/investment-calculator` | Page to navigate on click |

---

## Notification Segments

| Segment | Sizes | Count |
|---------|-------|-------|
| Entry / Budget buyers | 50 sq yd, 60 sq yd | 10 |
| Mid segment buyers | 100 sq yd, 150 sq yd | 12 |
| Premium + NRI buyers | 200 sq yd, 300 sq yd | 8 |
| **Total** | | **30** |

---

## How It Works
- Waits `initialDelay` ms after mount (not page load) before showing first toast
- Picks notifications in a **shuffled random order** (no repetition until all 30 shown)
- Shows each toast for `displayDuration` ms, then smoothly slides out
- Waits a **random interval** between `minInterval` and `maxInterval` before next toast
- Clicking the toast navigates to `calculatorUrl`
- Clicking ✕ dismisses and schedules the next one
