# Rack & Stack Storage Systems — Website & CMS

Production-oriented Next.js App Router website and administration system for Rack & Stack Storage Systems Pvt. Ltd. Public content, contact details, SEO records, product data and enquiries are stored in PostgreSQL and managed through the protected CMS.

## Stack

- Node.js 20+ and npm 10+
- Next.js 16 / React 19 / TypeScript
- Tailwind CSS 4, Framer Motion and Lucide
- PostgreSQL (local or Neon) with Drizzle ORM
- Cloudinary for managed CMS uploads
- Resend for transactional enquiry messages
- bcrypt password hashing and opaque database-backed sessions

## Requirements

1. Node.js 20 or newer and npm.
2. PostgreSQL 15+ locally, or a Neon PostgreSQL connection string.
3. A Cloudinary account with cloud name, API key and API secret for uploads.
4. A Resend account, API key and verified sending domain for email delivery.

The application remains usable locally without Cloudinary or Resend keys: existing CMS image URLs render, uploads report a configuration error, enquiries still persist, and email delivery is skipped safely.

## Installation

```bash
npm install
cp .env.example .env
```

Fill the environment values. Never expose `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, database URLs, or admin credentials through `NEXT_PUBLIC_*` variables.

## Environment variables

- `DATABASE_URL`: primary PostgreSQL connection string. Use the pooled Neon URL for the application.
- `NEON_DATABASE_URL`: optional fallback connection value.
- `NEXT_PUBLIC_SITE_URL`: canonical production origin, without a trailing slash.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: server upload credentials.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`: server email configuration. The from address must be verified by Resend.
- `INQUIRY_NOTIFICATION_EMAIL`: company notification recipient.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: initial Super Admin values used by the seed. Use at least 12 characters and rotate after handover.
- `SESSION_SECRET`: reserved secret for additional signing needs; use 32+ random characters.

## Database setup

Generate migration SQL after schema changes:

```bash
npm run db:generate
```

Apply committed migrations:

```bash
npm run db:migrate
```

Seed verified business details and initial CMS content:

```bash
npm run db:seed
```

The seed is idempotent for content collections. It updates the configured initial administrator password, so remove `ADMIN_PASSWORD` from routine seed environments after the intended bootstrap or keep it in a secure secret manager. Inspect data using:

```bash
npm run db:studio
```

For a disposable local database, `npx drizzle-kit push` may be used during schema prototyping. Production should use committed migrations.

## Admin setup

1. Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` in the server environment.
2. Run `npm run db:migrate` and `npm run db:seed`.
3. Open `/admin/login`.
4. Create individual accounts from **Users**. Roles are `SUPER_ADMIN`, `ADMIN`, and `EDITOR`.
5. Disable or rotate bootstrap access after creating the production owner account.

Sessions use random opaque tokens. Only a SHA-256 token hash is stored in PostgreSQL; the browser receives an HTTP-only, SameSite=Lax cookie. Admin layouts verify the session and active user on the server.

## Development

```bash
npm run dev
```

Open `http://localhost:3000`. Main paths include `/products`, `/services`, `/industries`, `/projects`, `/gallery`, `/blog`, `/contact`, `/request-a-quote`, and `/admin`.

Other useful checks:

```bash
npm run lint
npm run typecheck
npx next typegen
```

## Production build

```bash
npm run build
npm run start
```

Run migrations and seed intentionally before serving the first production release. Do not run seed blindly on every autoscaling application boot because it can reset the bootstrap administrator password when `ADMIN_PASSWORD` remains set.

## Cloudinary

CMS uploads are accepted only for JPEG, PNG, WebP and AVIF files up to 10 MB. Uploads are organized below `rack-stack/<folder>`. The media table stores URL, public ID, alternative text, dimensions, MIME type and size. Deleting a media record through the CMS also destroys the Cloudinary asset when credentials are configured.

