# Quick Deployment Steps for MonsterASP

## ✅ Changes Made

1. **Created GitHub Actions workflow** (`.github/workflows/deploy-api.yml`)
   - Automatically builds and deploys your API to MonsterASP
   - Uses FTP deployment with clean-slate option to fix the "wwwroot not empty" error

2. **Updated .gitignore**
   - Added `[Pp]ublish/` and `**/publish/` to prevent build artifacts from being committed

3. **Updated appsettings.json**
   - Added MonsterASP database connection string

4. **Created DEPLOYMENT.md**
   - Full deployment documentation with troubleshooting steps

## 🚀 Next Steps - DO THESE NOW:

### 1. Configure GitHub Secrets (IMPORTANT!)

Before pushing, you MUST add FTP credentials to your GitHub repository:

1. Go to your GitHub repository: https://github.com/YOUR_USERNAME/YOUR_REPO
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these 3 secrets:

   **Secret Name**: `FTP_SERVER`
   **Value**: Your MonsterASP FTP server (e.g., `ftp.monsteraps.net`)

   **Secret Name**: `FTP_USERNAME`
   **Value**: Your FTP username from MonsterASP

   **Secret Name**: `FTP_PASSWORD`
   **Value**: Your FTP password from MonsterASP

### 2. Push to GitHub

```bash
git push origin main
```

### 3. Monitor Deployment

1. Go to your GitHub repository
2. Click the **Actions** tab
3. Watch the "Deploy API to MonsterASP" workflow run
4. If it succeeds ✅, your API is live!
5. If it fails ❌, click on it to see the error logs

## 🔍 Verify Deployment

Once the workflow completes:

1. Visit your MonsterASP domain (e.g., `https://yourdomain.monsteraps.net`)
2. Test an API endpoint like: `https://yourdomain.monsteraps.net/api/prayertime`
3. Check that the API responds correctly

## ⚠️ Security Note

Your database password is now in `appsettings.json` which is committed to Git. For better security, consider:

1. Using environment variables in MonsterASP control panel
2. Or using `appsettings.Production.json` with a .gitignore entry
3. Moving sensitive data to GitHub Secrets and using configuration transformations

## 📝 Manual Trigger

You can also manually trigger deployment:

1. Go to **Actions** tab in GitHub
2. Select **Deploy API to MonsterASP**
3. Click **Run workflow**
4. Select branch `main` and click **Run workflow**

## 🆘 If You Still Get "wwwroot not empty" Error

The workflow now uses `dangerous-clean-slate: true` which automatically cleans the wwwroot directory before deployment. This should fix the issue.

If it persists:
1. Manually delete everything in your MonsterASP wwwroot folder via FTP or control panel
2. Re-run the GitHub Actions workflow

---

**Ready to deploy?** 
1. Add the 3 GitHub secrets
2. Run: `git push origin main`
3. Watch it deploy automatically! 🚀

