import React, { useEffect, useState } from 'react';
import { Send, Trash2, Edit2, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { apiClient } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import type { Comment, FeedItem } from '@/types/api';

interface DiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedItem: FeedItem | null;
}

export const DiscussionModal: React.FC<DiscussionModalProps> = ({
  isOpen,
  onClose,
  feedItem,
}) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [nextPage, setNextPage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && feedItem) {
      loadComments();
    } else {
      setComments([]);
      setNewComment('');
      setEditingCommentId(null);
      setEditingText('');
      setNextPage(null);
    }
  }, [isOpen, feedItem]);

  const loadComments = async (pageUrl?: string) => {
    if (!feedItem) return;

    setIsLoading(true);
    try {
      let response;
      if (pageUrl) {
        // Load next page using full URL
        const fullUrl = pageUrl.startsWith('http') 
          ? pageUrl 
          : `${(apiClient as any).client.defaults.baseURL}${pageUrl}`;
        response = await (apiClient as any).client.get(fullUrl);
      } else {
        response = await apiClient.getComments(feedItem.id, { page_size: 20 });
      }
      
      if (pageUrl) {
        // Append to existing comments
        setComments(prev => [...prev, ...response.data.results]);
      } else {
        // Replace comments
        setComments(response.data.results);
      }
      setNextPage(response.data.next);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedItem || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const comment = await apiClient.createComment(feedItem.id, {
        text: newComment.trim(),
      });
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editingText.trim()) return;

    try {
      const updated = await apiClient.updateComment(commentId, {
        text: editingText.trim(),
      });
      setComments(prev =>
        prev.map(c => (c.id === commentId ? updated : c))
      );
      setEditingCommentId(null);
      setEditingText('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) return;

    try {
      await apiClient.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  if (!feedItem) return null;

  const isOwnComment = (comment: Comment) => {
    return user && comment.user.id === user.id;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Обсуждение"
      size="lg"
    >
      <div className="space-y-4">
        {/* Feed Item Summary */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-3 mb-2">
            <Avatar
              src={feedItem.user.profile?.avatar}
              firstName={feedItem.user.first_name}
              lastName={feedItem.user.last_name}
              username={feedItem.user.username}
              size="sm"
            />
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-900">
                {feedItem.user.first_name && feedItem.user.last_name
                  ? `${feedItem.user.first_name} ${feedItem.user.last_name}`
                  : feedItem.user.username}
              </div>
              <div className="text-xs text-gray-600">
                {feedItem.activity_name} • {formatDateTime(feedItem.uploaded_at)}
              </div>
            </div>
          </div>
          {feedItem.description && (
            <p className="text-sm text-gray-700 mt-2">{feedItem.description}</p>
          )}
        </div>

        {/* Comments List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {isLoading && comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Загрузка комментариев...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Пока нет комментариев. Будьте первым!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar
                  src={comment.user.profile?.avatar}
                  firstName={comment.user.first_name}
                  lastName={comment.user.last_name}
                  username={comment.user.username}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-sm text-gray-900">
                        {comment.user.first_name && comment.user.last_name
                          ? `${comment.user.first_name} ${comment.user.last_name}`
                          : comment.user.username}
                      </div>
                      {isOwnComment(comment) && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEditing(comment)}
                            className="text-gray-400 hover:text-primary-600 transition-colors"
                            title="Редактировать"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleUpdateComment(comment.id)}
                          >
                            Сохранить
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {comment.text}
                        </p>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDateTime(comment.created_at)}
                          {comment.updated_at !== comment.created_at && ' (изменено)'}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Load More */}
          {nextPage && (
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadComments(nextPage)}
                disabled={isLoading}
              >
                {isLoading ? 'Загрузка...' : 'Загрузить еще'}
              </Button>
            </div>
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmitComment} className="space-y-2">
          <div className="flex space-x-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Написать комментарий..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
              rows={3}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
              className="self-start"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

