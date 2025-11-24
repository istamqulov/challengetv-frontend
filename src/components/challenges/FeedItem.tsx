import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Play } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/lib/api';
import { getAvatarUrl, getImageUrl, formatDateTime, formatHP, formatDate } from '@/lib/utils';
import type { FeedItem as FeedItemType } from '@/types/api';

interface FeedItemProps {
  item: FeedItemType;
  onCommentClick: (itemId: number) => void;
}

export const FeedItem: React.FC<FeedItemProps> = ({ item, onCommentClick }) => {
  const [kudosCount, setKudosCount] = useState(item.kudos_count);
  const [hasKudoed, setHasKudoed] = useState(item.has_user_kudoed);
  const [isTogglingKudo, setIsTogglingKudo] = useState(false);

  const handleToggleKudo = async () => {
    if (isTogglingKudo) return;
    
    setIsTogglingKudo(true);
    try {
      const response = await apiClient.toggleKudo(item.id);
      setHasKudoed(response.has_kudoed);
      setKudosCount(response.kudos_count);
    } catch (error) {
      console.error('Error toggling kudo:', error);
    } finally {
      setIsTogglingKudo(false);
    }
  };

  const fileUrl = item.file ? getImageUrl(item.file) : null;
  const isVideo = item.type === 'video';

  return (
    <Card className="mb-4">
      <div className="space-y-4">
        {/* User Info */}
        <div className="flex items-center space-x-3">
          <Link to={`/users/${item.user.id}/profile`} className="flex-shrink-0">
            <Avatar
              src={item.user.profile?.avatar}
              firstName={item.user.first_name}
              lastName={item.user.last_name}
              username={item.user.username}
              size="md"
            />
          </Link>
          <div className="flex-1">
            <Link 
              to={`/users/${item.user.id}/profile`}
              className="block hover:text-primary-600"
            >
              <div className="font-semibold text-gray-900">
                {item.user.first_name && item.user.last_name
                  ? `${item.user.first_name} ${item.user.last_name}`
                  : item.user.username}
              </div>
            </Link>
          </div>
        </div>

        {/* Activity and Date */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 flex-wrap">
          <span className="font-medium">{item.activity_name}</span>
          <span>•</span>
          <span>{formatDateTime(item.uploaded_at)}</span>
          {item.daily_progress_date && (
            <>
              <span>•</span>
              <span>Дата прогресса: {formatDate(item.daily_progress_date, 'dd.MM.yyyy')}</span>
            </>
          )}
        </div>

        {/* Count and HP */}
        <div className="flex items-center space-x-4 text-sm">
          <div>
            <span className="font-medium text-gray-900">Количество:</span>{' '}
            <span className="text-gray-600">{item.quantity}</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">HP:</span>{' '}
            <span className="text-primary-600 font-semibold">{formatHP(item.hp_earned)}</span>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-gray-700">{item.description}</p>
        )}

        {/* Photo or Video */}
        {fileUrl && (
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            {isVideo ? (
              <div className="relative">
                <video
                  src={fileUrl}
                  controls
                  className="w-full max-h-96 object-contain"
                />
                <div className="absolute top-2 right-2 bg-black/50 rounded-full p-2">
                  <Play className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <img
                src={fileUrl}
                alt={item.description || 'Progress photo'}
                className="w-full max-h-96 object-contain"
              />
            )}
          </div>
        )}

        {/* Kudos Avatars */}
        {item.recent_kudos && item.recent_kudos.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {item.recent_kudos.slice(0, 5).map((kudo) => (
                <Link key={kudo.id} to={`/users/${kudo.user.id}/profile`}>
                  <Avatar
                    src={kudo.user.profile?.avatar}
                    firstName={kudo.user.first_name}
                    lastName={kudo.user.last_name}
                    username={kudo.user.username}
                    size="xs"
                    className="border-2 border-white hover:border-primary-400 transition-colors"
                  />
                </Link>
              ))}
            </div>
            {kudosCount > item.recent_kudos.length && (
              <span className="text-sm text-gray-600">
                +{kudosCount - item.recent_kudos.length}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-4 pt-2 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleKudo}
            disabled={isTogglingKudo}
            className={`flex items-center space-x-2 ${
              hasKudoed ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            <Heart className={`w-5 h-5 ${hasKudoed ? 'fill-current' : ''}`} />
            <span>{kudosCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommentClick(item.id)}
            className="flex items-center space-x-2 text-gray-600"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{item.comments_count}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

