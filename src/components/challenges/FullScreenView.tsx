import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Send, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { apiClient } from '@/lib/api';
import { formatDateTime, getImageUrl, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import type { Comment, FeedItem } from '@/types/api';

interface FullScreenViewProps {
  isOpen: boolean;
  onClose: () => void;
  feedItem: FeedItem | null;
  allItems?: FeedItem[];
  onItemChange?: (item: FeedItem) => void;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export const FullScreenView: React.FC<FullScreenViewProps> = ({
  isOpen,
  onClose,
  feedItem,
  allItems = [],
  onItemChange,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [kudosCount, setKudosCount] = useState<number>(0);
  const [hasKudoed, setHasKudoed] = useState<boolean>(false);
  const [isTogglingKudo, setIsTogglingKudo] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | null>(null);
  const [currentItem, setCurrentItem] = useState<FeedItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && feedItem) {
      if (currentItem?.id !== feedItem.id) {
        // Item changed - reset transition state
        setCurrentItem(feedItem);
        setSlideDirection(null);
      }
      setKudosCount(feedItem.kudos_count);
      setHasKudoed(feedItem.has_user_kudoed);
      if (showComments) {
        loadComments();
      } else {
        // Reset comments when item changes and comments panel is closed
        setComments([]);
        setNewComment('');
        setEditingCommentId(null);
        setEditingText('');
        setNextPage(null);
      }
    } else {
      setComments([]);
      setNewComment('');
      setEditingCommentId(null);
      setEditingText('');
      setNextPage(null);
      setKudosCount(0);
      setHasKudoed(false);
      setShowComments(false);
      setCurrentItem(null);
      setSlideDirection(null);
    }
  }, [isOpen, feedItem]);

  useEffect(() => {
    if (isOpen && feedItem && showComments) {
      loadComments();
    }
  }, [showComments]);

  const loadComments = async (pageUrl?: string) => {
    if (!feedItem) return;

    setIsLoading(true);
    try {
      if (pageUrl) {
        const fullUrl = pageUrl.startsWith('http') 
          ? pageUrl 
          : `${(apiClient as any).client.defaults.baseURL}${pageUrl}`;
        const response = await (apiClient as any).client.get(fullUrl);
        setComments(prev => [...prev, ...response.data.results]);
        setNextPage(response.data.next);
      } else {
        const response = await apiClient.getComments(feedItem.id, { page_size: 20 });
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

  const handleToggleKudo = async () => {
    if (!feedItem || isTogglingKudo) return;
    
    setIsTogglingKudo(true);
    try {
      const response = await apiClient.toggleKudo(feedItem.id);
      setHasKudoed(response.has_kudoed);
      setKudosCount(response.kudos_count);
    } catch (error) {
      console.error('Error toggling kudo:', error);
    } finally {
      setIsTogglingKudo(false);
    }
  };

  // Swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    if (showComments) return; // Don't handle swipe when comments panel is open
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (showComments) return;
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (showComments || !touchStart || !touchEnd || !feedItem || allItems.length === 0 || isTransitioning) return;
    
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isUpSwipe) {
      // Swipe up - next item
      navigateToItem('next');
    } else if (isDownSwipe) {
      // Swipe down - previous item
      navigateToItem('prev');
    }
  };

  const navigateToItem = async (direction: 'next' | 'prev') => {
    if (!feedItem || allItems.length === 0 || isTransitioning) return;

    const currentIndex = allItems.findIndex(item => item.id === feedItem.id);
    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'next') {
      newIndex = currentIndex + 1;
      
      // If at last item and has more, load more
      if (newIndex >= allItems.length) {
        if (hasMore && onLoadMore && !isLoadingMore) {
          await onLoadMore();
          // After loading, try again with updated list
          const updatedIndex = allItems.findIndex(item => item.id === feedItem.id);
          if (updatedIndex !== -1 && updatedIndex + 1 < allItems.length) {
            newIndex = updatedIndex + 1;
          } else {
            return; // Still at last item after loading
          }
        } else {
          return; // Already at last item and no more to load
        }
      }
    } else {
      newIndex = currentIndex - 1;
      if (newIndex < 0) return; // Already at first item
    }

    const newItem = allItems[newIndex];
    if (!newItem) return;

    setIsTransitioning(true);
    setSlideDirection(direction === 'next' ? 'up' : 'down');
    setShowComments(false);
    setComments([]);
    setNewComment('');
    setEditingCommentId(null);
    setEditingText('');
    setNextPage(null);

    // Update item with callback
    if (onItemChange) {
      onItemChange(newItem);
    }

    // Reset transition after animation
    setTimeout(() => {
      setIsTransitioning(false);
      setSlideDirection(null);
    }, 400);
  };

  if (!isOpen || !feedItem) return null;

  const fileUrl = feedItem.file ? getImageUrl(feedItem.file) : null;
  const isVideo = feedItem.type === 'video';
  const userName = feedItem.user.first_name && feedItem.user.last_name
    ? `${feedItem.user.first_name} ${feedItem.user.last_name}`
    : feedItem.user.username;
  const isOwnComment = (comment: Comment) => {
    return user && comment.user.id === user.id;
  };

  // Calculate transform for slide animation
  const getSlideTransform = () => {
    if (!isTransitioning || !slideDirection) return 'translateY(0)';
    if (slideDirection === 'up') {
      return 'translateY(-100%)';
    } else {
      return 'translateY(100%)';
    }
  };

  const getNextSlideTransform = () => {
    if (!isTransitioning || !slideDirection) {
      // Hide next element when not transitioning
      if (slideDirection === 'up') {
        return 'translateY(100%)';
      } else {
        return 'translateY(-100%)';
      }
    }
    if (slideDirection === 'up') {
      // Next item slides up from bottom
      return 'translateY(0)';
    } else {
      // Previous item slides down from top
      return 'translateY(0)';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black touch-none overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Current Background Image/Video */}
      {fileUrl && (
        <div 
          className="absolute inset-0 flex items-center justify-center transition-transform duration-400 ease-in-out"
          style={{ transform: getSlideTransform() }}
        >
          {isVideo ? (
            <video
              src={fileUrl}
              controls
              loop
              playsInline
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          ) : (
            <img
              src={fileUrl}
              alt={feedItem.description || 'Progress photo'}
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          )}
          {/* Dark overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Next Background Image/Video (for smooth transition) */}
      {isTransitioning && allItems.length > 0 && (() => {
        const currentIndex = allItems.findIndex(item => item.id === currentItem?.id);
        if (currentIndex === -1) return null;
        
        const nextIndex = slideDirection === 'up' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex < 0 || nextIndex >= allItems.length) return null;
        
        const nextItem = allItems[nextIndex];
        const nextFileUrl = nextItem.file ? getImageUrl(nextItem.file) : null;
        const nextIsVideo = nextItem.type === 'video';
        
        if (!nextFileUrl) return null;
        
        // Calculate initial position for next item
        const getInitialNextTransform = () => {
          if (slideDirection === 'up') {
            return 'translateY(100%)'; // Starts from bottom
          } else {
            return 'translateY(-100%)'; // Starts from top
          }
        };
        
        return (
          <div 
            className="absolute inset-0 flex items-center justify-center transition-transform duration-400 ease-in-out"
            style={{ 
              transform: isTransitioning ? getNextSlideTransform() : getInitialNextTransform()
            }}
          >
            {nextIsVideo ? (
              <video
                src={nextFileUrl}
                controls
                loop
                playsInline
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            ) : (
              <img
                src={nextFileUrl}
                alt={nextItem.description || 'Progress photo'}
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            )}
            {/* Dark overlay for better text visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
          </div>
        );
      })()}

      {/* Top Bar */}
      <div 
        className="absolute top-0 left-0 right-0 z-10 flex items-center p-4 transition-transform duration-400 ease-in-out"
        style={{ transform: getSlideTransform() }}
      >
        {/* Back Button */}
        <button
          onClick={onClose}
          className="bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-colors touch-manipulation"
          aria-label="Назад"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Info */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-8 transition-transform duration-400 ease-in-out"
        style={{ transform: getSlideTransform() }}
      >
        <div className="flex items-end justify-between">
          {/* Left: User Info */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center space-x-3 mb-3">
              <Link 
                to={`/users/${feedItem.user.id}/profile`}
                className="flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar
                  src={feedItem.user.profile?.avatar}
                  firstName={feedItem.user.first_name}
                  lastName={feedItem.user.last_name}
                  username={feedItem.user.username}
                  size="md"
                  className="border-2 border-white"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link 
                  to={`/users/${feedItem.user.id}/profile`}
                  className="block hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-white font-semibold text-lg truncate">
                    {userName}
                  </div>
                </Link>
                <div className="text-white/90 text-sm mt-1">
                  {feedItem.daily_progress_date 
                    ? formatDate(feedItem.daily_progress_date, 'dd.MM.yyyy')
                    : formatDate(feedItem.uploaded_at, 'dd.MM.yyyy')
                  } • {feedItem.activity_name} • {feedItem.quantity}
                </div>
              </div>
            </div>

            {/* Description */}
            {feedItem.description && (
              <p className="text-white text-sm mb-2 line-clamp-2">
                {feedItem.description}
              </p>
            )}
          </div>

          {/* Right: Actions (Like and Comments) */}
          <div className="flex flex-col items-center space-y-4">
            {/* Like Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleToggleKudo}
                disabled={isTogglingKudo}
                className={`bg-black/50 backdrop-blur-sm rounded-full p-3 text-white hover:bg-black/70 transition-colors touch-manipulation ${
                  hasKudoed ? 'text-red-500' : ''
                }`}
                aria-label="Лайк"
              >
                <Heart className={`w-6 h-6 ${hasKudoed ? 'fill-current' : ''}`} />
              </button>
              {kudosCount > 0 && (
                <span className="text-white text-xs mt-1 font-medium">
                  {kudosCount}
                </span>
              )}
            </div>

            {/* Comments Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setShowComments(!showComments)}
                className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-white hover:bg-black/70 transition-colors touch-manipulation"
                aria-label="Комментарии"
              >
                <MessageCircle className="w-6 h-6" />
              </button>
              {feedItem.comments_count > 0 && (
                <span className="text-white text-xs mt-1 font-medium">
                  {feedItem.comments_count}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comments Panel */}
      {showComments && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl max-h-[70vh] flex flex-col">
          {/* Comments Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Комментарии</h3>
            <button
              onClick={() => setShowComments(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  <Link 
                    to={`/users/${comment.user.id}/profile`} 
                    className="flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                      className="block hover:underline mb-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="font-semibold text-sm text-gray-900">
                        {comment.user.first_name && comment.user.last_name
                          ? `${comment.user.first_name} ${comment.user.last_name}`
                          : comment.user.username}
                      </div>
                    </Link>
                    <div className="bg-gray-50 rounded-lg p-3">
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
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-gray-500">
                              {formatDateTime(comment.created_at)}
                              {comment.updated_at !== comment.created_at && ' (изменено)'}
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Load More */}
            {nextPage && (
              <div className="text-center pt-4">
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
          <form onSubmit={handleSubmitComment} className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Написать комментарий..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                rows={2}
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
