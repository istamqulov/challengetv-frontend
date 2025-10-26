import React from 'react';
import { Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import type { Participant, ChallengeLevel } from '@/types/api';
import { formatDate } from '@/lib/utils';

interface ParticipantsTabProps {
  participants: Participant[];
  participantsLoading: boolean;
  challengeLevels: ChallengeLevel[];
}

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
  participants,
  participantsLoading,
  challengeLevels,
}) => {
  const getLevelDetails = (levelId: number) => {
    if (!challengeLevels) return null;
    return challengeLevels.find(level => level.id === levelId);
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
                  Статус
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {participants.map((participant) => (
                <tr key={participant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar
                        firstName={participant.user.first_name}
                        lastName={participant.user.last_name}
                        username={participant.user.username}
                        size="sm"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {participant.user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {participant.user.first_name} {participant.user.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant={
                        participant.status === 'active' ? 'success' :
                        participant.status === 'completed' ? 'default' :
                        participant.status === 'failed' ? 'danger' : 'warning'
                      }
                    >
                      {participant.status === 'active' && 'Активный'}
                      {participant.status === 'completed' && 'Завершен'}
                      {participant.status === 'failed' && 'Не прошел'}
                      {participant.status === 'withdrew' && 'Покинул'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(() => {
                      const level = getLevelDetails(participant.challenge_level);
                      return level ? (
                        <>
                          {level.name}
                          <div className="text-xs text-gray-500">
                            Уровень {level.level_number}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400">Уровень {participant.challenge_level}</span>
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
                          {participant.completion_percentage}% завершено
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(participant.joined_at)}
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
