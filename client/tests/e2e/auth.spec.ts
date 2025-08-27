import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
  });

  test('should redirect to login page when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1')).toContainText('SmartTask AI');
    await expect(page.locator('h2')).toContainText('Sign In');
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.click('text=Sign up');
    
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.locator('h2')).toContainText('Sign Up');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.click('text=Forgot your password?');
    
    await expect(page).toHaveURL(/.*forgot-password/);
    await expect(page.locator('h2')).toContainText('Forgot Password');
  });

  test('should show password strength indicator on signup', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');
    
    await page.fill('input[name="displayName"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak');
    
    // Should show password strength indicator
    await expect(page.locator('text=Password strength:')).toBeVisible();
  });

  test('should validate strong password requirements', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');
    
    await page.fill('input[name="displayName"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Password must contain at least one uppercase letter')).toBeVisible();
  });

  test('should handle login with mock API', async ({ page }) => {
    // Mock the API response for login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              displayName: 'Test User',
              role: 'USER',
              emailVerified: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            accessToken: 'mock-access-token',
          },
        }),
      });
    });

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome back!')).toBeVisible();
  });

  test('should handle login error', async ({ page }) => {
    // Mock the API response for failed login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        }),
      });
    });

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should handle signup with mock API', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');
    
    // Mock the API response for signup
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'newuser@example.com',
              displayName: 'New User',
              role: 'USER',
              emailVerified: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            accessToken: 'mock-access-token',
          },
        }),
      });
    });

    await page.fill('input[name="displayName"]', 'New User');
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard after successful signup
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome back!')).toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    // First login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              displayName: 'Test User',
              role: 'USER',
              emailVerified: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            accessToken: 'mock-access-token',
          },
        }),
      });
    });

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Mock logout API
    await page.route('**/api/auth/logout', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Logged out successfully',
        }),
      });
    });
    
    // Click logout
    await page.click('text=Sign Out');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });
});
