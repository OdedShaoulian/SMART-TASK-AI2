# Azure Deployment Guide

This guide explains how to deploy SmartTask AI to Azure using the provided GitHub Actions workflows.

## Overview

The deployment setup consists of:
- **Backend**: Azure App Service with staging slot for zero-downtime deployments
- **Frontend**: Azure Static Web Apps with preview environments for PRs
- **Database**: Azure Database for PostgreSQL (recommended) or Azure SQL Database

## Prerequisites

1. **Azure Subscription**: Active Azure subscription with billing enabled
2. **Azure CLI**: Install and authenticate with `az login`
3. **GitHub Repository**: Your code must be in a GitHub repository
4. **GitHub Secrets**: Configure the required secrets (see below)

## Required GitHub Secrets

### Backend Deployment Secrets

Configure these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

```bash
# Azure App Service Configuration
AZURE_WEBAPP_NAME=your-app-service-name
AZURE_WEBAPP_PUBLISH_PROFILE=<publish-profile-content>
AZURE_RESOURCE_GROUP=your-resource-group-name
AZURE_CREDENTIALS=<service-principal-json>

# Application Secrets (store in Azure Key Vault for production)
JWT_SECRET=your-super-secret-jwt-key-here
COOKIE_SECRET=your-cookie-secret-here
CSRF_SECRET=your-csrf-secret-here
DATABASE_URL=postgresql://user:password@host:port/database
CORS_ORIGIN=https://your-frontend-domain.azurestaticapps.net
```

### Frontend Deployment Secrets

```bash
# Azure Static Web Apps Configuration
AZURE_STATIC_WEB_APP_NAME=your-static-web-app-name
AZURE_STATIC_WEB_APPS_API_TOKEN=<api-token>

# API URLs for different environments
PRODUCTION_API_URL=https://your-backend.azurewebsites.net
STAGING_API_URL=https://your-backend-staging.azurewebsites.net
```

## Azure Resources Setup

### 1. Create Azure App Service (Backend)

```bash
# Create resource group
az group create --name smarttask-rg --location eastus

# Create App Service plan
az appservice plan create \
  --name smarttask-plan \
  --resource-group smarttask-rg \
  --sku B1 \
  --is-linux

# Create App Service
az webapp create \
  --name smarttask-backend \
  --resource-group smarttask-rg \
  --plan smarttask-plan \
  --runtime "NODE|20-lts"

# Create staging slot
az webapp deployment slot create \
  --name smarttask-backend \
  --resource-group smarttask-rg \
  --slot staging
```

### 2. Create Azure Static Web Apps (Frontend)

```bash
# Create Static Web App
az staticwebapp create \
  --name smarttask-frontend \
  --resource-group smarttask-rg \
  --source https://github.com/OdedShaoulian/SMART-TASK-AI2 \
  --location eastus \
  --branch main \
  --app-location "/client" \
  --output-location "dist"
```

### 3. Create Azure Database (Optional)

```bash
# Create PostgreSQL Flexible Server
az postgres flexible-server create \
  --name smarttask-db \
  --resource-group smarttask-rg \
  --location eastus \
  --admin-user dbadmin \
  --admin-password <secure-password> \
  --sku-name Standard_B1ms \
  --version 15

# Create database
az postgres flexible-server db create \
  --name smarttask \
  --server-name smarttask-db \
  --resource-group smarttask-rg
```

## Getting Azure Credentials

### 1. Get Publish Profile

```bash
# Download publish profile
az webapp deployment list-publishing-profiles \
  --name smarttask-backend \
  --resource-group smarttask-rg \
  --xml > publish-profile.xml
```

Copy the content of `publish-profile.xml` to the `AZURE_WEBAPP_PUBLISH_PROFILE` secret.

### 2. Create Service Principal

```bash
# Create service principal
az ad sp create-for-rbac \
  --name "smarttask-github-actions" \
  --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/smarttask-rg \
  --sdk-auth
```

Copy the JSON output to the `AZURE_CREDENTIALS` secret.

