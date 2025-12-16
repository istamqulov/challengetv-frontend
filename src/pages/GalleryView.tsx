import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GalleryItem } from '@/components/challenges/GalleryItem';
import { DiscussionModal } from '@/components/challenges/DiscussionModal';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import type { FeedItem as FeedItemType } from '@/types/api';

export const GalleryView: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [feedItems, setFeedItems] = useState<FeedItemType[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [feedNextPage, setFeedNextPage] = useState<string | null>(null);
  const [discussionModalOpen, setDiscussionModalOpen] = useState(false);
  const [selectedFeedItem, setSelectedFeedItem] = useState<FeedItemType | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load feed items (only with images/videos)
  const loadFeed = useCallback(async () => {
    setIsLoadingFeed(true);
    try {
      const params: any = { page: 1, page_size: 30 };
      const response = await apiClient.getFeed(params);
      // Filter items that have files (images or videos)
      const itemsWithFiles = response.results.filter(item => item.file);
      setFeedItems(itemsWithFiles);
      setFeedNextPage(response.next);
    } catch (error) {
      console.error('Error loading feed:', error);
      setFeedItems([]);
      setFeedNextPage(null);
    } finally {
      setIsLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadFeed();
    }
  }, [isAuthenticated, loadFeed]);

  const loadMoreFeed = useCallback(async () => {
    if (!feedNextPage || isLoadingFeed) return;

    setIsLoadingFeed(true);
    try {
      // Parse the next page URL
      const url = feedNextPage.startsWith('http')
        ? feedNextPage
        : `${(apiClient as any).client.defaults.baseURL}${feedNextPage}`;
      
      const response = await (apiClient as any).client.get(url);
      // Filter items that have files
      const itemsWithFiles = response.data.results.filter((item: FeedItemType) => item.file);
      setFeedItems(prev => [...prev, ...itemsWithFiles]);
      setFeedNextPage(response.data.next);
    } catch (error) {
      console.error('Error loading more feed:', error);
    } finally {
      setIsLoadingFeed(false);
    }
  }, [feedNextPage, isLoadingFeed]);

  // Infinite scroll observer
  useEffect(() => {
    if (!isAuthenticated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && feedNextPage && !isLoadingFeed) {
          loadMoreFeed();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [feedNextPage, isLoadingFeed, isAuthenticated, loadMoreFeed]);

  const handleItemClick = (item: FeedItemType) => {
    setSelectedFeedItem(item);
    setDiscussionModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Пожалуйста, войдите в систему для просмотра галереи</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Галерея</h1>
        
        {isLoadingFeed && feedItems.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : feedItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Пока нет изображений в галерее</p>
          </div>
        ) : (
          <>
            {/* Masonry Gallery Layout */}
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
              {feedItems.map((item) => (
                <GalleryItem
                  key={item.id}
                  item={item}
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </div>
            
            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="h-10 flex justify-center items-center mt-8">
              {isLoadingFeed && feedItems.length > 0 && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              )}
            </div>

            {!feedNextPage && feedItems.length > 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Все изображения загружены
              </div>
            )}
          </>
        )}
      </div>

      {/* Discussion Modal */}
      <DiscussionModal
        isOpen={discussionModalOpen}
        onClose={() => {
          setDiscussionModalOpen(false);
          setSelectedFeedItem(null);
        }}
        feedItem={selectedFeedItem}
      />
    </div>
  );
};
