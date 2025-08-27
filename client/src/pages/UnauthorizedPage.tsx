
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">SmartTask AI</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                This page requires administrator privileges. Please contact your administrator if you believe this is an error.
              </p>
              <div className="space-y-2">
                <Link
                  to="/dashboard"
                  className="block text-primary-600 hover:text-primary-500 font-medium"
                >
                  Go to Dashboard
                </Link>
                <Link
                  to="/settings"
                  className="block text-primary-600 hover:text-primary-500 font-medium"
                >
                  Account Settings
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
