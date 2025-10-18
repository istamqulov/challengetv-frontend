import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import type { UserRegistration } from '@/types/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserRegistration>();

  const password = watch('password');

  const onSubmit = async (data: UserRegistration) => {
    setSubmitError(null);
    try {
      await registerUser(data);
      navigate('/');
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData) {
        const errorMessages = Object.entries(errorData)
          .map(([key, value]: [string, any]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          })
          .join('\n');
        setSubmitError(errorMessages);
      } else {
        setSubmitError('Ошибка регистрации. Попробуйте еще раз.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center space-x-2">
          <Trophy className="w-12 h-12 text-primary-600" />
          <span className="text-3xl font-bold text-gray-900">
            Challenge<span className="text-primary-600">TV</span>
          </span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Создать аккаунт
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Или{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            войдите в существующий
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg whitespace-pre-line">
                {submitError}
              </div>
            )}

            <Input
              label="Имя пользователя *"
              type="text"
              {...register('username', {
                required: 'Введите имя пользователя',
                minLength: {
                  value: 3,
                  message: 'Минимум 3 символа',
                },
                pattern: {
                  value: /^[\w.@+-]+$/,
                  message: 'Только буквы, цифры и символы @/./+/-/_',
                },
              })}
              error={errors.username?.message}
              placeholder="username"
            />

            <Input
              label="Email *"
              type="email"
              {...register('email', {
                required: 'Введите email',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Некорректный email',
                },
              })}
              error={errors.email?.message}
              placeholder="email@example.com"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Имя"
                type="text"
                {...register('first_name')}
                placeholder="Иван"
              />

              <Input
                label="Фамилия"
                type="text"
                {...register('last_name')}
                placeholder="Иванов"
              />
            </div>

            <Input
              label="Пароль *"
              type="password"
              {...register('password', {
                required: 'Введите пароль',
                minLength: {
                  value: 8,
                  message: 'Минимум 8 символов',
                },
              })}
              error={errors.password?.message}
              placeholder="••••••••"
            />

            <Input
              label="Подтвердите пароль *"
              type="password"
              {...register('password2', {
                required: 'Подтвердите пароль',
                validate: (value) =>
                  value === password || 'Пароли не совпадают',
              })}
              error={errors.password2?.message}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Зарегистрироваться
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Уже есть аккаунт?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Войти
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
