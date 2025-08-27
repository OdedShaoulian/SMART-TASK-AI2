#!/bin/bash

# SmartTask AI - GitHub Setup Script
# This script helps you set up your GitHub repository

echo "🚀 Setting up SmartTask AI for GitHub..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please run 'git init' first."
    exit 1
fi

# Get repository information
echo "📝 Please provide the following information:"
read -p "GitHub username: " GITHUB_USERNAME
read -p "Repository name (default: SMART-TASK-AI2): " REPO_NAME
REPO_NAME=${REPO_NAME:-SMART-TASK-AI2}

# Update files with GitHub username
echo "🔧 Updating configuration files..."

# Detect OS for sed compatibility
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    SED_CMD="sed -i ''"
else
    # Linux
    SED_CMD="sed -i"
fi

# Update dependabot.yml
$SED_CMD "s/your-username/$GITHUB_USERNAME/g" .github/dependabot.yml

# Update SECURITY.md
$SED_CMD "s/your-email@example.com/$GITHUB_USERNAME@example.com/g" SECURITY.md

# Update CONTRIBUTING.md
$SED_CMD "s/your-username/$GITHUB_USERNAME/g" CONTRIBUTING.md

# Update README.md
$SED_CMD "s/your-username/$GITHUB_USERNAME/g" README.md
$SED_CMD "s/your-email@example.com/$GITHUB_USERNAME@example.com/g" README.md

echo "✅ Configuration files updated!"

# Create remote repository instructions
echo ""
echo "📋 Next steps:"
echo "1. Create a new repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Repository name: $REPO_NAME"
echo "   - Description: SmartTask AI - Full-stack authentication system"
echo "   - Make it Public or Private (your choice)"
echo "   - Don't initialize with README, .gitignore, or license (we already have them)"
echo ""
echo "2. Add the remote origin:"
echo "   git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
echo ""
echo "3. Push to GitHub:"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "4. Enable GitHub Actions:"
echo "   - Go to your repository on GitHub"
echo "   - Click on 'Actions' tab"
echo "   - Enable GitHub Actions"
echo ""
echo "5. Set up branch protection (recommended):"
echo "   - Go to Settings > Branches"
echo "   - Add rule for 'main' branch"
echo "   - Require pull request reviews"
echo "   - Require status checks to pass"
echo ""
echo "🎉 Your SmartTask AI project is ready for GitHub!"
