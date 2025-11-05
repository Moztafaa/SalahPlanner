# Deployment Guide - MonsterASP.net

This guide will help you deploy your Salah Planner API to MonsterASP.net using GitHub Actions.

## Problem Solved

The error "Site directory |wwwroot path is not empty" occurs when deployment artifacts (the `publish` folder) are committed to your repository. MonsterASP expects to deploy into an empty wwwroot directory.

## Solution Overview

1. ✅ **Removed `publish` folder from Git tracking** - Build artifacts should never be in version control
2. ✅ **Updated .gitignore** - Prevents future publish folders from being committed
3. ✅ **Created GitHub Actions workflow** - Automates building and deployment

## Setup Instructions

### Step 1: Remove the publish folder from Git

Run these commands in your terminal:

```bash
cd /home/mostafa/Documents/Projects/SalahPlanner-FullStack/PrayerTime-Tasker

# Remove the publish folder from Git tracking (but keep it locally)
git rm -r --cached src/PrayerTasker.Api/publish

# Commit the changes
git add .gitignore .github/
git commit -m "Remove publish folder from tracking and add CI/CD workflow"
```

### Step 2: Configure GitHub Secrets

You need to add your MonsterASP FTP credentials as secrets in your GitHub repository:

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these three secrets:

   - **FTP_SERVER**: Your MonsterASP FTP server address (e.g., `ftp.monsteraps.net` or your specific domain)
   - **FTP_USERNAME**: Your FTP username provided by MonsterASP
   - **FTP_PASSWORD**: Your FTP password provided by MonsterASP

### Step 3: Push to GitHub

```bash
# Push your changes to GitHub
git push origin main
```

The GitHub Actions workflow will automatically:
- Build your .NET 9.0 API
- Publish the application
- Clean the wwwroot directory on MonsterASP
- Deploy the new build via FTP

### Step 4: Monitor Deployment

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. You'll see your deployment workflow running
4. Click on it to see detailed logs

## Manual Deployment Trigger

You can manually trigger a deployment:

1. Go to **Actions** tab in your GitHub repository
2. Select **Deploy API to MonsterASP** workflow
3. Click **Run workflow** button
4. Select the branch and click **Run workflow**

## Workflow Configuration

The workflow file is located at: `.github/workflows/deploy-api.yml`

It triggers on:
- Pushes to the `main` branch (when `src/**` files change)
- Manual trigger via GitHub Actions UI

## Database Configuration

Don't forget to update your connection string in MonsterASP:

1. Log into your MonsterASP control panel
2. Update the connection string in your `appsettings.json` or use environment variables
3. Ensure your SQL Server database is accessible from MonsterASP servers

### Option 1: Update appsettings.json before deployment

Create a separate `appsettings.Production.json` file that will be used in production.

### Option 2: Use Environment Variables (Recommended)

Configure environment variables in MonsterASP control panel for sensitive data like:
- Database connection strings
- JWT secrets
- API keys

## Troubleshooting

### Deployment fails with "Could not connect to FTP server"
- Verify your FTP credentials in GitHub Secrets
- Check if MonsterASP FTP service is running
- Ensure your FTP server address is correct

### Application doesn't start after deployment
- Check the logs in MonsterASP control panel
- Verify database connection string is correct
- Ensure all required environment variables are set
- Check that .NET 9.0 runtime is available on MonsterASP

### "Site directory |wwwroot path is not empty" error persists
- Ensure you've removed the publish folder from Git: `git rm -r --cached src/PrayerTasker.Api/publish`
- Verify the publish folder is listed in .gitignore
- Check that `dangerous-clean-slate: true` is in the workflow file (it cleans wwwroot before deploying)

## Next Steps

After successful deployment:

1. Test your API endpoints at your MonsterASP domain
2. Update your Angular frontend to point to the production API URL
3. Consider setting up staging and production environments
4. Add health check endpoints for monitoring

## Useful Commands

```bash
# Check what files are tracked by Git
git ls-files | grep publish

# If publish folder is still tracked, force remove it
git rm -rf --cached src/PrayerTasker.Api/publish
git commit -m "Force remove publish folder"
git push
```

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [FTP-Deploy-Action Documentation](https://github.com/SamKirkland/FTP-Deploy-Action)
- [.NET Deployment Best Practices](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/)

---

Built with ❤️ for the Muslim community

