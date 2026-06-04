# Security and Performance Notes

## Access control

- API routes use server-side session lookup and service-role Supabase access, so every user-owned query must include the authenticated user's UUID.
- Admin API routes require both `role = 'admin'` and a granular permission such as `users:manage`, `cards:manage`, `billing:manage`, `support:manage`, or `roles:manage`.
- Admins cannot suspend themselves or demote their own account through the user-management endpoint.
- Supabase RLS is enabled on all public tables and includes ownership policies for direct authenticated access as defense in depth.

## Performance

- Dashboard layout uses `/api/billing` usage data for card counts instead of fetching all cards during every layout load.
- Common owner/time/status lookups have composite indexes in `db/schema.sql`.
- Admin support ticket filters run in the database before response mapping, with a bounded result set.
- Public Supabase Storage image URLs can be served through `STORAGE_CDN_ORIGIN`; the database keeps canonical Supabase URLs while API responses rewrite them to the CDN origin.
- Cloudflare Worker source for `cdn.jostap.com` lives in `cloudflare/storage-cdn-worker.js` with deploy config in `wrangler.storage-cdn.toml`.

## Operational follow-up

- Reapply `db/schema.sql` to Supabase after deployment so the new indexes, RLS policies, and expanded admin permissions exist in the database.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Do not expose it with a `NEXT_PUBLIC_` prefix.
