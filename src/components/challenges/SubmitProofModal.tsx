import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProofUploadForm, type ProofFormData } from '@/components/challenges/ProofUploadForm';
import { apiClient } from '@/lib/api';
import type { Challenge, Activity, DailyProgress, Participant } from '@/types/api';
import { getErrorMessage } from '@/lib/utils';

interface SubmitProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge;
  participant: Participant;
  onSuccess?: () => void;
}

export const SubmitProofModal: React.FC<SubmitProofModalProps> = ({
  isOpen,
  onClose,
  challenge,
  participant,
  onSuccess,
}) => {
  const [step, setStep] = useState<'select-activity' | 'upload-proof' | 'success'>('select-activity');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('select-activity');
      setSelectedActivity(null);
      setDailyProgress(null);
      setError(null);
    }
  }, [isOpen]);

  // Get or create today's daily progress
  useEffect(() => {
    if (isOpen && step === 'upload-proof' && !dailyProgress) {
      loadDailyProgress();
    }
  }, [isOpen, step]);

  const loadDailyProgress = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      setIsLoading(true);
      let progress = await apiClient.getDailyProgress(participant.id, today);
      
      // If no progress exists for today, create it
      if (!progress) {
        progress = await apiClient.createDailyProgress(participant.id, today);
      }
      
      setDailyProgress(progress);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
    setStep('upload-proof');
  };

  const handleSubmitProof = async (data: ProofFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.createProof(data);
      setStep('success');
      
      // Call onSuccess after a delay to show success message
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err; // Re-throw to let form handle it
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'upload-proof') {
      setStep('select-activity');
      setSelectedActivity(null);
      setDailyProgress(null);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const getModalTitle = () => {
    switch (step) {
      case 'select-activity':
        return 'Выберите активность';
      case 'upload-proof':
        return 'Загрузить доказательство';
      case 'success':
        return 'Успешно!';
      default:
        return 'Отправить отчет';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      size="lg"
    >
      <div className="space-y-4">
        {/* Step 1: Select Activity */}
        {step === 'select-activity' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              Выберите активность, по которой хотите отправить доказательство:
            </p>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {challenge.allowed_activities
                .filter(a => a.is_active)
                .map((allowedActivity) => (
                  <button
                    key={allowedActivity.id}
                    onClick={() => handleActivitySelect(allowedActivity.activity)}
                    className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {allowedActivity.activity.icon && (
                          <img 
                            src={allowedActivity.activity.icon} 
                            alt="" 
                            className="w-8 h-8" 
                          />
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {allowedActivity.activity.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {allowedActivity.activity.hp_per_unit} HP за {allowedActivity.activity.unit_name}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
            </div>

            {challenge.allowed_activities.filter(a => a.is_active).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Нет доступных активностей для этого челленджа</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Upload Proof */}
        {step === 'upload-proof' && selectedActivity && dailyProgress && (
          <div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
            
            <ProofUploadForm
              activity={selectedActivity}
              dailyProgressId={dailyProgress.id}
              onSubmit={handleSubmitProof}
              onCancel={handleBack}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Доказательство отправлено!
            </h3>
            <p className="text-gray-600 mb-4">
              Ваше доказательство будет проверено модераторами в течение 24 часов.
              После одобрения HP будут начислены на ваш счет.
            </p>
            <Button onClick={handleClose} variant="primary">
              Закрыть
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Helper component for chevron icon
const ChevronRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);
