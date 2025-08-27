@echo off
REM SmartTask AI - GitHub Setup Script (Windows)
REM This script helps you set up your GitHub repository

echo 🚀 Setting up SmartTask AI for GitHub...

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed. Please install Git first.
    pause
    exit /b 1
)

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo ❌ Not in a git repository. Please run 'git init' first.
    pause
    exit /b 1
)

REM Get repository information
echo 📝 Please provide the following information:
set /p GITHUB_USERNAME="GitHub username: "
set /p REPO_NAME="Repository name (default: SMART-TASK-AI2): "
if "%REPO_NAME%"=="" set REPO_NAME=SMART-TASK-AI2

echo 🔧 Updating configuration files...

REM Update dependabot.yml
powershell -Command "[System.Text.RegularExpressions.Regex]::Escape('your-username') | ForEach-Object { (Get-Content .github/dependabot.yml) -replace $_, '%GITHUB_USERNAME%' | Set-Content .github/dependabot.yml -Encoding UTF8 }"

REM Update SECURITY.md
powershell -Command "[System.Text.RegularExpressions.Regex]::Escape('your-email@example.com') | ForEach-Object { (Get-Content SECURITY.md) -replace $_, '%GITHUB_USERNAME%@example.com' | Set-Content SECURITY.md -Encoding UTF8 }"

REM Update CONTRIBUTING.md
powershell -Command "[System.Text.RegularExpressions.Regex]::Escape('your-username') | ForEach-Object { (Get-Content CONTRIBUTING.md) -replace $_, '%GITHUB_USERNAME%' | Set-Content CONTRIBUTING.md -Encoding UTF8 }"

REM Update README.md
powershell -Command "[System.Text.RegularExpressions.Regex]::Escape('your-username') | ForEach-Object { (Get-Content README.md) -replace $_, '%GITHUB_USERNAME%' | Set-Content README.md -Encoding UTF8 }"
powershell -Command "[System.Text.RegularExpressions.Regex]::Escape('your-email@example.com') | ForEach-Object { (Get-Content README.md) -replace $_, '%GITHUB_USERNAME%@example.com' | Set-Content README.md -Encoding UTF8 }"

echo ✅ Configuration files updated!

echo.
echo 📋 Next steps:
echo 1. Create a new repository on GitHub:
echo    - Go to https://github.com/new
echo    - Repository name: %REPO_NAME%
echo    - Description: SmartTask AI - Full-stack authentication system
echo    - Make it Public or Private (your choice)
echo    - Don't initialize with README, .gitignore, or license (we already have them)
echo.
echo 2. Add the remote origin:
echo    git remote add origin https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git
echo.
echo 3. Push to GitHub:
echo    git branch -M main
echo    git push -u origin main
echo.
echo 4. Enable GitHub Actions:
echo    - Go to your repository on GitHub
echo    - Click on 'Actions' tab
echo    - Enable GitHub Actions
echo.
echo 5. Set up branch protection (recommended):
echo    - Go to Settings ^> Branches
echo    - Add rule for 'main' branch
echo    - Require pull request reviews
echo    - Require status checks to pass
echo.
echo 🎉 Your SmartTask AI project is ready for GitHub!
pause
