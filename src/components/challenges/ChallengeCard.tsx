import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Clock, Award } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { ChallengeList } from '@/types/api';
import {
  formatDate,
  getDaysUntil,
  getChallengeStatusText,
  getImageUrl,
  isChallengeActive,
  isChallengeUpcoming,
} from '@/lib/utils';

interface ChallengeCardProps {
  challenge: ChallengeList;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge }) => {
  const daysUntilStart = getDaysUntil(challenge.start_date);
  const isActive = isChallengeActive(challenge.start_date, challenge.end_date);
  const isUpcoming = isChallengeUpcoming(challenge.start_date);

  const getStatusBadge = () => {
    if (challenge.status === 'active' && isActive) {
      return <Badge variant="success">Активен</Badge>;
    }
    if (challenge.status === 'active' && isUpcoming) {
      return <Badge variant="info">Скоро начнется</Badge>;
    }
    if (challenge.status === 'completed') {
      return <Badge variant="default">Завершен</Badge>;
    }
    if (challenge.status === 'cancelled') {
      return <Badge variant="danger">Отменен</Badge>;
    }
    return <Badge variant="warning">{getChallengeStatusText(challenge.status)}</Badge>;
  };

  return (
    <Link to={`/challenges/${challenge.slug}`}>
      <Card padding={false} hover className="overflow-hidden h-full">
        {/* Image */}
        <div className="relative h-48 bg-primary-600">
          {challenge.image ? (
            <img
              src={getImageUrl(challenge.image)}
              alt={challenge.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Award className="w-20 h-20 text-white opacity-50" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            {getStatusBadge()}
          </div>
          {challenge.is_full && !challenge.joined && (
            <div className="absolute top-3 left-3">
              <Badge variant="danger">Набор закрыт</Badge>
            </div>
          )}
          {challenge.joined && (
            <div className="absolute top-3 left-3">
              <Badge variant="info" className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>Участвуете</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {challenge.title}
          </h3>

          {challenge.short_description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {challenge.short_description}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>
                {formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}
              </span>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>{challenge.duration_days} дней</span>
              {isUpcoming && daysUntilStart > 0 && (
                <span className="ml-2 text-primary-600 font-medium">
                  • Начнется через {daysUntilStart} {daysUntilStart === 1 ? 'день' : 'дней'}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                <span>
                  {challenge.participants_count} / {challenge.max_participants || '∞'}
                </span>
              </div>

              {challenge.is_public ? (
                <Badge variant="info">Публичный</Badge>
              ) : (
                <Badge variant="default">Приватный</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
