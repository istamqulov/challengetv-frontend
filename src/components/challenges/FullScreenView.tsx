import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Send, Trash2, Edit2 } from 'lucide-react';
import { motion, useMotionValue, useTransform, useSpring, PanInfo } from 'framer-motion';
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
  const [currentItem, setCurrentItem] = useState<FeedItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize motion values only when component is mounted
  // These must be called before any conditional returns
  const y = useMotionValue(0);
  const springConfig = { damping: 30, stiffness: 300 };
  const ySpring = useSpring(y, springConfig);
  
  // Get window height safely (must be before conditional return)
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  
  // Transform values for current and next/prev items (must be before conditional return)
  const currentY = useTransform(ySpring, (value) => value || 0);
  const nextY = useTransform(ySpring, (value) => {
    const val = value || 0;
    return val < 0 ? windowHeight + val : windowHeight;
  });
  const prevY = useTransform(ySpring, (value) => {
    const val = value || 0;
    return val > 0 ? -windowHeight + val : -windowHeight;
  });

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
  }, [feedItem]);

  useEffect(() => {
    if (isOpen && feedItem) {
      if (currentItem?.id !== feedItem.id) {
        // Item changed - reset transition state
        setCurrentItem(feedItem);
        // Reset y position when item changes
        y.set(0);
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
      y.set(0);
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

  // Drag handlers
  const minSwipeDistance = 40; // Minimum distance to trigger navigation (50-100px)

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

  const navigateToItem = async (direction: 'next' | 'prev') => {
    if (!feedItem || allItems.length === 0 || isTransitioning) {
      y.set(0);
      return;
    }

    const currentIndex = allItems.findIndex(item => item.id === feedItem.id);
    if (currentIndex === -1) {
      y.set(0);
      return;
    }

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
            // Still at last item after loading - animate back
            y.set(0);
            return;
          }
        } else {
          // Already at last item and no more to load - animate back
          y.set(0);
          return;
        }
      }
    } else {
      newIndex = currentIndex - 1;
      if (newIndex < 0) {
        // Already at first item - animate back
        y.set(0);
        return;
      }
    }

    const newItem = allItems[newIndex];
    if (!newItem) {
      y.set(0);
      return;
    }

    setIsTransitioning(true);
    setShowComments(false);
    setComments([]);
    setNewComment('');
    setEditingCommentId(null);
    setEditingText('');
    setNextPage(null);

    // Get current position and animate to completion
    const currentY = y.get();
    const windowHeight = window.innerHeight;
    
    // Continue animation from current position to full screen
    const targetY = direction === 'next' ? -windowHeight : windowHeight;
    
    // Animate smoothly to target
    y.set(targetY);

    // Update item after animation completes
    setTimeout(() => {
      if (onItemChange) {
        onItemChange(newItem);
      }
      // Reset position for new item
      y.set(0);
      setIsTransitioning(false);
    }, 400);
  };

  if (!isOpen || !feedItem) return null;

  const isOwnComment = (comment: Comment) => {
    return user && comment.user.id === user.id;
  };

  // Get current, previous, and next items to render
  const getItemsToRender = () => {
    if (!feedItem || allItems.length === 0) {
      return { prev: null, current: null, next: null };
    }
    
    const currentIndex = allItems.findIndex(item => item.id === feedItem.id);
    if (currentIndex === -1) {
      return { prev: null, current: feedItem, next: null };
    }
    
    const prev = currentIndex > 0 ? allItems[currentIndex - 1] : null;
    const current = feedItem;
    const next = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;
    
    return { prev, current, next };
  };

  const { prev: prevItem, current: currentItemToRender, next: nextItem } = getItemsToRender();

  const handleTouchStart = (e: React.TouchEvent) => {
    if (showComments) return;
    e.preventDefault(); // Prevent default scroll behavior
    const touch = e.touches[0];
    if (touch) {
      setTouchStart(touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (showComments || touchStart === null) return;
    e.preventDefault(); // Prevent default scroll behavior
    const touch = e.touches[0];
    if (touch) {
      const deltaY = touch.clientY - touchStart;
      // Update position in real-time based on finger position
      y.set(deltaY);
      
      // Check if we should auto-navigate (but don't navigate while finger is still on screen)
      // We'll handle navigation in touchEnd
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent default scroll behavior
    
    if (showComments) {
      setTouchStart(null);
      return;
    }
    
    if (touchStart === null) {
      return;
    }
    
    // Get the final position from the last touch move
    const touch = e.changedTouches[0];
    if (!touch) {
      setTouchStart(null);
      y.set(0);
      return;
    }
    
    const finalDeltaY = touch.clientY - touchStart;
    const shouldNavigate = Math.abs(finalDeltaY) >= minSwipeDistance;
    
    if (shouldNavigate && finalDeltaY < 0) {
      // Swipe up - next item (user scrolled up, so show next item)
      navigateToItem('next');
    } else if (shouldNavigate && finalDeltaY > 0) {
      // Swipe down - previous item (user scrolled down, so show previous item)
      navigateToItem('prev');
    } else {
      // Not enough distance - return to original position with spring animation
      y.set(0);
    }
    
    setTouchStart(null);
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black overflow-hidden"
      style={{ touchAction: 'none', userSelect: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={(e) => e.preventDefault()} // Prevent mouse drag
      onMouseMove={(e) => e.preventDefault()} // Prevent mouse drag
    >
      {/* Previous Background Image/Video (above current) */}
      {prevItem && prevItem.file && (() => {
        const prevFileUrl = getImageUrl(prevItem.file);
        const prevIsVideo = prevItem.type === 'video';
        if (!prevFileUrl) return null;
        
        return (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ y: prevY }}
            key={`prev-${prevItem.id}`}
          >
            {prevIsVideo ? (
              <video
                src={prevFileUrl}
                controls
                loop
                playsInline
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            ) : (
              <img
                src={prevFileUrl}
                alt={prevItem.description || 'Progress photo'}
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
          </motion.div>
        );
      })()}

      {/* Current Background Image/Video */}
      {currentItemToRender && currentItemToRender.file && (() => {
        const currentFileUrl = getImageUrl(currentItemToRender.file);
        const currentIsVideo = currentItemToRender.type === 'video';
        if (!currentFileUrl) return null;
        
        return (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ y: currentY }}
            key={`current-${currentItemToRender.id}`}
          >
            {currentIsVideo ? (
              <video
                src={currentFileUrl}
                controls
                loop
                playsInline
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            ) : (
              <img
                src={currentFileUrl}
                alt={currentItemToRender.description || 'Progress photo'}
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
          </motion.div>
        );
      })()}

      {/* Next Background Image/Video (below current) */}
      {nextItem && nextItem.file && (() => {
        const nextFileUrl = getImageUrl(nextItem.file);
        const nextIsVideo = nextItem.type === 'video';
        if (!nextFileUrl) return null;
        
        return (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ y: nextY }}
            key={`next-${nextItem.id}`}
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
          </motion.div>
        );
      })()}

      {/* Top Bar - only show for current item */}
      {currentItemToRender && (
        <motion.div 
          className="absolute top-0 left-0 right-0 z-10 flex items-center p-4 pointer-events-auto"
          style={{ y: currentY }}
        >
          {/* Back Button */}
          <button
            onClick={onClose}
            className="bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-colors touch-manipulation"
            aria-label="Назад"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </motion.div>
      )}

      {/* Bottom Info - only show for current item */}
      {currentItemToRender && (
        <motion.div 
          className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-8 pointer-events-auto"
          style={{ y: currentY }}
        >
          <div className="flex items-end justify-between">
            {/* Left: User Info */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center space-x-3 mb-3">
                <Link 
                  to={`/users/${currentItemToRender.user.id}/profile`}
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Avatar
                    src={currentItemToRender.user.profile?.avatar}
                    firstName={currentItemToRender.user.first_name}
                    lastName={currentItemToRender.user.last_name}
                    username={currentItemToRender.user.username}
                    size="md"
                    className="border-2 border-white"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link 
                    to={`/users/${currentItemToRender.user.id}/profile`}
                    className="block hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-white font-semibold text-lg truncate">
                      {currentItemToRender.user.first_name && currentItemToRender.user.last_name
                        ? `${currentItemToRender.user.first_name} ${currentItemToRender.user.last_name}`
                        : currentItemToRender.user.username}
                    </div>
                  </Link>
                  <div className="text-white/90 text-sm mt-1">
                    {currentItemToRender.daily_progress_date 
                      ? formatDate(currentItemToRender.daily_progress_date, 'dd.MM.yyyy')
                      : formatDate(currentItemToRender.uploaded_at, 'dd.MM.yyyy')
                    } • {currentItemToRender.activity_name} • {currentItemToRender.quantity}
                  </div>
                </div>
              </div>

              {/* Description */}
              {currentItemToRender.description && (
                <p className="text-white text-sm mb-2 line-clamp-2">
                  {currentItemToRender.description}
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
                {currentItemToRender.comments_count > 0 && (
                  <span className="text-white text-xs mt-1 font-medium">
                    {currentItemToRender.comments_count}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

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
