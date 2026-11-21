# EclipseDark

> **Smart Perceptual Dark Mode with URL-Path Rules & OS Sync**

A fast, privacy-first Chrome Manifest V3 extension built by **ARIS PARTY LLC** to outperform **Dark Mode** (`dmghijelimhndkbmpgbldicpogfkceaj`, 2M+ users, 3.6★).

## Competitive Advantages
- Replaces Dark Mode (2M users, 3.6★) with a true popup control panel instead of an opaque toggle
- Solves YouTube & media inversion bugs by exempting video, img, picture, and iframe media surfaces
- Supports URL-path & regex rules (incumbent only allows root-domain exclusions)
- Zero external telemetry or bloat (~45KB vs incumbent 1.19MB)

## Free vs EclipseDark Pro
### Free
- Perceptual smart dark mode that preserves images, videos, canvas, and SVG icons
- Instant popup controls (unlike Dark Mode's missing popup)
- 3 curated presets: OLED Pitch, Slate Dark, and Warm Sepia
- Automatic OS dark-mode synchronization
- Up to 5 exact domain or URL-path exclusion/inclusion rules

### Pro (Monetized via Stripe)
- Unlimited URL-path & regex rules (exclude specific sub-pages, not whole domains)
- Per-site brightness, contrast, sepia & blue-light filter sliders
- Custom automatic sunrise/sunset schedule
- Custom CSS overrides per site & JSON profile import/export

| Plan | Price | Stripe Product / Price ID | Live Checkout Link |
|---|---|---|---|
| Monthly | $2.99/mo | `price_1UeE32FtqvN4GZH3bmFOuFCT` | [Checkout](https://buy.stripe.com/3cI6oH8Zx6xPfGD1Ymg3601) |
| Yearly | $19.99/yr | `price_1UeE3rFtqvN4GZH37RonSCTD` | [Checkout](https://buy.stripe.com/8x228rejR8FX6638mKg360b) |
| Lifetime | $29.99 one-time | `price_1UeE54FtqvN4GZH3KGqGi33t` | [Checkout](https://buy.stripe.com/8x23cv4JhaO51PNeL8g360l) |

- **Stripe Product ID:** `prod_VfZAcEmjgk8g8I`

## Local Installation (Chrome)
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select this repository root

## Verification & Chrome Web Store Packaging
```bash
node tests/verify.mjs .
```
Outputs a store-ready archive at `dist/eclipsedark-extension-v1.0.0.zip`.
