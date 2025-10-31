import React, { useState } from 'react';
import { CheckCircle, Clock, XCircle, Camera, Video, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import type { DailyProgressItem as DailyProgressItemType } from '@/types/api';

interface DailyProgressItemProps {
  item: DailyProgressItemType;
}

export const DailyProgressItem: React.FC<DailyProgressItemProps> = ({ item }) => {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [modalMediaType, setModalMediaType] = useState<'photo' | 'video' | null>(null);

  const openMediaModal = (type: 'photo' | 'video') => {
    setModalMediaType(type);
    setIsMediaModalOpen(true);
  };

  const closeMediaModal = () => {
    setIsMediaModalOpen(false);
    setModalMediaType(null);
  };
  const getStatusIcon = () => {
    switch (item.status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case 'approved':
        return <Badge variant="success">Одобрено</Badge>;
      case 'pending':
        return <Badge variant="warning">На рассмотрении</Badge>;
      case 'rejected':
        return <Badge variant="danger">Отклонено</Badge>;
      default:
        return <Badge variant="default">Неизвестно</Badge>;
    }
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'photo':
        return <Camera className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'text':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getTypeIcon()}
          <span className="font-medium text-sm text-gray-600">
            {item.type === 'photo' ? 'Фото' : item.type === 'video' ? 'Видео' : 'Текст'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          {getStatusBadge()}
        </div>
      </div>

      <div className="space-y-3">
        {/* Activity Name */}
        {item.activity_name && (
          <div className="text-center mb-3">
            <h4 className="text-lg font-semibold text-gray-900">
              {item.activity_name}
            </h4>
            {item.activity_unit && (
              <p className="text-sm text-gray-600">
                за {item.activity_unit}
              </p>
            )}
          </div>
        )}

        {/* HP Earned */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Заработано HP:</span>
          <span className="font-bold text-primary-600">+{item.hp_earned}</span>
        </div>

        {/* Quantity */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Количество:</span>
          <span className="font-medium">{item.quantity}</span>
        </div>

        {/* Description */}
        {item.description && (
          <div>
            <span className="text-sm text-gray-600 block mb-1">Описание:</span>
            <p className="text-sm text-gray-800">{item.description}</p>
          </div>
        )}

        {/* File Preview */}
        {item.file && item.type === 'photo' && (
          <div>
            <span className="text-sm text-gray-600 block mb-2">Фото:</span>
            <div className="relative">
              <img
                src={item.file}
                alt="Progress photo"
                className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer"
                onClick={() => openMediaModal('photo')}
              />
            </div>
          </div>
        )}

        {item.file && item.type === 'video' && (
          <div>
            <span className="text-sm text-gray-600 block mb-2">Видео:</span>
            <div className="relative">
              <video
                src={item.file}
                controls={false}
                className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer"
                onClick={() => openMediaModal('video')}
              />
            </div>
          </div>
        )}

        {/* Uploaded At */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
          Загружено: {formatDate(item.uploaded_at)}
        </div>
      </div>

      {/* Media Preview Modal */}
      <Modal
        isOpen={isMediaModalOpen}
        onClose={closeMediaModal}
        title={modalMediaType === 'photo' ? 'Просмотр фото' : modalMediaType === 'video' ? 'Просмотр видео' : ''}
        size="xl"
      >
        {item.file && modalMediaType === 'photo' && (
          <div className="w-full">
            <img
              src={item.file}
              alt="Preview photo"
              className="max-h-[80vh] w-auto mx-auto rounded-lg"
            />
          </div>
        )}
        {item.file && modalMediaType === 'video' && (
          <div className="w-full">
            <video
              src={item.file}
              controls
              autoPlay
              className="max-h-[80vh] w-full rounded-lg"
            />
          </div>
        )}
      </Modal>
    </Card>
  );
};
