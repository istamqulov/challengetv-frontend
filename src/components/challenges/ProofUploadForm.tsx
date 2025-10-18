import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, Camera, Video, X, Image, AlertCircle, CheckCircle, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { Activity, ProofType } from '@/types/api';

interface ProofUploadFormProps {
  activity: Activity;
  dailyProgressId: number;
  onSubmit: (data: ProofFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface ProofFormData {
  activity_id: number;
  daily_progress: number;
  quantity: number;
  proof_type: ProofType;
  file: File;
  description?: string;
}

export const ProofUploadForm: React.FC<ProofUploadFormProps> = ({
  activity,
  dailyProgressId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [quantity, setQuantity] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [proofType, setProofType] = useState<ProofType>('photo');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef<number>(0);

  // Динамическое вычисление HP при изменении количества
  const calculatedHP = useMemo(() => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return '0.00';
    return (parseFloat(activity.hp_per_unit.toString()) * qty).toFixed(2);
  }, [quantity, activity.hp_per_unit]);

  // Валидация файла
  const validateFile = (file: File): string | null => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return 'Пожалуйста, выберите изображение или видео файл';
    }

    // Максимальный размер: 50MB
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'Файл слишком большой. Максимальный размер: 50MB';
    }

    return null;
  };

  // Обработка выбора файла
  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const isImage = file.type.startsWith('image/');
    setProofType(isImage ? 'photo' : 'video');
    setSelectedFile(file);

    // Создание превью
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Обработка изменения input file
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFileSelect(file || null);
  };

  // Обработка удаления файла
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and Drop обработчики
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Пожалуйста, выберите файл');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Количество должно быть больше 0');
      return;
    }

    setError(null);

    try {
      await onSubmit({
        activity_id: activity.id,
        daily_progress: dailyProgressId,
        quantity: qty,
        proof_type: proofType,
        file: selectedFile,
        description: description.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке доказательства');
    }
  };

  // Обработка изменения количества
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Разрешаем только числа и десятичную точку
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setQuantity(value);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Загрузить доказательство</h3>
            <p className="text-sm text-gray-600 mt-1">
              {activity.name} • {activity.hp_per_unit} HP за {activity.unit_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Upload with Drag and Drop */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Файл доказательства *
          </label>

          {!selectedFile ? (
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-primary-500 bg-primary-50 scale-[1.02]'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <div className={`transition-transform duration-200 ${isDragging ? 'scale-110' : ''}`}>
                {isDragging ? (
                  <FileUp className="w-12 h-12 text-primary-500 mx-auto mb-3 animate-bounce" />
                ) : (
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                )}
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {isDragging ? 'Отпустите файл здесь' : 'Перетащите файл или нажмите для выбора'}
                </p>
                <p className="text-xs text-gray-500">
                  Фото или видео (до 50MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="relative">
              {/* Preview */}
              <div className="relative rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                {proofType === 'photo' ? (
                  <img
                    src={previewUrl || ''}
                    alt="Preview"
                    className="w-full h-64 object-contain"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center">
                    <div className="text-center">
                      <Video className="w-16 h-16 text-primary-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isLoading}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Удалить файл"
              >
                <X className="w-4 h-4" />
              </button>

              {/* File info */}
              <div className="mt-3 flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg">
                <span className="flex items-center text-gray-700">
                  {proofType === 'photo' ? (
                    <Image className="w-4 h-4 mr-2 text-primary-500" />
                  ) : (
                    <Video className="w-4 h-4 mr-2 text-primary-500" />
                  )}
                  <span className="font-medium">{selectedFile.name}</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  Изменить
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        {/* Quantity with dynamic HP calculation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Количество ({activity.unit_name}) *
          </label>
          <Input
            type="text"
            inputMode="decimal"
            value={quantity}
            onChange={handleQuantityChange}
            placeholder={`Введите количество ${activity.unit_name}`}
            disabled={isLoading}
            required
            className="text-lg font-medium"
          />

          {/* Dynamic HP Calculation */}
          {quantity && parseFloat(quantity) > 0 && (
            <div className="mt-3 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Вы заработаете:</span>
                <span className="text-2xl font-bold text-primary-600 animate-in zoom-in duration-300">
                  {calculatedHP} HP
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{quantity} × {activity.hp_per_unit} HP</span>
                <span className="flex items-center text-green-600 font-medium">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Отлично!
                </span>
              </div>
            </div>
          )}

          {/* Hint when quantity is empty or zero */}
          {(!quantity || parseFloat(quantity) === 0) && (
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Введите количество, чтобы увидеть сколько HP вы заработаете
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Описание (опционально)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Добавьте описание к вашему доказательству..."
            rows={3}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500"
            maxLength={500}
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>Например: место, погода, самочувствие</span>
            <span className={description.length > 450 ? 'text-orange-500 font-medium' : ''}>
              {description.length}/500
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Info message */}
        <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Правила загрузки:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Доказательство должно относиться к сегодняшнему дню</li>
              <li>Файл должен четко демонстрировать выполнение активности</li>
              <li>Модераторы проверят ваше доказательство в течение 24 часов</li>
              <li>Нельзя загружать одно и то же доказательство несколько раз</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            isLoading={isLoading}
            disabled={!selectedFile || !quantity || parseFloat(quantity) <= 0 || isLoading}
          >
            {isLoading ? 'Загрузка...' : 'Отправить доказательство'}
          </Button>
        </div>
      </form>
    </Card>
  );
};