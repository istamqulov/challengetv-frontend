import React from 'react';
import { 
  Image as ImageIcon, 
  Video, 
  Calendar, 
  Clock, 
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Flag,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import type { ProofList } from '@/types/api';
import { formatDate, formatDateTime, formatHP, getImageUrl } from '@/lib/utils';

interface ProofCardProps {
  proof: ProofList;
  onClick?: () => void;
  showParticipant?: boolean;
}

export const ProofCard: React.FC<ProofCardProps> = ({ 
  proof, 
  onClick,
  showParticipant = true,
}) => {
  const getStatusBadge = () => {
    switch (proof.status) {
      case 'approved':
        return <Badge variant="success">Одобрено</Badge>;
      case 'rejected':
        return <Badge variant="danger">Отклонено</Badge>;
      case 'flagged':
        return <Badge variant="warning">Помечено</Badge>;
      case 'pending':
      default:
        return <Badge variant="default">На проверке</Badge>;
    }
  };

  const getModerationBadge = () => {
    switch (proof.moderation_status) {
      case 'approved':
        return (
          <div className="flex items-center text-green-600 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Проверено
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center text-red-600 text-xs">
            <XCircle className="w-3 h-3 mr-1" />
            Отклонено
          </div>
        );
      case 'under_review':
        return (
          <div className="flex items-center text-yellow-600 text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            На проверке
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-500 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Ожидает
          </div>
        );
    }
  };

  return (
    <Card
      padding={false}
      className={`overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      {/* Media Preview */}
      <div className="relative h-48 bg-gray-100">
        {proof.proof_type === 'photo' ? (
          <img
            src={getImageUrl(proof.file_url)}
            alt={proof.activity.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-image.png';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <Video className="w-16 h-16 text-white opacity-50" />
          </div>
        )}
        
        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={proof.proof_type === 'photo' ? 'info' : 'default'}>
            {proof.proof_type === 'photo' ? (
              <>
                <ImageIcon className="w-3 h-3 mr-1" />
                Фото
              </>
            ) : (
              <>
                <Video className="w-3 h-3 mr-1" />
                Видео
              </>
            )}
          </Badge>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          {getStatusBadge()}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Activity info */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              {proof.activity.icon && (
                <img src={proof.activity.icon} alt="" className="w-5 h-5" />
              )}
              <h3 className="font-semibold text-gray-900">{proof.activity.name}</h3>
            </div>
            <p className="text-sm text-gray-600">
              {proof.quantity} {proof.activity.unit_name}
            </p>
          </div>
          
          {/* HP earned */}
          <div className="text-right">
            <div className="flex items-center space-x-1 text-primary-600 font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>{formatHP(proof.hp_earned)}</span>
            </div>
            <p className="text-xs text-gray-500">заработано</p>
          </div>
        </div>

        {/* Description */}
        {proof.description && (
          <p className="text-sm text-gray-700 line-clamp-2">
            {proof.description}
          </p>
        )}

        {/* Participant info */}
        {showParticipant && (
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
            <Avatar
              src={proof.participant.user.avatar}
              username={proof.participant.user.username}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {proof.participant.user.username}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(proof.daily_progress.date)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatDateTime(proof.uploaded_at)}</span>
          </div>
          {getModerationBadge()}
        </div>
      </div>
    </Card>
  );
};
