# SmartTask AI Client

A React-based client application for SmartTask AI with comprehensive authentication system.

## Features

- **Authentication**: Complete login/signup flow with email verification
- **Security**: Password strength validation, secure token handling
- **Role-based Access**: USER and ADMIN role support
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Form Validation**: React Hook Form + Zod validation
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Testing**: Comprehensive unit and E2E tests

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Zustand** for state management
- **React Hook Form** + **Zod** for forms
- **Axios** for API communication
- **Tailwind CSS** for styling
- **Vitest** + **React Testing Library** for unit tests
- **Playwright** for E2E tests

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your API URL:
```env
VITE_API_URL=http://localhost:3000/api
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Building

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Testing

### Unit Tests

Run unit tests:
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

### E2E Tests

Run E2E tests:
```bash
npm run test:e2e
```

Run E2E tests with UI:
```bash
npm run test:e2e:ui
```

## Project Structure

```
src/
├── api/              # API client and interceptors
├── components/       # Reusable UI components
│   ├── auth/        # Authentication components
│   └── ui/          # Base UI components
├── hooks/           # Custom React hooks
├── lib/             # Utilities, types, schemas
├── pages/           # Page components
├── store/           # Zustand stores
├── test/            # Test setup
└── __tests__/       # Unit tests
```

## Authentication Flow

1. **Login/Signup**: Users authenticate with email/password
2. **Token Management**: Access tokens stored in memory, refresh tokens in HttpOnly cookies
3. **Auto-refresh**: Automatic token refresh on 401 responses
4. **Security**: Token reuse detection and automatic logout
5. **Role-based Access**: Route protection based on user roles

## API Integration

The client integrates with the backend API through:

- **Axios interceptors** for automatic token handling
- **Error handling** for network and authentication errors
- **Type-safe API calls** with TypeScript interfaces
- **Automatic retry** for failed requests

## Security Features

- **Password Strength**: Real-time password strength validation
- **Form Validation**: Client-side validation with Zod schemas
- **CSRF Protection**: Automatic CSRF token handling
- **Secure Storage**: Access tokens never persisted to localStorage
- **Session Management**: Automatic session cleanup on logout

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting

## License

This project is part of the SmartTask AI application.
