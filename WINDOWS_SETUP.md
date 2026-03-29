# CIPHER ANALYTICS SETUP - WINDOWS GUIDE

**For Windows users** - Follow these instructions to set up the analytics system.

---

## 🪟 QUICK START FOR WINDOWS

You have **3 options** to run the setup:

### Option 1: PowerShell (Recommended)
```powershell
# Open PowerShell in your project folder
# Right-click in folder → "Open PowerShell window here"

# Run the setup script
.\scripts\setup-analytics.ps1
```

### Option 2: Command Prompt
```cmd
# Open Command Prompt in your project folder
# Type 'cmd' in the address bar of File Explorer

# Run the setup script
scripts\setup-analytics.bat
```

### Option 3: Manual Installation (If scripts don't work)
```cmd
# Install packages one by one
npm install posthog-js
npm install resend
npm install recharts
npm install @radix-ui/react-tabs @radix-ui/react-dialog
```

---

## 📋 STEP-BY-STEP SETUP

### 1. Open Your Project Folder
- Navigate to: `C:\Users\mehdi\Desktop\DESKTOP\cipher-analytics`
- Or wherever you extracted the analytics files

### 2. Open PowerShell or Command Prompt
**PowerShell (Recommended):**
- In File Explorer, hold `Shift` and right-click in the folder
- Select "Open PowerShell window here"

**Command Prompt:**
- In File Explorer address bar, type `cmd` and press Enter
- Or type `powershell` for PowerShell

### 3. Run the Setup Script

**If using PowerShell:**
```powershell
.\scripts\setup-analytics.ps1
```

**If using Command Prompt:**
```cmd
scripts\setup-analytics.bat
```

**If you get "cannot be loaded" error in PowerShell:**
```powershell
# Run this first to allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then run the setup
.\scripts\setup-analytics.ps1
```

### 4. Configure API Keys

After the script runs, you need to add your API keys to `.env.local`:

**Open `.env.local` in any text editor (Notepad, VS Code, etc.)**

Add your keys:
```env
NEXT_PUBLIC_POSTHOG_KEY=phc_your_actual_key_here
RESEND_API_KEY=re_your_actual_key_here
```

**Where to get keys:**
- PostHog: https://posthog.com → Create account → Copy project API key
- Resend: https://resend.com → Create account → Copy API key

### 5. Run Database Migration

```cmd
npx supabase db push
```

If you don't have Supabase CLI installed:
```cmd
npm install -g supabase
supabase login
supabase db push
```

### 6. Start Development Server

```cmd
npm run dev
```

### 7. Access Command Center

Open your browser and go to:
```
http://localhost:3000/admin/command-center
```

**First make yourself admin in Supabase:**
1. Go to https://supabase.com/dashboard
2. Open your CIPHER project
3. Go to "Table Editor"
4. Open `profiles` table
5. Find your user
6. Change `role` to `admin`

---

## 🐛 TROUBLESHOOTING

### "PowerShell script cannot be loaded"
**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "npm is not recognized"
**Solution:** Install Node.js from https://nodejs.org
- Download the LTS version
- Run the installer
- Restart your terminal

### "Cannot find module 'posthog-js'"
**Solution:** The packages didn't install properly
```cmd
# Delete node_modules and package-lock.json
rmdir /s /q node_modules
del package-lock.json

# Reinstall
npm install
npm install posthog-js resend recharts
```

### ".env.local not created"
**Solution:** Create it manually
1. Copy `.env.example` to `.env.local`
2. Or create new file `.env.local` with the template below

**Template:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://atrlfehyvcaqmathdrnj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0cmxmZWh5dmNhcW1hdGhkcm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTQyNDQsImV4cCI6MjA4OTQ5MDI0NH0.ojjJVD3bsh4C6W04ZxGEeyAPn0_A2WePuqIwgiERYxc
RESEND_API_KEY=re_ZUQwqBRR_4hNootnsL1GhzCkyw24xQhRT
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-project-key-here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### "Supabase command not found"
**Solution:** Install Supabase CLI
```cmd
npm install -g supabase
```

### Port 3000 already in use
**Solution:** Use a different port
```cmd
npm run dev -- -p 3001
```
Then access: `http://localhost:3001/admin/command-center`

---

## 📁 FILE LOCATIONS (WINDOWS PATHS)

```
C:\Users\mehdi\Desktop\DESKTOP\cipher-analytics\
├── lib\analytics\posthog.ts
├── lib\notifications\resend.ts
├── hooks\useTracking.ts
├── app\admin\command-center\page.tsx
├── supabase\migrations\20240329000000_analytics_system.sql
├── scripts\
│   ├── setup-analytics.ps1   ← PowerShell script
│   ├── setup-analytics.bat   ← Batch script
│   └── setup-analytics.sh    ← Linux/Mac (ignore on Windows)
├── .env.local                ← Your API keys go here
├── .env.example
├── README.md
├── ANALYTICS_SETUP.md
├── TODO_STATUS.md
└── PROJECT_OVERVIEW.md
```

---

## ✅ VERIFICATION CHECKLIST

After setup, verify everything works:

**1. Check Packages Installed:**
```cmd
npm list posthog-js resend
```
Should show both packages installed.

**2. Check .env.local:**
```cmd
type .env.local
```
Should show your environment variables.

**3. Check API Keys:**
- PostHog key starts with `phc_`
- Resend key starts with `re_`

**4. Test Dev Server:**
```cmd
npm run dev
```
Should start without errors.

**5. Test Command Center:**
- Go to `http://localhost:3000/admin/command-center`
- Should load (might be empty data initially)

---

## 🎯 WHAT TO DO AFTER SETUP

1. **Sign up for PostHog**
   - https://posthog.com
   - Free tier: 1 million events/month
   - Copy your project API key

2. **Sign up for Resend**
   - https://resend.com
   - Free tier: 100 emails/day
   - Copy your API key

3. **Add keys to .env.local**
   - Edit the file
   - Replace placeholder keys
   - Save the file

4. **Run the migration**
   - `npx supabase db push`
   - Creates all database tables

5. **Make yourself admin**
   - In Supabase dashboard
   - Edit your user profile
   - Set role to `admin`

6. **Start the server**
   - `npm run dev`
   - Access command center

7. **Start tracking!**
   - Every action is now being tracked
   - Check PostHog dashboard
   - Check command center

---

## 🚀 YOU'RE READY!

Once setup is complete, you have:
- ✅ PostHog tracking every action
- ✅ Resend sending beautiful emails
- ✅ Command center showing real-time data
- ✅ Complete visibility into CIPHER

**Welcome to GOD MODE! 👑**

---

## 📞 NEED HELP?

**Common Issues:**
- Node.js not installed → https://nodejs.org
- PowerShell script blocked → Run as admin or change execution policy
- Packages not installing → Delete node_modules and reinstall
- Database migration fails → Check Supabase credentials

**Documentation:**
- Full setup guide: `ANALYTICS_SETUP.md`
- Project status: `TODO_STATUS.md`
- Parent overview: `PROJECT_OVERVIEW.md`

---

**Built for Windows by Claude** ✨
