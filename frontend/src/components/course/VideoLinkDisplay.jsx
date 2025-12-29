import { ExternalLink, Play, Video } from 'lucide-react';

/**
 * Simple, reliable video link display component
 * Follows KISS principle - just shows links to videos
 */
const VideoLinkDisplay = ({ videoUrl, title = "Video", className = "" }) => {
  if (!videoUrl) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 text-center ${className}`}>
        <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No video URL provided</p>
      </div>
    );
  }

  // Detect video platform for better UX
  const getPlatformInfo = (url) => {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      return {
        name: 'YouTube',
        icon: '🎥',
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200'
      };
    }

    if (lowerUrl.includes('vimeo.com')) {
      return {
        name: 'Vimeo',
        icon: '🎬',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200'
      };
    }

    if (lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.mov')) {
      return {
        name: 'Video File',
        icon: '📹',
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200'
      };
    }

    return {
      name: 'External Video',
      icon: '🎯',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200'
    };
  };

  const platform = getPlatformInfo(videoUrl);

  return (
    <div className={`border rounded-lg p-4 ${platform.bgColor} ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{platform.icon}</span>
          <div>
            <h4 className="font-medium text-gray-900">{title}</h4>
            <p className={`text-sm ${platform.color}`}>{platform.name}</p>
          </div>
        </div>

        <div className="ml-auto">
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Play className="w-4 h-4" />
            Watch Video
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-600">
        <p>Click "Watch Video" to view on {platform.name}</p>
      </div>
    </div>
  );
};

export default VideoLinkDisplay;
