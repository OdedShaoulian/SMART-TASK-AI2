import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, changePasswordSchema, type UpdateProfileFormData, type ChangePasswordFormData } from '@/lib/schemas';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { getInitials } from '@/lib/utils';

export function SettingsPage() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const isSecurityPage = location.pathname === '/settings/security';

  const profileForm = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
              name: user?.name || '',
      email: user?.email || '',
    },
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onProfileSubmit = async (data: UpdateProfileFormData) => {
    setIsProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const response = await authApi.updateProfile(data);
      
      if (response.success) {
        setProfileSuccess(true);
        // Refresh user data
        window.location.reload();
      } else {
        setProfileError(response.error?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setIsPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      const response = await authApi.changePassword(data);
      
      if (response.success) {
        setPasswordSuccess(true);
        passwordForm.reset();
        // Logout user after password change
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        setPasswordError(response.error?.message || 'Failed to change password');
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-xl font-semibold text-gray-900">
                SmartTask AI
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {getInitials(user.name)}
              </div>
              <span className="text-sm text-gray-700">{user.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Navigation */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <nav className="space-y-2">
                    <Link
                      to="/settings"
                      className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        !isSecurityPage
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/settings/security"
                      className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        isSecurityPage
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Security
                    </Link>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Content */}
            <div className="lg:col-span-2">
              {!isSecurityPage ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>
                      Update your profile information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      {profileError && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                          {profileError}
                        </div>
                      )}
                      {profileSuccess && (
                        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                          Profile updated successfully!
                        </div>
                      )}

                      <Input
                        label="Name"
                        type="text"
                                        error={profileForm.formState.errors.name?.message}
                {...profileForm.register('name')}
                      />

                      <Input
                        label="Email"
                        type="email"
                        error={profileForm.formState.errors.email?.message}
                        {...profileForm.register('email')}
                      />

                      <Button
                        type="submit"
                        loading={isProfileLoading}
                      >
                        Update Profile
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Change your password and manage security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      {passwordError && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                          Password changed successfully! You will be logged out shortly.
                        </div>
                      )}

                      <Input
                        label="Current Password"
                        type="password"
                        autoComplete="current-password"
                        error={passwordForm.formState.errors.currentPassword?.message}
                        {...passwordForm.register('currentPassword')}
                      />

                      <Input
                        label="New Password"
                        type="password"
                        autoComplete="new-password"
                        error={passwordForm.formState.errors.newPassword?.message}
                        helperText="Must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
                        {...passwordForm.register('newPassword')}
                      />

                      <Button
                        type="submit"
                        loading={isPasswordLoading}
                      >
                        Change Password
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
