import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  const [displayedItem, setDisplayedItem] = useState<FeedItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const loadComments = useCallback(async (pageUrl?: string) => {
    const itemToUse = displayedItem || feedItem;
    if (!itemToUse) return;

    setIsLoading(true);
    try {
      if (pageUrl) {
        const fullUrl = pageUrl.startsWith('http') 
          ? pageUrl 
          : `${(apiClient as any).client.defaults.baseURL}${pageUrl}`;
        const response = await (apiClient as any).client.get(fullUrl);
        setComments(prev => [...prev, ...response.data.results] as Comment[]);
        setNextPage(response.data.next);
      } else {
        const response = await apiClient.getComments(itemToUse.id, { page_size: 20 });
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
  }, [displayedItem, feedItem]);

  useEffect(() => {
    if (isOpen && feedItem) {
      // Initialize displayedItem on first open
      if (!displayedItem || displayedItem.id !== feedItem.id) {
        setDisplayedItem(feedItem);
        scrollYRef.current = 0;
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
      setDisplayedItem(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, feedItem, showComments, loadComments]);

  useEffect(() => {
    if (isOpen && feedItem && showComments) {
      loadComments();
    }
  }, [showComments, isOpen, feedItem, loadComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemToUse = displayedItem || feedItem;
    if (!itemToUse || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const comment = await apiClient.createComment(itemToUse.id, {
        text: newComment.trim(),
      });
      setComments(prev => [comment, ...prev] as Comment[]);
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
        prev.map(c => (c.id === commentId ? updated : c)) as Comment[]
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
    const itemToUse = displayedItem || feedItem;
    if (!itemToUse || isTogglingKudo) return;
    
    setIsTogglingKudo(true);
    try {
      const response = await apiClient.toggleKudo(itemToUse.id);
      setHasKudoed(response.has_kudoed);
      setKudosCount(response.kudos_count);
    } catch (error) {
      console.error('Error toggling kudo:', error);
    } finally {
      setIsTogglingKudo(false);
    }
  };

  // Auto-load more when reaching last item
  useEffect(() => {
    if (!feedItem || !allItems.length || showComments) return;

    const currentIndex = allItems.findIndex(item => item.id === feedItem.id);
    const isLastItem = currentIndex === allItems.length - 1;

    if (isLastItem && hasMore && onLoadMore && !isLoadingMore) {
      // Load more items when user is at the last item
      onLoadMore();
    }
  }, [feedItem, allItems, hasMore, onLoadMore, isLoadingMore, showComments]);

  const scrollYRef = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchYRef = useRef(0);

  // Handle wheel event for scroll detection (desktop)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (showComments) return;
    
    e.preventDefault();
    
    if (!displayedItem || allItems.length === 0) return;
    
    const currentIndex = allItems.findIndex(item => item.id === displayedItem.id);
    if (currentIndex === -1) return;
    
    // Accumulate scroll delta
    scrollYRef.current += e.deltaY;
    const threshold = 50; // pixels to trigger change
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Debounce scroll handling
    scrollTimeoutRef.current = setTimeout(() => {
      if (Math.abs(scrollYRef.current) >= threshold) {
        if (scrollYRef.current < 0 && currentIndex > 0) {
          // Scrolled up - show previous item
          const prevItem = allItems[currentIndex - 1];
          if (prevItem && displayedItem.id !== prevItem.id) {
            setDisplayedItem(prevItem);
            if (onItemChange) {
              onItemChange(prevItem);
            }
          }
        } else if (scrollYRef.current > 0 && currentIndex < allItems.length - 1) {
          // Scrolled down - show next item
          const nextItem = allItems[currentIndex + 1];
          if (nextItem && displayedItem.id !== nextItem.id) {
            setDisplayedItem(nextItem);
            if (onItemChange) {
              onItemChange(nextItem);
            }
          }
        }
        scrollYRef.current = 0;
      } else {
        // Reset if threshold not met
        scrollYRef.current = 0;
      }
    }, 100);
  }, [displayedItem, allItems, showComments, onItemChange]);

  // Handle touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (showComments) return;
    
    const touch = e.touches[0];
    if (touch) {
      touchStartYRef.current = touch.clientY;
      touchYRef.current = 0;
    }
  }, [showComments]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (showComments || touchStartYRef.current === null) return;
    
    const touch = e.touches[0];
    if (touch) {
      const deltaY = touch.clientY - touchStartYRef.current;
      touchYRef.current = deltaY;
    }
  }, [showComments]);

  const handleTouchEnd = useCallback(() => {
    if (showComments || touchStartYRef.current === null) {
      touchStartYRef.current = null;
      touchYRef.current = 0;
      return;
    }
    
    if (!displayedItem || allItems.length === 0) {
      touchStartYRef.current = null;
      touchYRef.current = 0;
      return;
    }
    
    const currentIndex = allItems.findIndex(item => item.id === displayedItem.id);
    if (currentIndex === -1) {
      touchStartYRef.current = null;
      touchYRef.current = 0;
      return;
    }
    
    const threshold = 50; // pixels to trigger change
    const deltaY = touchYRef.current;
    
    if (Math.abs(deltaY) >= threshold) {
      if (deltaY > 0 && currentIndex > 0) {
        // Swiped down - show previous item
        const prevItem = allItems[currentIndex - 1];
        if (prevItem && displayedItem.id !== prevItem.id) {
          setDisplayedItem(prevItem);
          if (onItemChange) {
            onItemChange(prevItem);
          }
        }
      } else if (deltaY < 0 && currentIndex < allItems.length - 1) {
        // Swiped up - show next item
        const nextItem = allItems[currentIndex + 1];
        if (nextItem && displayedItem.id !== nextItem.id) {
          setDisplayedItem(nextItem);
          if (onItemChange) {
            onItemChange(nextItem);
          }
        }
      }
    }
    
    touchStartYRef.current = null;
    touchYRef.current = 0;
  }, [displayedItem, allItems, showComments, onItemChange]);

  if (!isOpen || !feedItem) return null;

  const isOwnComment = (comment: Comment) => {
    return user && comment.user.id === user.id;
  };

  const renderItem = (item: FeedItem) => {
    if (!item || !item.file) return null;
    
    const fileUrl = getImageUrl(item.file);
    if (!fileUrl) return null;
    
    const isVideo = item.type === 'video';
    const isCurrent = displayedItem?.id === item.id;
    
    return (
      <div
        key={item.id}
        className="fixed inset-0 flex items-center justify-center"
        style={{
          opacity: isCurrent ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          pointerEvents: isCurrent ? 'auto' : 'none',
          zIndex: isCurrent ? 10 : 0
        }}
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
            alt={item.description || 'Progress photo'}
            className="max-w-full max-h-full w-auto h-auto object-contain"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center p-4 pointer-events-auto">
          <button
            onClick={onClose}
            className="bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-colors touch-manipulation"
            aria-label="Назад"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-8 pointer-events-auto">
          <div className="flex items-end justify-between">
            {/* Left: User Info */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center space-x-3 mb-3">
                <Link 
                  to={`/users/${item.user.id}/profile`}
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Avatar
                    src={item.user.profile?.avatar}
                    firstName={item.user.first_name}
                    lastName={item.user.last_name}
                    username={item.user.username}
                    size="md"
                    className="border-2 border-white"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link 
                    to={`/users/${item.user.id}/profile`}
                    className="block hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-white font-semibold text-lg truncate">
                      {item.user.first_name && item.user.last_name
                        ? `${item.user.first_name} ${item.user.last_name}`
                        : item.user.username}
                    </div>
                  </Link>
                  <div className="text-white/90 text-sm mt-1">
                    {item.daily_progress_date 
                      ? formatDate(item.daily_progress_date, 'dd.MM.yyyy')
                      : formatDate(item.uploaded_at, 'dd.MM.yyyy')
                    } • {item.activity_name} • {item.quantity}
                  </div>
                </div>
              </div>

              {/* Description */}
              {item.description && (
                <p className="text-white text-sm mb-2 line-clamp-2">
                  {item.description}
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
                {item.comments_count > 0 && (
                  <span className="text-white text-xs mt-1 font-medium">
                    {item.comments_count}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Get items to render (current and adjacent)
  const getItemsToRender = () => {
    if (!displayedItem || allItems.length === 0) {
      return [];
    }
    
    const currentIndex = allItems.findIndex(item => item.id === displayedItem.id);
    if (currentIndex === -1) {
      return [displayedItem];
    }
    
    const items: FeedItem[] = [];
    if (currentIndex > 0) {
      items.push(allItems[currentIndex - 1]);
    }
    items.push(displayedItem);
    if (currentIndex < allItems.length - 1) {
      items.push(allItems[currentIndex + 1]);
    }
    
    return items;
  };

  const itemsToRender = getItemsToRender();

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black overflow-hidden"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      {/* Render items with opacity transition */}
      {itemsToRender.map(item => renderItem(item))}

      {/* Comments Panel */}
      {showComments && displayedItem && (
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





