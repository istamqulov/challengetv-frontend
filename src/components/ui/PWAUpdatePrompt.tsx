import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from './Button';

export const PWAUpdatePrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  const handleUpdate = async () => {
    setShowPrompt(false);
    await updateServiceWorker(true);
  };

  const handleClose = () => {
    setShowPrompt(false);
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[200]">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Доступно обновление</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Новая версия приложения доступна. Обновите, чтобы получить последние функции и исправления.
        </p>
        
        <div className="flex space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpdate}
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Обновить
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="flex-1"
          >
            Позже
          </Button>
        </div>
      </div>
    </div>
  );
};

