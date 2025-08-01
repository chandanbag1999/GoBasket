import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { motion } from 'framer-motion';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Camera, 
  Save,
  Shield,
  MapPin,
  CreditCard,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import { Button, Input, Avatar, Card } from '@/components/ui';
import Container from '@/components/layout/Container';

// Hooks
import { useAuth } from '@/hooks';

// Services
import { userService } from '@/services';

// Validation
import { profileUpdateSchema, type ProfileUpdateFormData } from '@/utils/validationSchemas';

/**
 * Profile Page Component
 * 
 * Features:
 * - Profile information display and editing
 * - Avatar upload
 * - Form validation
 * - Loading states
 * - Quick action cards
 * - Profile stats
 * - Mobile-optimized design
 */
const ProfilePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  const { user, updateUser } = useAuth();

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<ProfileUpdateFormData>({
    resolver: yupResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      dateOfBirth: user?.profile?.dateOfBirth || '',
      gender: user?.profile?.gender || '',
    },
    mode: 'onChange',
  });

  /**
   * Handle profile update
   */
  const onSubmit = async (data: ProfileUpdateFormData) => {
    try {
      setIsLoading(true);

      const response = await userService.updateProfile(data);

      if (response.success) {
        await updateUser(response.data.user);
        toast.success('Profile updated successfully! ✅');
        setIsEditing(false);
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle avatar upload
   */
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    try {
      setAvatarUploading(true);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await userService.uploadAvatar(formData);

      if (response.success) {
        await updateUser(response.data.user);
        toast.success('Profile picture updated! 📸');
      } else {
        throw new Error(response.error || 'Failed to upload avatar');
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    reset();
    setIsEditing(false);
  };

  const quickActions = [
    {
      title: 'My Addresses',
      description: 'Manage delivery addresses',
      icon: MapPin,
      href: '/profile/addresses',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Payment Methods',
      description: 'Saved cards & wallets',
      icon: CreditCard,
      href: '/profile/payments',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Security',
      description: 'Password & privacy',
      icon: Shield,
      href: '/profile/security',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Settings',
      description: 'App preferences',
      icon: Settings,
      href: '/profile/settings',
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Container>
        <div className="py-6 md:py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              My Profile
            </h1>
            <p className="text-gray-600">
              Manage your account information and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar
                      src={user?.avatar?.secure_url}
                      alt={user?.name}
                      size="xl"
                      fallback={user?.name?.charAt(0) || 'U'}
                      className="ring-4 ring-white shadow-lg"
                    />
                    
                    {/* Avatar Upload */}
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 bg-primary-500 hover:bg-primary-600 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={avatarUploading}
                      />
                    </label>

                    {/* Upload Loading */}
                    {avatarUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {user?.name}
                    </h2>
                    <p className="text-gray-600 mb-2">{user?.email}</p>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        ✅ Email Verified
                      </span>
                      {user?.isPhoneVerified && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          📱 Phone Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit Button */}
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSubmit(onSubmit)}
                          loading={isLoading}
                          disabled={!isDirty || !isValid}
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>

                {/* Profile Form */}
                {isEditing ? (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        {...register('name')}
                        label="Full Name"
                        leftIcon={<User className="h-4 w-4" />}
                        error={errors.name?.message}
                        disabled={isLoading}
                      />

                      <Input
                        {...register('phone')}
                        label="Phone Number"
                        type="tel"
                        leftIcon={<Phone className="h-4 w-4" />}
                        error={errors.phone?.message}
                        disabled={isLoading}
                      />

                      <Input
                        {...register('dateOfBirth')}
                        label="Date of Birth"
                        type="date"
                        leftIcon={<Calendar className="h-4 w-4" />}
                        error={errors.dateOfBirth?.message}
                        disabled={isLoading}
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          {...register('gender')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          disabled={isLoading}
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                        {errors.gender && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.gender.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500">Phone</label>
                      <p className="font-medium">{user?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">Date of Birth</label>
                      <p className="font-medium">
                        {user?.profile?.dateOfBirth 
                          ? new Date(user.profile.dateOfBirth).toLocaleDateString()
                          : 'Not provided'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-gray-500">Gender</label>
                      <p className="font-medium capitalize">
                        {user?.profile?.gender?.replace('-', ' ') || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="text-gray-500">Member Since</label>
                      <p className="font-medium">
                        {user?.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString()
                          : 'Unknown'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {quickActions.map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <button
                        key={action.title}
                        className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{action.title}</p>
                          <p className="text-sm text-gray-500">{action.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Profile Stats */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Account Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Orders</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Saved</span>
                    <span className="font-medium text-green-600">₹0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Addresses</span>
                    <span className="font-medium">{user?.addresses?.length || 0}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProfilePage;
