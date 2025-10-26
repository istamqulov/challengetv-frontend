import React from 'react';
import { Activity } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const SendProgressTab: React.FC = () => {
  return (
    <Card>
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Activity className="w-8 h-8 mr-3 text-primary-600" />
        Отправить прогресс
      </h2>
      <div className="text-center py-12">
        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Раздел в разработке
        </h3>
        <p className="text-gray-600">
          Здесь будет форма для отправки вашего прогресса
        </p>
      </div>
    </Card>
  );
};
