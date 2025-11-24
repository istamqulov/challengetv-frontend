import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Eye } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import type { Participant, Challenge } from '@/types/api';
import { formatDate } from '@/lib/utils';

interface ParticipantsTabProps {
  participants: Participant[];
  participantsLoading: boolean;
  challengeSlug: string;
  challenge?: Challenge;
}

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
  participants,
  participantsLoading,
  challengeSlug,
  challenge,
}) => {
  const navigate = useNavigate();

  const getLevelDetails = (participant: Participant) => {
    // Now challenge_level is already an object, so we can return it directly
    return participant.challenge_level;
  };

  const handleViewProgress = (participant: Participant) => {
    navigate(`/challenges/${challengeSlug}/participants/${participant.id}/progress`);
  };

  return (
    <Card>
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Users className="w-8 h-8 mr-3 text-primary-600" />
        Участники ({participants.length})
      </h2>
      {participantsLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Загрузка участников...</span>
        </div>
      ) : participants.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Участник
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Уровень
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  HP заработано
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Прогресс
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Присоединился
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {participants.map((participant) => (
                <tr key={participant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Link to={`/users/${participant.user.id}/profile`} className="flex-shrink-0">
                        <Avatar
                          firstName={participant.user.first_name}
                          lastName={participant.user.last_name}
                          username={participant.user.username}
                          size="sm"
                        />
                      </Link>
                      <div className="ml-3">
                        <Link 
                          to={`/users/${participant.user.id}/profile`}
                          className="block hover:text-primary-600"
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {participant.user.username}
                          </div>
                        </Link>
                        <div className="text-sm text-gray-500">
                          {participant.user.first_name} {participant.user.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(() => {
                      const level = getLevelDetails(participant);
                      return level ? (
                        <>
                          {level.name}
                          <div className="text-xs text-gray-500">
                            Уровень {level.level_number}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400">Уровень неизвестен</span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                    {participant.total_hp_earned} HP
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">
                          {participant.days_completed}/{participant.days_total} дней
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((participant.days_completed / participant.days_total) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {participant.completion_percentage_display} завершено
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(participant.joined_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewProgress(participant)}
                      className="flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Прогресс</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600 py-8">
          Пока нет участников
        </p>
      )}
    </Card>
  );
};