### 3. Get Static Web Apps Token

```bash
# Get API token
az staticwebapp secrets set \
  --name smarttask-frontend \
  --secret-name github-token \
  --secret-value <github-personal-access-token>
```

## Environment Variables in Azure

### App Service Configuration

Set these in Azure Portal → App Service → Configuration → Application settings:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Security
JWT_SECRET=your-super-secret-jwt-key-here
COOKIE_SECRET=your-cookie-secret-here
CSRF_SECRET=your-csrf-secret-here

# CORS
CORS_ORIGIN=https://your-frontend-domain.azurestaticapps.net

# JWT Configuration
JWT_ALGORITHM=HS512
JWT_ACCESS_TOKEN_EXPIRY=10m
JWT_REFRESH_TOKEN_EXPIRY=7d
```

### Static Web Apps Configuration

Set these in Azure Portal → Static Web App → Configuration → Application settings:

```bash
# API URLs
VITE_API_URL=https://your-backend.azurewebsites.net
```

## Deployment Workflows

### 1. CI Pipeline (`ci.yml`)

Runs on every push and PR:
- ✅ Tests (Jest + RTL)
- ✅ Build (server + client)
- ✅ Security audit
- ✅ E2E tests (optional)

### 2. Backend Deployment (`deploy-backend.yml`)

Runs on push to `main`:
- 🚀 Deploy to staging slot
- 🧪 Run smoke tests
- 🔄 Swap to production
- ✅ Verify deployment

### 3. Frontend Deployment (`deploy-frontend.yml`)

Runs on push to `main` and PRs:
- 🚀 Deploy to production (main) or preview (PR)
- 💬 Comment PR with preview URL
- ✅ Verify deployment

## Monitoring and Troubleshooting

### 1. Check Deployment Status

```bash
# Check App Service logs
az webapp log tail --name smarttask-backend --resource-group smarttask-rg

# Check Static Web App logs
az staticwebapp logs show --name smarttask-frontend --resource-group smarttask-rg
```

### 2. Common Issues

**Backend Deployment Fails:**
- Check `AZURE_CREDENTIALS` format
- Verify `AZURE_WEBAPP_PUBLISH_PROFILE` content
- Ensure App Service has staging slot

**Frontend Deployment Fails:**
- Verify `AZURE_STATIC_WEB_APPS_API_TOKEN`
- Check build output in `client/dist/`
- Ensure Static Web App is configured correctly

**Database Connection Issues:**
- Verify `DATABASE_URL` format
- Check firewall rules for database
- Ensure Prisma migrations are applied

### 3. Rollback Strategy

**Backend Rollback:**
```bash
# Swap staging back to production
az webapp deployment slot swap \
  --resource-group smarttask-rg \
  --name smarttask-backend \
  --slot staging \
  --target-slot production
```

**Frontend Rollback:**
- Use Azure Portal to revert to previous deployment
- Or redeploy from a previous commit

## Security Best Practices

1. **Secrets Management:**
   - Use Azure Key Vault for production secrets
   - Rotate secrets regularly
   - Use least-privilege service principals

2. **Network Security:**
   - Enable private endpoints for database
   - Configure VNet integration for App Service
   - Use Azure Front Door for CDN and security

3. **Monitoring:**
   - Enable Application Insights
   - Set up alerting for failures
   - Monitor security events

## Cost Optimization

1. **Development:**
   - Use B1 App Service plan
   - Use Standard_B1ms database
   - Enable auto-shutdown for dev resources

2. **Production:**
   - Use P1V2 App Service plan
   - Use Standard_DS2_v2 database
   - Enable auto-scaling

## Next Steps

1. **Set up monitoring** with Application Insights
2. **Configure custom domain** for production
3. **Set up SSL certificates** (automatic with Azure)
4. **Implement backup strategy** for database
5. **Set up staging environment** for testing

## Support

For issues with Azure deployment:
1. Check Azure Portal logs
2. Review GitHub Actions logs
3. Verify secrets configuration
4. Test locally with Azure emulators
