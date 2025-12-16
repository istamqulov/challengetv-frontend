import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Trash2, Edit2, X, Play } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { apiClient } from '@/lib/api';
import { formatDateTime, getImageUrl } from '@/lib/utils';
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
      if (pageUrl) {
        // Load next page using full URL
        const fullUrl = pageUrl.startsWith('http') 
          ? pageUrl 
          : `${(apiClient as any).client.defaults.baseURL}${pageUrl}`;
        const response = await (apiClient as any).client.get(fullUrl);
        // Append to existing comments
        setComments(prev => [...prev, ...response.data.results]);
        setNextPage(response.data.next);
      } else {
        // Load first page - getComments returns CommentListResponse directly
        const response = await apiClient.getComments(feedItem.id, { page_size: 20 });
        // Replace comments - response is already CommentListResponse (PaginatedResponse)
        setComments(response.results);
        setNextPage(response.next);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
      setNextPage(null);
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

  const fileUrl = feedItem.file ? getImageUrl(feedItem.file) : null;
  const isVideo = feedItem.type === 'video';

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
            <Link to={`/users/${feedItem.user.id}/profile`} className="flex-shrink-0">
              <Avatar
                src={feedItem.user.profile?.avatar}
                firstName={feedItem.user.first_name}
                lastName={feedItem.user.last_name}
                username={feedItem.user.username}
                size="sm"
              />
            </Link>
            <div className="flex-1">
              <Link 
                to={`/users/${feedItem.user.id}/profile`}
                className="block hover:text-primary-600"
              >
                <div className="font-semibold text-sm text-gray-900">
                  {feedItem.user.first_name && feedItem.user.last_name
                    ? `${feedItem.user.first_name} ${feedItem.user.last_name}`
                    : feedItem.user.username}
                </div>
              </Link>
              <div className="text-xs text-gray-600">
                {feedItem.activity_name} • {formatDateTime(feedItem.uploaded_at)}
              </div>
            </div>
          </div>
          {feedItem.description && (
            <p className="text-sm text-gray-700 mt-2">{feedItem.description}</p>
          )}
        </div>

        {/* File (Image or Video) */}
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
                alt={feedItem.description || 'Progress photo'}
                className="w-full max-h-96 object-contain"
              />
            )}
          </div>
        )}

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
                <Link to={`/users/${comment.user.id}/profile`} className="flex-shrink-0">
                  <Avatar
                    src={comment.user.profile?.avatar}
                    firstName={comment.user.first_name}
                    lastName={comment.user.last_name}
                    username={comment.user.username}
                    size="sm"
                  />
                </Link>
                <div className="flex-1">
                  <Link 
                    to={`/users/${comment.user.id}/profile`}
                    className="block hover:text-primary-600 mb-1"
                  >
                    <div className="font-semibold text-sm text-gray-900">
                      {comment.user.first_name && comment.user.last_name
                        ? `${comment.user.first_name} ${comment.user.last_name}`
                        : comment.user.username}
                    </div>
                  </Link>
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

