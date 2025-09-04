# SmartTask AI - Full-Stack Authentication System

A production-ready authentication system with Express + Prisma backend and React frontend.

## 🏗️ Project Structure

```
smart-task-ai2/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # Zustand state management
│   │   ├── api/           # API client and interceptors
│   │   ├── lib/           # Utilities and types
│   │   └── test/          # Test setup
│   ├── tests/
│   │   └── e2e/           # Playwright E2E tests
│   └── package.json
├── server/                 # Express + Prisma backend
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   │   └── auth/      # Authentication module
│   │   ├── middleware/    # Express middleware
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Utility functions
│   │   └── __tests__/     # Jest tests
│   ├── prisma/            # Database schema and migrations
│   └── package.json
└── package.json           # Root monorepo configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start both server and client in development mode:**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:3000
   - Frontend client on http://localhost:5173

### Individual Commands

**Backend (Server):**
```bash
cd server
npm run dev          # Start development server
npm test            # Run tests
npm run build       # Build for production
```

**Frontend (Client):**
```bash
cd client
npm run dev         # Start development server
npm test           # Run unit tests
npm run test:e2e   # Run E2E tests with Playwright
npm run build      # Build for production
```

## 🔧 Backend Features

### Authentication Module
- **Email/Password Authentication**: Secure login and registration
- **JWT Tokens**: Access tokens (10min) + Refresh tokens (7 days)
- **Token Rotation**: Automatic refresh token rotation with reuse detection
- **Session Management**: Track active sessions with Prisma
- **Security Features**:
  - Argon2id password hashing
  - HttpOnly + Secure cookies
  - SameSite=Strict
  - CSRF protection via double-submit cookie
  - Rate limiting on login attempts
  - Helmet security headers
  - Strict CORS configuration

### API Endpoints
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile
- `POST /auth/change-password` - Change password
- `DELETE /auth/sessions` - Revoke all sessions
- `GET /health` - Health check

### Database
- **SQLite** for development/testing
- **Prisma ORM** with automatic migrations
- **User** and **Session** models with proper relationships

## 🎨 Frontend Features

### Authentication Pages
- `/signup` - User registration
- `/login` - User login
- `/verify-email` - Email verification
- `/forgot` - Forgot password
- `/reset` - Password reset
- `/settings/security` - Security settings

### State Management
- **Zustand** for global state
- Access token stored in memory
- Refresh token as HttpOnly cookie (not accessible via JS)

### API Integration
- **Axios** with automatic interceptors
- Automatic token attachment to requests
- 401 handling with token refresh
- Refresh token reuse detection and logout

### Security
- **Protected Routes** with role-based access control
- **Route loaders** for authentication checks
- **Form validation** with React Hook Form + Zod

### Testing
- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright for full authentication flow
- **Test Coverage**: Comprehensive test suite

### Azure Static Web Apps Integration
- **SPA Routing**: Deep links work correctly with `staticwebapp.config.json`
- **Build Optimization**: Optimized for SWA deployment with proper chunking
- **Environment Injection**: `VITE_API_URL` injected at build time for production

## 🛡️ Security Features

### Backend Security
- **Password Hashing**: Argon2id with proper salt rounds
- **JWT Security**: HS512 algorithm with short expiry
- **Cookie Security**: HttpOnly, Secure, SameSite=Strict
- **CSRF Protection**: Double-submit cookie pattern
- **Rate Limiting**: Login attempt throttling
- **Input Validation**: Zod schemas for all endpoints
- **Audit Logging**: Winston with request ID tracking
- **Security Headers**: Helmet configuration

### Frontend Security
- **Token Storage**: Access tokens in memory only
- **Secure Cookies**: Refresh tokens as HttpOnly cookies
- **Input Validation**: Client-side Zod validation
- **XSS Protection**: React's built-in XSS protection
- **CSRF Tokens**: Automatic CSRF token handling

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Frontend Tests
```bash
cd client
npm test              # Unit tests
npm run test:e2e      # E2E tests
```

### Test Coverage
- **Backend**: Jest + Supertest for API testing
- **Frontend**: Vitest + React Testing Library for component testing
- **E2E**: Playwright for full user journey testing

## 📦 Production Deployment

### Backend
```bash
cd server
npm run build
npm start
```

### Frontend
```bash
cd client
npm run build
# Serve dist/ directory with your preferred web server
```

## 🔧 Environment Variables & Secrets Setup

### 🚀 Quick Environment Setup

1. **Copy environment templates:**
   ```bash
   # Server environment
   cp server/.env.example server/.env
   
   # Client environment  
   cp client/.env.example client/.env
   ```

2. **Generate secure secrets:**
   ```bash
   # Using Node.js (recommended)
   node -e "console.log('JWT_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('COOKIE_SECRET:', require('crypto').randomBytes(16).toString('hex'))"
   node -e "console.log('CSRF_SECRET:', require('crypto').randomBytes(16).toString('hex'))"
   
   # Using PowerShell (Windows)
   [System.Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
   [System.Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(16))
   ```

3. **Validate environment:**
   ```bash
   npm run env:check
   ```

### 🔐 GitHub Secrets Setup (Production)

**Go to:** `Settings` → `Secrets and variables` → `Actions`

#### Required Secrets:

**Database:**
- `DATABASE_URL` - Production database connection string

**JWT & Security:**
- `JWT_SECRET` - Minimum 32 characters
- `COOKIE_SECRET` - Minimum 16 characters  
- `CSRF_SECRET` - Minimum 16 characters
- `COOKIE_SECRET_OLD` - Optional, for key rotation

**Azure Backend:**
- `AZURE_WEBAPP_NAME` - Web app name
- `AZURE_WEBAPP_PUBLISH_PROFILE` - Publish profile (get from Azure Portal)

**Azure Frontend:**
- `AZURE_STATIC_WEB_APPS_API_TOKEN` - Static web apps deployment token (get from Azure Portal)
- `AZURE_STATIC_WEB_APP_NAME` - Static web app name

**CORS & URLs:**
- `CORS_ORIGIN` - Frontend domain
- `PRODUCTION_API_URL` - Backend API domain

#### Staging Secrets (Future - Keep Commented):
```bash
# STAGING_API_URL
# AZURE_STAGING_WEBAPP_NAME
# AZURE_STAGING_WEBAPP_PUBLISH_PROFILE
# AZURE_STAGING_RESOURCE_GROUP
# AZURE_STAGING_STATIC_WEB_APPS_API_TOKEN
# AZURE_STAGING_STATIC_WEB_APP_NAME
```

### 📁 Environment File Structure

```
server/
├── .env.example          # Development template
├── .env.production.example  # Production template (future)
└── .env                  # Local development (gitignored)

client/
├── .env.example          # Development template
├── .env                  # Local development (gitignored)
└── staticwebapp.config.json  # Azure Static Web Apps routing configuration
```

### 🔒 Security Best Practices

- **Never commit `.env` files** to version control
- **Use different secrets** for development, staging, and production
- **Rotate secrets regularly** (every 6-12 months)
- **Validate environment** before starting the application
- **Mask secrets in logs** (automatically handled by our tools)

### ✅ Production Deployment Checklist

#### Before First Deployment:
- [ ] Generate secure secrets (JWT, Cookie, CSRF)
- [ ] Set up Azure resources (Web App, Static Web App, Database)
- [ ] Configure GitHub Secrets with all required values
- [ ] Test environment validation locally: `npm run env:check`
- [ ] Ensure CI/CD pipeline passes all tests

#### GitHub Secrets Verification:
- [ ] `DATABASE_URL` - Production database connection
- [ ] `JWT_SECRET` - 32+ character secure string
- [ ] `COOKIE_SECRET` - 16+ character secure string
- [ ] `CSRF_SECRET` - 16+ character secure string
- [ ] `AZURE_CREDENTIALS` - Service principal JSON
- [ ] `AZURE_WEBAPP_NAME` - Backend web app name
- [ ] `AZURE_WEBAPP_PUBLISH_PROFILE` - Backend publish profile
- [ ] `AZURE_RESOURCE_GROUP` - Azure resource group
- [ ] `AZURE_STATIC_WEB_APPS_API_TOKEN` - Frontend API token
- [ ] `AZURE_STATIC_WEB_APP_NAME` - Frontend app name
- [ ] `CORS_ORIGIN` - Frontend domain
- [ ] `PRODUCTION_API_URL` - Backend API domain

#### Post-Deployment Verification:
- [ ] Backend health check: `/health` endpoint
- [ ] Frontend loads without errors
- [ ] Authentication flows work correctly
- [ ] Database connections established
- [ ] All CI/CD checks pass

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/OdedShaoulian/SMART-TASK-AI2.git
   cd SMART-TASK-AI2
   ```
3. **Install dependencies**:
   ```bash
   npm run install:all
   ```
4. **Set up environment**:
   ```bash
   cp server/env.example server/.env
   # Edit server/.env with your configuration
   ```
5. **Start development**:
   ```bash
   npm run dev
   ```
6. **Run tests**:
   ```bash
   npm test
   ```
7. **Create a pull request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- 📖 **Documentation**: Check the [README](README.md) and inline code comments
- 🐛 **Bug Reports**: Use our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md)
- 💡 **Feature Requests**: Use our [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)
- 💬 **Discussions**: Start a [GitHub Discussion](https://github.com/OdedShaoulian/SMART-TASK-AI2/discussions)

### Security

If you discover a security vulnerability, please report it via email to [odedshaoulian@example.com](mailto:odedshaoulian@example.com) instead of using the issue tracker. See our [Security Policy](SECURITY.md) for details.

## 🚀 Deploy to Existing Azure Resources (Publish Profile)

This project deploys to **existing** Azure resources using Publish Profile authentication. No resource creation is performed.

### 🔧 Prerequisites

Ensure you have these Azure resources already created:
- **Backend**: Azure Web App (Windows) 
- **Frontend**: Azure Static Web Apps
- **Database**: Already provisioned with connection string

### 📋 Required GitHub Secrets

**Go to:** `Settings` → `Secrets and variables` → `Actions`

#### Backend Deployment Secrets:
- **`AZURE_WEBAPP_NAME`** – Your existing Web App name
- **`AZURE_WEBAPP_PUBLISH_PROFILE`** – Get from Azure Portal → App Service → Get publish profile

#### Frontend Deployment Secrets:
- **`AZURE_STATIC_WEB_APPS_API_TOKEN`** – Get from Azure Portal → Static Web Apps → Deployment token
- **`AZURE_STATIC_WEB_APP_NAME`** – Your existing Static Web App name

#### Application Secrets:
- **`DATABASE_URL`** – Production database connection string
- **`JWT_SECRET`** – Minimum 32 characters
- **`COOKIE_SECRET`** – Minimum 16 characters
- **`CSRF_SECRET`** – Minimum 16 characters
- **`CORS_ORIGIN`** – Frontend domain (e.g., `https://your-app.azurestaticapps.net`)
- **`PRODUCTION_API_URL`** – Backend API URL (e.g., `https://your-backend.azurewebsites.net`)

### 🏗️ Azure Portal App Settings

**Configure these in Azure Portal → App Service → Configuration → Application settings:**

```
DATABASE_URL=<your-database-connection-string>
JWT_SECRET=<your-jwt-secret>
COOKIE_SECRET=<your-cookie-secret>
CSRF_SECRET=<your-csrf-secret>
CORS_ORIGIN=https://your-app.azurestaticapps.net
NODE_ENV=production
```

### 🚀 Deployment Process

#### Backend Deployment:
1. **Publish Profile Only** - Uses `azure/webapps-deploy@v2` with publish profile
2. **Run-From-Package** - Deploys prebuilt ZIP package for optimal performance
3. **Health Checks** - Tests `/health` endpoint after deployment
4. **Smoke Tests** - Validates deployment success

#### Frontend Deployment:
1. **Static Web Apps** - Uses `Azure/static-web-apps-deploy@v1`
2. **Build-time Injection** - Sets `VITE_API_URL` from `PRODUCTION_API_URL` secret
3. **SPA Fallback** - Configured via `staticwebapp.config.json`
4. **Smoke Tests** - Validates frontend accessibility

### 🔍 Post-Deployment Verification

#### Backend Health Check:
```bash
curl -f https://your-backend.azurewebsites.net/health
```

#### Frontend Accessibility:
```bash
curl -f https://your-app.azurestaticapps.net
```

### 🔄 CORS Configuration

Ensure your backend allows CORS from the SWA domain:
```
CORS_ORIGIN=https://your-app.azurestaticapps.net
```

### 📝 Staging (Future)

Staging deployment blocks are present but commented out. To enable:
1. Uncomment staging sections in workflows
2. Add staging-specific secrets
3. Configure staging Azure resources

### Manual Deployment (Alternative)

If you prefer manual deployment:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy server**:
   ```bash
   cd server
   npm start
   ```

3. **Deploy client**:
   Serve the `client/dist/` directory with your preferred web server.

## 📊 Project Status

![CI/CD](https://github.com/OdedShaoulian/SMART-TASK-AI2/workflows/CI%2FCD%20Pipeline/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

---

**Built with ❤️ using Express, Prisma, React, and TypeScript**