Use the Media Library to upload an asset, copy its URL, and assign it in content editors. Cloudinary delivery URLs receive automatic format/quality transformations where used by the helper layer; Next Image provides responsive rendering and layout stability.

## Resend

When an enquiry is stored successfully, the server triggers:

- A company notification containing the submitted requirement.
- A professional customer acknowledgement.

Database persistence does not depend on Resend availability. Email errors are logged without returning secrets or raw provider errors to visitors. Verify the sending domain and use a from address on that domain.

## Content and SEO

Only `PUBLISHED` records without a soft-delete timestamp appear publicly. Admin saves trigger Next path revalidation. Metadata is CMS-driven for products, services, projects, pages and articles. The app generates `/sitemap.xml`, `/robots.txt`, Organization/LocalBusiness data, product markup, breadcrumbs and FAQ/Article markup where applicable.

Changing a product slug records a permanent redirect entry and the old product route resolves to the new destination. Keep canonical URLs aligned with `NEXT_PUBLIC_SITE_URL`.

## Enquiry verification flow

1. Open Home → Products → Heavy Duty Pallet Racking.
2. Select Request Quote and submit valid details.
3. Confirm redirect to `/thank-you`.
4. Open Admin → Inquiries and locate the persisted record.
5. Edit its status and notes, save, then reload to confirm persistence.
6. Open Activity Logs to confirm creation/status events.
7. With Resend configured, check both the company notification and customer acknowledgement inboxes.

## Deployment

### Vercel + Neon

1. Import the repository into Vercel.
2. Add all `.env.example` values as project environment variables.
3. Use the Neon pooled connection for `DATABASE_URL` and require SSL.
4. Run `npm run db:migrate` from a controlled deployment job or workstation.
5. Run `npm run db:seed` once for the initial environment.
6. Deploy. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain and redeploy so canonical metadata is correct.

The app also works in any Node-compatible container. Run migrations as a one-off release task rather than concurrently in every replica.

## Security notes

- Passwords are bcrypt-hashed with cost 12.
- Sessions are server-side, expiring, HTTP-only and revocable.
- Admin route handlers repeat authentication and role checks; middleware is only an early redirect layer.
- Same-origin checks, honeypots and in-memory throttles protect common form abuse. For multi-instance production, replace the in-memory limiter with Redis/Upstash while preserving the API.
- Zod validates authentication and public submissions server-side.
- Drizzle parameterizes SQL. CMS text is rendered as plain React text, not arbitrary HTML.
- Upload type and size checks run on the server.
- Important content and business records are soft-deleted where appropriate.
- Activity records avoid passwords, tokens and customer message bodies.

## Troubleshooting

- **Database connection refused:** verify PostgreSQL is running and `DATABASE_URL` is reachable from the application environment.
- **Migration says an object exists:** do not mix schema push and migrations on the same unmanaged database. Start with an empty database or baseline the migration journal.
- **Cloudinary upload fails:** verify all three server credentials, accepted MIME type and the 10 MB limit.
- **Enquiry saves but no email arrives:** persistence is intentionally independent. Verify the Resend API key, verified sender, notification recipient and provider logs.
- **Admin login fails after seed:** confirm `ADMIN_EMAIL`/`ADMIN_PASSWORD`, ensure the user is active, and remember that login throttling allows five attempts per 15 minutes per address.
- **Images do not render:** use HTTPS Cloudinary/Pexels URLs or add an intentional remote host to `next.config.ts`.
- **Canonical URLs use localhost:** set `NEXT_PUBLIC_SITE_URL` during the build and runtime environment.

## Commands

- `npm run dev` — local development
- `npm run build` — production build
- `npm run start` — production server
- `npm run lint` — ESLint
- `npm run typecheck` — strict TypeScript
- `npm run db:generate` — generate Drizzle migration
- `npm run db:migrate` — apply migrations
- `npm run db:seed` — seed CMS and admin
- `npm run db:studio` — inspect the database
