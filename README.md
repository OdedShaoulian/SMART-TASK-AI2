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

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=file:./dev.db
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
COOKIE_SECRET=your-cookie-secret-here-change-in-production
CSRF_SECRET=your-csrf-secret-here-change-in-production
CORS_ORIGIN=http://localhost:5173
JWT_ALGORITHM=HS512
JWT_ACCESS_TOKEN_EXPIRY=10m
JWT_REFRESH_TOKEN_EXPIRY=7d
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

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

## 🚀 Deployment

### Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set up environment variables**:
   ```bash
   # Server environment
   JWT_SECRET=your-production-jwt-secret
   COOKIE_SECRET=your-production-cookie-secret
   CSRF_SECRET=your-production-csrf-secret
   DATABASE_URL=your-production-database-url
   CORS_ORIGIN=your-frontend-domain
   ```

3. **Deploy server**:
   ```bash
   cd server
   npm start
   ```

4. **Deploy client**:
   Serve the `client/dist/` directory with your preferred web server.

## 📊 Project Status

![CI/CD](https://github.com/OdedShaoulian/SMART-TASK-AI2/workflows/CI%2FCD%20Pipeline/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

---

**Built with ❤️ using Express, Prisma, React, and TypeScript**
