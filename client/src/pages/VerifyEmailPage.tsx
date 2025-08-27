import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const token = searchParams.get('token');

  React.useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setIsLoading(false);
      setError('No verification token provided');
    }
  }, [token]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await authApi.verifyEmail(token);
      
      if (response.success) {
        setIsVerified(true);
      } else {
        setError(response.error?.message || 'Failed to verify email');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to verify email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">SmartTask AI</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Email Verified</CardTitle>
              <CardDescription>
                Your email has been successfully verified. You can now sign in to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">SmartTask AI</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Email Verification Failed</CardTitle>
            <CardDescription>
              {error || 'The verification link is invalid or has expired.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Please check your email for a new verification link or contact support.
              </p>
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
