import React, { useState } from 'react';
import { X, AlertTriangle, UserMinus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface LeaveChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeave: () => void;
  challengeTitle: string;
  isLoading?: boolean;
}

export const LeaveChallengeModal: React.FC<LeaveChallengeModalProps> = ({
  isOpen,
  onClose,
  onLeave,
  challengeTitle,
  isLoading = false,
}) => {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleLeave = () => {
    if (isConfirmed) {
      onLeave();
    }
  };

  const handleClose = () => {
    setIsConfirmed(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Покинуть челлендж
              </h2>
              <p className="text-sm text-gray-600">{challengeTitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <Card padding={true} className="bg-red-50 border-red-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-2">Внимание!</p>
                <p className="mb-2">
                  Вы собираетесь покинуть челлендж. Это действие нельзя отменить.
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Ваш прогресс будет потерян</li>
                  <li>Вы потеряете доступ к материалам челленджа</li>
                  <li>Ваше место может быть занято другим участником</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Confirmation checkbox */}
          <div className="mt-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
              />
              <span className="text-sm text-gray-700">
                Я понимаю последствия и хочу покинуть челлендж
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {isConfirmed ? (
              <span className="text-red-600 font-medium">
                Подтверждено для выхода
              </span>
            ) : (
              'Подтвердите действие для продолжения'
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={handleLeave}
              disabled={!isConfirmed || isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Покидаем...</span>
                </>
              ) : (
                <>
                  <UserMinus className="w-4 h-4" />
                  <span>Покинуть</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

