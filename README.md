# MoveInReport — Move-In / Move-Out Inspection Report Maker (landlords & property managers)

**Live:** https://makavelimachiavelli.github.io/moveinreport/

## What it is
A free, 100% client-side condition-inspection report maker: areas/rooms with condition ratings, notes, and **photos that never leave the device** (compressed in-browser, embedded into a print/PDF-ready report with signature lines). PRO ($12.99 one-time): saved reports, standard 12-area apartment checklist template, landlord/company branding, no footer credit.

## Buyer persona
- **Who:** small landlords and independent property managers (the RentSheet cluster — same funnel), plus room-rental hosts documenting condition.
- **Pain:** inspection apps are $12/mo subscriptions (after free tiers) or $4.99/report; DIY = Word doc + pasted photos that takes an hour. Deposit disputes are won/lost on condition documentation.
- **Why pay $12.99 once:** one month of RentCheck ≈ this tool forever; offline + privacy angle (unit photos never uploaded to anyone's cloud).
- **Where they hang out:** r/Landlord, r/PropertyManagement, landlord FB groups — same watering holes as RentSheet (cross-linked).

## Demand evidence (per REVENUE GATES)
- Paid competitors: RentCheck (freemium, ~$12/mo), Chapps Rental Inspector, myInspections, Property Inspect ($49–299/mo tiers), SnapInspect, PropertyLenz = 6+; market pricing umbrella $4.99/report → $299/mo.

## Monetization
Standard code-gate PRO ($12.99; card link via LemonSqueezy/Gumroad per PAYMENTS.md + QR fallback). Same working pay-block pattern as the rest of the portfolio.

## Tech
Pure static vanilla JS; photos compressed to ≤800px JPEG (canvas) and kept in localStorage (with quota-safe draft fallback that drops photos rather than failing). jsdom suite: **23/23** — caught a real stale-render bug (PRO unlock not re-rendering footer) pre-deploy.

## Deploy
```bash
../toolkit/deploy-pages.sh . moveinreport
```

## Owner TODO (Allen, ~5 min)
Swap `pay-qr.svg`, set `PRO_CODES` in `app.js`, add card-link URL to `#payLink`. Cross-linked from hub + RentSheet (landlord cluster).
