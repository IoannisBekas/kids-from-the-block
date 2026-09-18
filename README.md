# Kids from the block

Website for **Kids from the block**, a coffee & street-brunch spot at Αγίου Δημητρίου 83, Ταμπούρια, Πειραιάς (211 418 4223).

It's a static single page with no build step. Plain HTML/CSS/JS, plus Tailwind, GSAP, Lenis and Lucide from CDNs.

## Features
- Launchpad hero with a starfield, the logo in a porthole, a spinning badge and a delivery ticker
- A scroll-driven "Anatomy of a Tower" scene where the pancake stack explodes into its layers
- A filterable, searchable menu of 32 collectible cards
- Craving Engine modal with a sugar dial, milk orbit, extras and notes, and a live price
- A cart drawer with delivery/take-away, a free-delivery tracker, and a WhatsApp order formatted in Greek (or call / copy)
- A radar map, opening hours with a live open/closed status, and Instagram and e-food links
- Mobile bottom dock, reduced-motion support, and optional synth sound

## Editing the menu & shop details
Everything editable lives in **`assets/js/menu-data.js`**:
- `KFTB_CONFIG`: phone, WhatsApp number, min order, delivery fee, free-delivery threshold, hours, Instagram, e-food link
- `KFTB_OPTIONS`: customization groups and surcharges
- `KFTB_MENU`: products (name, price, description, tags, illustration recipe, options)

Lines marked `// VERIFY` are placeholders. Confirm them before promoting the site: prices, hours, delivery fee, WhatsApp number, Instagram handle and e-food URL.

## Run locally
```bash
python -m http.server 5391
```
Then open http://localhost:5391.
