# CIPHER — TODO

## ✅ Completed (God Mode AI Suite)

### AI Core Infrastructure
- [x] AI Router with optimized models (GPT-4o-mini, Gemini Flash, Claude)
- [x] Cost optimization: 84% cheaper than old stack ($50 → $8/month)

### AI API Endpoints
- [x] `POST /api/ai/onboarding/analyze` — Smart creator profiling
- [x] `POST /api/ai/content/ideas` — 7-day content calendar
- [x] `GET /api/ai/fans/personas` — Fan segmentation (Whale/Loyal/At-Risk/New/Lurker)
- [x] `POST /api/ai/monetization/dynamic-pricing` — Optimal price recommendations
- [x] `GET /api/ai/copilot/daily-brief` — Morning AI briefing

### AI Dashboard Widgets
- [x] `CipherRadioCompact` — Fixed sidebar player with expand/collapse
- [x] `DailyBriefWidget` — AI co-pilot morning briefing
- [x] `ContentIdeasWidget` — One-click content generation
- [x] `FanPersonasWidget` — Visual fan segments with engagement strategies
- [x] `DynamicPricingWidget` — AI price optimizer with launch/standard pricing

### Original Features
- [x] Apply `<Suspense>` wrapper around `<LoginForm />`
- [x] Restart dev server after `.env.local` update
- [x] Dashboard queries confirmed tables
- [x] RLS SELECT/ALL policies created
- [x] `.env.example` updated with all required env vars

---

## 🔄 Remaining Tasks

### Database
- [ ] Run `005_rls_core_tables.sql` in Supabase SQL Editor (if not done)
- [ ] Seed test data for authenticated test user

### Deployment
- [ ] Add `OPENROUTER_API_KEY` to Vercel production env (ONLY ONE NEEDED NOW)
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel production env
- [ ] Redeploy after env vars added
- [x] Removed Anthropic dependency - all AI via OpenRouter

### Future AI Features
- [ ] AI Onboarding Wizard UI — Step-by-step creator setup
- [ ] AI Caption Generator Modal — Social media captions
- [ ] AI Auto-Reply Suggestions — Draft fan message responses
- [ ] AI Weekly Email Reports — Automated performance summaries
- [ ] AI Smart Scheduling — Auto-post at optimal times

### Core Features
- [ ] Creator application review flow (admin view)
- [ ] Fan code generation logic enhancement
- [ ] Payout request flow polish
- [ ] Email notifications for application status updates

---

## 🚀 Quick Win Checklist for Production

1. [ ] Add env vars to Vercel dashboard
2. [ ] Redeploy: `vercel --prod`
3. [ ] Test `/api/debug/ai-status` returns all green
4. [ ] Create test creator account
5. [ ] Verify AI daily brief generates
6. [ ] Verify content ideas generate and save to calendar

---

## 💡 Feature Ideas Backlog

- AI Burn Message Generator — Create urgency for limited content
- AI Newsletter Writer — Draft weekly fan newsletters
- AI Collaboration Matcher — Find compatible creators to collab
- AI Trend Predictor — Predict viral content before it happens
- AI Voice Clone — Generate audio messages in creator's voice
