import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Edit3, Save, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import type { User as UserType } from '@/types/api';

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [profileData, setProfileData] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form data for editing
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfileData();
    }
  }, [isAuthenticated, user]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const userData = await apiClient.getCurrentUser();
      setProfileData(userData);
      setEditData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Ошибка загрузки профиля');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!editData.first_name.trim()) {
      errors.first_name = 'Имя обязательно';
    }
    
    if (!editData.last_name.trim()) {
      errors.last_name = 'Фамилия обязательна';
    }
    
    if (!editData.email.trim()) {
      errors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) {
      errors.email = 'Введите корректный email';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedUser = await apiClient.updateProfile(editData);
      setProfileData(updatedUser);
      setIsEditing(false);
      
      // Update auth store with new user data
      useAuthStore.getState().login({
        username: updatedUser.username,
        password: '', // We don't need password for this update
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle field-specific errors
        if (typeof errorData === 'object') {
          const fieldErrors: Record<string, string> = {};
          
          Object.keys(errorData).forEach(field => {
            if (Array.isArray(errorData[field])) {
              fieldErrors[field] = errorData[field][0];
            } else if (typeof errorData[field] === 'string') {
              fieldErrors[field] = errorData[field];
            }
          });
          
          if (Object.keys(fieldErrors).length > 0) {
            setFieldErrors(fieldErrors);
            return;
          }
        }
        
        setError(errorData.detail || errorData.message || 'Ошибка обновления профиля');
      } else {
        setError('Произошла ошибка при обновлении профиля');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setEditData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
      });
    }
    setFieldErrors({});
    setError(null);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Необходима авторизация
          </h1>
          <p className="text-gray-600 mb-4">
            Войдите в систему для просмотра профиля
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Войти
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Ошибка загрузки
          </h1>
          <p className="text-gray-600 mb-4">
            Не удалось загрузить данные профиля
          </p>
          <Button onClick={loadProfileData}>
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Профиль</h1>
          <p className="text-gray-600 mt-2">
            Управление информацией вашего аккаунта
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info Card */}
          <div className="lg:col-span-1">
            <Card padding={true}>
              <div className="text-center">
                {/* Avatar */}
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                    <User className="w-12 h-12 text-primary-600" />
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* User Info */}
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {profileData.first_name} {profileData.last_name}
                </h2>
                <p className="text-gray-600 mb-4">@{profileData.username}</p>
                
                {/* Status Badge */}
                <Badge variant="info" className="mb-6">
                  Активный пользователь
                </Badge>

                {/* Stats */}
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{profileData.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Дата регистрации:</span>
                    <span className="font-medium">
                      {formatDate(profileData.date_joined)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Последний вход:</span>
                    <span className="font-medium">
                      {profileData.last_login ? formatDate(profileData.last_login) : 'Недавно'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Edit Form Card */}
          <div className="lg:col-span-2">
            <Card padding={true}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Личная информация
                </h3>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Редактировать</span>
                  </Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Отмена</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Сохранение...' : 'Сохранить'}</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* General error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Username (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имя пользователя
                  </label>
                  <Input
                    value={profileData.username}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Имя пользователя нельзя изменить
                  </p>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имя
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      name="first_name"
                      value={editData.first_name}
                      onChange={handleInputChange}
                      placeholder="Введите имя"
                      error={fieldErrors.first_name}
                      disabled={!isEditing || isSaving}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Фамилия
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      name="last_name"
                      value={editData.last_name}
                      onChange={handleInputChange}
                      placeholder="Введите фамилию"
                      error={fieldErrors.last_name}
                      disabled={!isEditing || isSaving}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      name="email"
                      type="email"
                      value={editData.email}
                      onChange={handleInputChange}
                      placeholder="Введите email"
                      error={fieldErrors.email}
                      disabled={!isEditing || isSaving}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Additional Info */}
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">
                    Дополнительная информация
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Дата регистрации:</span>
                      <p className="font-medium">{formatDate(profileData.date_joined)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Последний вход:</span>
                      <p className="font-medium">
                        {profileData.last_login ? formatDate(profileData.last_login) : 'Недавно'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

