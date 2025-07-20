import React from 'react';

interface SkeletonProps {
  darkMode: boolean;
  className?: string;
}

export const MessageSkeleton: React.FC<SkeletonProps> = ({ darkMode, className = '' }) => {
  const baseClass = darkMode ? 'bg-gray-700' : 'bg-gray-200';
  const shimmerClass = darkMode ? 'bg-gray-600' : 'bg-gray-300';

  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-4 p-4">
        {/* Received message */}
        <div className="flex justify-start">
          <div className={`max-w-[70%] px-4 py-2 rounded-lg ${baseClass}`}>
            <div className={`h-4 ${shimmerClass} rounded w-48 mb-2`}></div>
            <div className={`h-3 ${shimmerClass} rounded w-24`}></div>
          </div>
        </div>

        {/* Sent message */}
        <div className="flex justify-end">
          <div className={`max-w-[70%] px-4 py-2 rounded-lg bg-blue-500 opacity-50`}>
            <div className="h-4 bg-blue-400 rounded w-36 mb-2"></div>
            <div className="h-3 bg-blue-400 rounded w-20"></div>
          </div>
        </div>

        {/* Another received message */}
        <div className="flex justify-start">
          <div className={`max-w-[70%] px-4 py-2 rounded-lg ${baseClass}`}>
            <div className={`h-4 ${shimmerClass} rounded w-64 mb-2`}></div>
            <div className={`h-4 ${shimmerClass} rounded w-56 mb-2`}></div>
            <div className={`h-3 ${shimmerClass} rounded w-24`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChatSidebarSkeleton: React.FC<SkeletonProps> = ({ darkMode }) => {
  const baseClass = darkMode ? 'bg-gray-700' : 'bg-gray-200';
  const shimmerClass = darkMode ? 'bg-gray-600' : 'bg-gray-300';

  return (
    <div className="animate-pulse space-y-2 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`p-3 rounded-lg ${baseClass}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${shimmerClass}`}></div>
            <div className="flex-1">
              <div className={`h-4 ${shimmerClass} rounded w-32 mb-2`}></div>
              <div className={`h-3 ${shimmerClass} rounded w-48`}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const LeadCardSkeleton: React.FC<SkeletonProps> = ({ darkMode }) => {
  const baseClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const shimmerClass = darkMode ? 'bg-gray-700' : 'bg-gray-200';

  return (
    <div className={`animate-pulse p-4 rounded-lg border ${baseClass}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${shimmerClass}`}></div>
          <div>
            <div className={`h-4 ${shimmerClass} rounded w-24 mb-1`}></div>
            <div className={`h-3 ${shimmerClass} rounded w-16`}></div>
          </div>
        </div>
      </div>

      {/* Procedence badge */}
      <div className={`h-6 ${shimmerClass} rounded-full w-20 mb-3`}></div>

      {/* Notes */}
      <div className={`h-3 ${shimmerClass} rounded w-full mb-2`}></div>
      <div className={`h-3 ${shimmerClass} rounded w-3/4 mb-3`}></div>

      {/* Tags */}
      <div className="flex gap-1 mb-3">
        <div className={`h-6 ${shimmerClass} rounded-full w-16`}></div>
        <div className={`h-6 ${shimmerClass} rounded-full w-16`}></div>
      </div>

      {/* Status */}
      <div className={`h-6 ${shimmerClass} rounded-full w-24 mb-3`}></div>

      {/* Footer */}
      <div className={`pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex justify-between">
          <div className="flex gap-3">
            <div className={`h-3 ${shimmerClass} rounded w-16`}></div>
            <div className={`h-3 ${shimmerClass} rounded w-16`}></div>
          </div>
          <div className={`h-6 w-6 ${shimmerClass} rounded`}></div>
        </div>
      </div>
    </div>
  );
};

export const LeadTableRowSkeleton: React.FC<SkeletonProps> = ({ darkMode }) => {
  const shimmerClass = darkMode ? 'bg-gray-700' : 'bg-gray-200';

  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full ${shimmerClass}`}></div>
          <div>
            <div className={`h-4 ${shimmerClass} rounded w-32 mb-1`}></div>
            <div className={`h-3 ${shimmerClass} rounded w-20`}></div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className={`h-6 ${shimmerClass} rounded-full w-24`}></div>
      </td>
      <td className="px-6 py-4">
        <div className={`h-6 ${shimmerClass} rounded-full w-20`}></div>
      </td>
      <td className="px-6 py-4">
        <div className={`h-4 ${shimmerClass} rounded w-20`}></div>
      </td>
      <td className="px-6 py-4">
        <div className={`h-4 ${shimmerClass} rounded w-20`}></div>
      </td>
      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <div className={`h-8 w-8 ${shimmerClass} rounded`}></div>
          <div className={`h-8 w-8 ${shimmerClass} rounded`}></div>
          <div className={`h-8 w-8 ${shimmerClass} rounded`}></div>
        </div>
      </td>
    </tr>
  );
};
