# RW PC Trading Web System

Complete vanilla JavaScript + Supabase system for RW PC Trading.

## What Is Included

- Product catalog connected to Supabase products, categories, images, inventory, cart, reservations, and PC Builder.
- Customer account flow using Supabase Auth.
- Persistent per-user cart with stock validation.
- Reservation workflow with automatic 20% deposit calculation, manual payment proof upload, and admin verification.
- Inventory logs and automatic stock deduction when a reservation is approved.
- Admin panel for dashboard, products, archived products, categories, inventory, services, reservations, payment verification, customers, reviews, feedback, users/staff, and settings.
- PC Builder with compatibility checks for CPU socket, RAM type, PSU wattage, case form factor, cooler socket, GPU clearance, stock, total price, and wattage.
- Supabase Storage upload support for product images, service images, review proof images, payment proofs, and profile images.

## Project Structure

```text
.
├── admin.html
├── cart.html
├── index.html
├── login.html
├── pc-builder.html
├── products.html
├── profile.html
├── register.html
├── reservations.html
├── reviews.html
├── services.html
├── css/
│   └── styles.css
├── js/
│   ├── api/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   ├── config.js
│   ├── env.example.js
│   ├── env.js
│   └── supabaseClient.js
└── sql/
    └── schema.sql
```

## Setup

1. Create a Supabase project.
2. Open Supabase SQL Editor and run [schema.sql](sql/schema.sql).
3. In Supabase Authentication settings, enable Email/Password signups.
4. Optional: after creating at least one user account, run [sample-data.sql](sql/sample-data.sql) for a larger demo catalog, services list, and approved customer reviews.
5. Open [env.js](js/env.js) and replace:

```js
export const ENV = {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-ANON-KEY"
};
```

6. Register your first user through [register.html](register.html).
7. Promote that user to admin in the Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```

8. Open [index.html](index.html) through a local web server.

## Local Preview

Because this app uses JavaScript modules, run it over local HTTP instead of double-clicking the file.

```powershell
python -m http.server 5173
```

Then visit:

```text
http://localhost:5173
```

## Business Workflow

1. Customer registers or logs in.
2. Customer browses products or uses PC Builder.
3. Customer adds available products to cart.
4. Customer submits a pickup reservation with a required deposit calculated at 20% of the cart total.
5. Customer uploads GCash, Maya, bank transfer, credit card, or e-wallet proof.
6. Admin reviews payment proof manually.
7. Approval calls the Supabase inventory function and deducts stock once.
8. Customer sees updated reservation status.
9. Staff marks reservation as Ready for Pickup or Claimed.

## Important Notes

- Customers see stock status only: `Available`, `Limited Stock`, or `Out of Stock`.
- Admin/staff users can see exact stock in inventory screens.
- Out-of-stock products cannot be added to cart.
- Payment approval is manual; there is no payment gateway.
- Pickup-only workflow is intentional.
- The seeded products and images are starter records. Replace them in the admin panel.
- [sample-data.sql](sql/sample-data.sql) is idempotent for matching names/messages, so it is safe to re-run while developing.
- Sample reviews stay linked to customer profiles. If there are no profiles yet, the review rows are skipped until you create an account and run the sample data again.

## Compatibility JSON Examples

CPU:

```json
{ "cpu_socket": "AM4" }
```

Motherboard:

```json
{ "cpu_socket": "AM4", "ram_type": "DDR4", "form_factor": "mATX" }
```

RAM:

```json
{ "ram_type": "DDR4", "capacity_gb": 16 }
```

PSU:

```json
{ "max_wattage": 650 }
```

Case:

```json
{ "supported_form_factors": ["mATX", "Mini-ITX"], "max_gpu_length_mm": 320 }
```

CPU Cooler:

```json
{ "supported_sockets": ["AM4", "AM5", "LGA1700"] }
```
