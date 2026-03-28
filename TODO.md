# CIPHER — TODO

## Immediate Fixes

- [ ] Apply `<Suspense>` wrapper around `<LoginForm />` in `src/app/login/page.tsx`
  - `LoginForm` uses `useSearchParams()` which requires a Suspense boundary
  - Without it, `/login` throws a 500 in some Next.js builds

## Server & Environment

- [ ] Restart dev server after `.env.local` update (`npm run dev`)
- [ ] Verify `/login` and `/dashboard` load without 500 errors

## Dashboard

- [ ] Update `src/app/dashboard/page.tsx` to query exact confirmed tables:
  - `creator_wallets` → `total_earnings`, `balance`, `referral_income`
  - `fan_codes` → filter by `creator_id`
  - `transactions` → filter by `creator_id`, show `fan_code`, `amount`, `type`, `status`
  - Remove generic table-probing fallback logic

## Supabase

- [ ] Add RLS SELECT policies for the 3 new tables:
  ```sql
  CREATE POLICY "creator sees own wallet"
    ON creator_wallets FOR SELECT USING (creator_id = auth.uid());

  CREATE POLICY "creator sees own fan codes"
    ON fan_codes FOR SELECT USING (creator_id = auth.uid());

  CREATE POLICY "creator sees own transactions"
    ON transactions FOR SELECT USING (creator_id = auth.uid());
  ```
- [ ] Seed test data (wallet row, fan codes, transactions) for the authenticated test user

## Git / Deploy

- [ ] Push latest commits to `MansaMusaMogule86/cipher` (main)
- [ ] Add `.env.example` to git (currently blocked by `*.env*` in `.gitignore` — update pattern if needed)

## Future Features

- [ ] Creator application review flow (admin view)
- [ ] Fan code generation logic
- [ ] Payout request flow
- [ ] Email notifications for application status updates
