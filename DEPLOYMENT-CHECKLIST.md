# Deployment Checklist - Gemini API Fix

## ⚠️ Current Issue

The deployed code is using **old Gemini implementation** with:
- ❌ Old models: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash-exp`
- ❌ Old endpoint: `/v1beta/` (beta)
- ❌ SDK-based implementation (not REST API)

The **updated code** uses:
- ✅ New models: `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.0-flash`, etc.
- ✅ Stable endpoint: `/v1/`
- ✅ REST API directly (no SDK)

## 🔄 Steps to Fix

### 1. Verify Local Code is Updated

Check that `lib/ai/gemini.ts` has the correct models:
```typescript
const models = [
  'gemini-2.5-flash',        // Latest and most capable
  'gemini-2.5-flash-lite',   // Latest lightweight version
  'gemini-2.0-flash',        // Stable and reliable
  // ... etc
]
```

### 2. Commit and Push Changes

```bash
# Check what files have changed
git status

# Add the updated files
git add lib/ai/gemini.ts
git add README.md
git add GEMINI-QUOTA-FIX.md

# Commit
git commit -m "Fix: Update Gemini API to use verified models and REST API"

# Push to trigger deployment
git push origin main
```

### 3. Force Redeploy on Vercel

**Option A: Via Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Deployments** tab
4. Find the latest deployment
5. Click the three dots (⋯) menu
6. Click **Redeploy**
7. ✅ Check "Use existing Build Cache" = **UNCHECKED** (important!)
8. Click **Redeploy**

**Option B: Via Git Push**
- Make a small change (add a comment) and push again
- This forces a fresh build

### 4. Verify Deployment

After redeploy, check the logs. You should see:
```
[Gemini] Trying model: gemini-2.5-flash
```

**NOT:**
```
[Gemini] Trying model: gemini-1.5-flash  ❌
```

### 5. Clear Build Cache (if needed)

If the issue persists:

**On Vercel:**
1. Go to **Settings** → **General**
2. Scroll to **Build & Development Settings**
3. Clear build cache or disable caching temporarily

**Or via CLI:**
```bash
vercel --force
```

## 🔍 How to Verify the Fix Worked

### Check Logs
After redeploy, the logs should show:
- ✅ Models: `gemini-2.5-flash`, `gemini-2.5-flash-lite`, etc.
- ✅ Endpoint: `https://generativelanguage.googleapis.com/v1/models/...`
- ✅ No `[GoogleGenerativeAI Error]` format (that's SDK format)

### Test the API
Make a test request and check:
- Logs show new model names
- No 404 errors (models are verified working)
- Better error messages if quota issues occur

## 📝 Additional Notes

### If You Still See Old Models After Redeploy:

1. **Check Build Output**
   - Look at Vercel build logs
   - Verify `lib/ai/gemini.ts` is being included in the build

2. **Check for Multiple Files**
   - Ensure there's only one `gemini.ts` file
   - Check for any `.next` cache issues locally

3. **Environment Variables**
   - Ensure `GOOGLE_AI_API_KEY` is set in Vercel
   - Check it's the same key that works locally

4. **Hard Refresh**
   - Sometimes Vercel serves cached responses
   - Wait a few minutes after deploy
   - Try a different endpoint or add a query parameter

## ✅ Success Indicators

After successful deployment, you should see:
- ✅ New model names in logs (`gemini-2.5-flash`, etc.)
- ✅ `/v1/` endpoint (not `/v1beta/`)
- ✅ Better error handling for quota issues
- ✅ Automatic fallback to next model on 429 errors

## 🚨 If Quota Issues Persist

Even with the new code, if you're on the free tier and have exceeded limits:
1. Check quota: https://ai.google.dev/usage
2. Wait for quota reset (usually monthly)
3. Consider upgrading: https://ai.google.dev/pricing

The new code will automatically try multiple models, which may help if some models have different quota limits.

