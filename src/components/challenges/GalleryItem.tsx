import React from 'react';
import { getImageUrl } from '@/lib/utils';
import type { FeedItem as FeedItemType } from '@/types/api';

interface GalleryItemProps {
  item: FeedItemType;
  onClick: () => void;
}

export const GalleryItem: React.FC<GalleryItemProps> = ({ item, onClick }) => {
  const fileUrl = item.file ? getImageUrl(item.file) : null;
  const isVideo = item.type === 'video';
  
  // Get user display name
  const userName = item.user.first_name && item.user.last_name
    ? `${item.user.first_name} ${item.user.last_name}`
    : item.user.username;

  if (!fileUrl) return null;

  return (
    <div
      className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 break-inside-avoid mb-4"
      onClick={onClick}
    >
      {/* Image or Video */}
      {isVideo ? (
        <div className="relative w-full">
          <video
            src={fileUrl}
            className="w-full h-auto object-cover"
            preload="metadata"
          />
          <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        </div>
      ) : (
        <img
          src={fileUrl}
          alt={item.description || 'Progress photo'}
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      )}

      {/* Overlay gradient for better text visibility on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Username - Top Left (always visible) */}
      <div className="absolute top-2 left-2 z-10">
        <div className="bg-black/70 backdrop-blur-sm rounded-md px-2 py-1 shadow-lg">
          <p className="text-white text-sm font-semibold truncate max-w-[120px]">
            {userName}
          </p>
        </div>
      </div>

      {/* Activity Type and Quantity - Bottom Right (always visible) */}
      <div className="absolute bottom-2 right-2 z-10">
        <div className="bg-black/70 backdrop-blur-sm rounded-md px-2 py-1 text-right shadow-lg">
          <p className="text-white text-xs font-medium">
            {item.activity_name}
          </p>
          <p className="text-white text-xs">
            {item.quantity}
          </p>
        </div>
      </div>
    </div>
  );
};





