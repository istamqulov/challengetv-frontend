import React, { useState } from 'react';
import { X, Trophy, Target, Award } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { ChallengeLevel } from '@/types/api';

interface JoinChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (challengeLevelId: number) => void;
  challengeTitle: string;
  levels: ChallengeLevel[];
  isLoading?: boolean;
}

export const JoinChallengeModal: React.FC<JoinChallengeModalProps> = ({
  isOpen,
  onClose,
  onJoin,
  challengeTitle,
  levels,
  isLoading = false,
}) => {
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);

  const handleJoin = () => {
    if (selectedLevelId !== null) {
      onJoin(selectedLevelId);
    }
  };

  const handleClose = () => {
    setSelectedLevelId(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Присоединиться к челленджу
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Выберите уровень сложности
          </h3>
          <p className="text-gray-600 mb-6">
            Каждый уровень имеет свои требования и награды. Выберите подходящий для вас уровень сложности.
          </p>

          {/* Levels Grid */}
          <div className="m-2">
            {levels.map((level) => (
              <Card
                key={level.id}
                padding={true}
                hover
                className={`cursor-pointer transition-all mb-1 ${
                  selectedLevelId === level.id
                    ? 'ring-2 ring-primary-500 bg-primary-50'
                    : 'hover:shadow-md'
                }`}

              >
                <div className="flex items-start space-x-3" onClick={() => setSelectedLevelId(level.id)}>
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedLevelId === level.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Target className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {level.name}
                      </h4>
                      <Badge variant="info">
                        Уровень {level.level_number}
                      </Badge>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Award className="w-4 h-4 mr-1" />
                        <span className="font-medium">Требуется HP в день:</span>
                        <span className="ml-1 font-bold text-primary-600">
                          {level.required_hp_per_day}
                        </span>
                      </div>
                    </div>

                    {level.description && (
                      <div 
                        className="text-sm text-gray-600 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: level.description }}
                      />
                    )}
                  </div>
                </div>

                {/* Selection indicator */}
                {selectedLevelId === level.id && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {selectedLevelId ? (
              <span>
                Выбран уровень: <span className="font-medium text-gray-900">
                  {levels.find(l => l.id === selectedLevelId)?.name}
                </span>
              </span>
            ) : (
              'Выберите уровень для продолжения'
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
              variant="primary"
              onClick={handleJoin}
              disabled={selectedLevelId === null || isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Присоединяемся...</span>
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4" />
                  <span>Присоединиться</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
