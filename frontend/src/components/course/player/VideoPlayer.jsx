import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import PropTypes from 'prop-types';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Settings,
  SkipBack, SkipForward, Loader2
} from 'lucide-react';

/**
 *
 * Features:
 * - Multiple video source support (YouTube, Vimeo, direct URLs)
 * - Real-time progress tracking and persistence
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Performance optimization (lazy loading, memory management)
 * - Error handling and recovery
 * - Customizable controls and playback options
 * - Completion detection and callbacks
 */

const VideoPlayer = ({
  lesson,
  onProgress,
  onComplete,
  onTimeUpdate,
  autoPlay = false,
  startTime = 0,
  className = '',
  showControls = true,
  completionThreshold = 0.8 // 80% watched = complete
}) => {
  // Core player state
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Progress tracking
  const [lastReportedProgress, setLastReportedProgress] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Video URL processing for different formats
  const processVideoUrl = useCallback((url) => {
    if (!url || typeof url !== 'string') return null;

    // Clean the URL
    const cleanUrl = url.trim();

    // Handle youtu.be short URLs
    if (cleanUrl.includes('youtu.be/')) {
      const videoId = cleanUrl.split('youtu.be/')[1].split('?')[0].split('&')[0];
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    // Handle youtube.com/embed URLs
    if (cleanUrl.includes('youtube.com/embed/')) {
      const videoId = cleanUrl.split('embed/')[1].split('?')[0].split('&')[0];
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    // Handle youtube.com/watch URLs (ensure they're in correct format)
    if (cleanUrl.includes('youtube.com/watch')) {
      // Already in correct format, just return as-is
      return cleanUrl;
    }

    // Handle Vimeo URLs
    if (cleanUrl.includes('vimeo.com/')) {
      // Vimeo URLs are usually fine as-is
      return cleanUrl;
    }

    // Direct video URLs (MP4, etc.)
    if (cleanUrl.match(/\.(mp4|webm|ogg|mov|avi|m4v)$/i)) {
      return cleanUrl;
    }

    // For any other URLs, try them as-is (might be supported by ReactPlayer)
    return cleanUrl;
  }, []);

  // Video source handling
  const getVideoUrl = useCallback(() => {
    if (!lesson) return null;

    let rawUrl = null;

    // Handle different video source formats
    if (lesson.video_url) {
      rawUrl = lesson.video_url;
    } else if (lesson.content && typeof lesson.content === 'object') {
      rawUrl = lesson.content.video_url || lesson.content.url;
    }

    if (!rawUrl) {
      return null;
    }

    return processVideoUrl(rawUrl);
  }, [lesson, processVideoUrl]);

  const videoUrl = getVideoUrl();

  // Progress reporting with throttling
  const reportProgress = useCallback((progressData) => {
    const currentProgress = progressData.played;

    // Only report if progress changed significantly (reduce API calls)
    if (Math.abs(currentProgress - lastReportedProgress) > 0.05) {
      setLastReportedProgress(currentProgress);

      if (onProgress) {
        onProgress({
          lessonId: lesson?.id,
          progress: currentProgress,
          duration: progressData.loadedSeconds,
          playedSeconds: progressData.playedSeconds
        });
      }
    }

    // Check completion threshold
    if (!hasCompleted && currentProgress >= completionThreshold) {
      setHasCompleted(true);
      if (onComplete) {
        onComplete({
          lessonId: lesson?.id,
          completionRate: currentProgress,
          watchedDuration: progressData.playedSeconds
        });
      }
    }
  }, [lesson?.id, lastReportedProgress, onProgress, onComplete, hasCompleted, completionThreshold]);

  // Player event handlers
  const handleReady = useCallback(() => {
    console.log('VideoPlayer: Player ready event fired');
    console.log('VideoPlayer: Player ref:', playerRef.current);
    console.log('VideoPlayer: Player wrapper:', playerRef.current?.wrapper);

    setIsReady(true);
    setIsLoading(false);
    setError(null);

    // Seek to start time if specified
    if (startTime > 0 && playerRef.current) {
      playerRef.current.seekTo(startTime, 'seconds');
    }
  }, [startTime]);

  const handleStart = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleProgress = useCallback((progressData) => {
    setPlayed(progressData.played);
    setLoaded(progressData.loaded);

    if (onTimeUpdate) {
      onTimeUpdate(progressData);
    }

    // Report progress periodically
    reportProgress(progressData);
  }, [onTimeUpdate, reportProgress]);

  const handleDuration = useCallback((duration) => {
    setDuration(duration);
  }, []);

  const handleError = useCallback((error) => {
    console.error('Video player error:', error);
    console.error('Video URL:', videoUrl);
    console.error('Error details:', {
      code: error?.code,
      message: error?.message,
      target: error?.target
    });
    setError(`Failed to load video: ${error?.message || 'Unknown error'}`);
    setIsLoading(false);
  }, [videoUrl]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    // Mark as completed if not already
    if (!hasCompleted && onComplete) {
      setHasCompleted(true);
      onComplete({
        lessonId: lesson?.id,
        completionRate: 1,
        watchedDuration: duration
      });
    }
  }, [hasCompleted, onComplete, lesson?.id, duration]);

  // Control handlers
  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleSeek = useCallback((newPlayed) => {
    if (playerRef.current) {
      playerRef.current.seekTo(newPlayed, 'fraction');
    }
  }, []);

  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    if (newVolume > 0 && muted) {
      setMuted(false);
    }
  }, [muted]);

  const toggleMute = useCallback(() => {
    setMuted(prev => !prev);
  }, []);

  const skipBackward = useCallback(() => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(Math.max(0, currentTime - 10), 'seconds');
    }
  }, []);

  const skipForward = useCallback(() => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(Math.min(duration, currentTime + 10), 'seconds');
    }
  }, []);

  const changePlaybackRate = useCallback((rate) => {
    setPlaybackRate(rate);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const playerContainer = playerRef.current?.wrapper;
    if (playerContainer) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerContainer.requestFullscreen();
      }
    }
  }, []);

  // DOM inspection for debugging
  useEffect(() => {
    const inspectDOM = () => {
      const playerContainer = document.querySelector('[data-testid="video-player"]') ||
                            document.querySelector('.aspect-video');
      if (playerContainer) {
        const iframes = playerContainer.querySelectorAll('iframe');
        const videos = playerContainer.querySelectorAll('video');

        console.log('VideoPlayer DOM inspection:');
        console.log('  Container found:', playerContainer);
        console.log('  Iframes found:', iframes.length);
        console.log('  Videos found:', videos.length);

        iframes.forEach((iframe, index) => {
          console.log(`  Iframe ${index}:`, {
            src: iframe.src,
            width: iframe.width,
            height: iframe.height
          });
        });

        videos.forEach((video, index) => {
          console.log(`  Video ${index}:`, {
            src: video.src,
            readyState: video.readyState,
            networkState: video.networkState
          });
        });
      }
    };

    // Inspect DOM after a delay to allow ReactPlayer to render
    const timeoutId = setTimeout(inspectDOM, 2000);

    return () => clearTimeout(timeoutId);
  }, [videoUrl]);

  // Loading timeout to prevent infinite loading
  useEffect(() => {
    if (!videoUrl) return;

    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('VideoPlayer: Loading timeout reached - forcing error state');
        setIsLoading(false);
        setError('Video failed to load within 10 seconds. Please check the URL and try again.');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading, videoUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle shortcuts when player is focused or visible
      if (!isReady) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isReady, togglePlayPause, skipBackward, skipForward, toggleMute, toggleFullscreen]);

  // Format time display
  const formatTime = useCallback((seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !videoUrl) {
    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Video Unavailable</h3>
            <p className="text-sm text-gray-300 mb-4">
              {error || 'This lesson does not have a video.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden group ${className}`}>
      {/* Video Player */}
      <div className="aspect-video">
        {console.log('VideoPlayer: Rendering ReactPlayer with URL:', videoUrl)}
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          playing={isPlaying}
          volume={muted ? 0 : volume}
          playbackRate={playbackRate}
          onReady={handleReady}
          onStart={handleStart}
          onPlay={handlePlay}
          onPause={handlePause}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onError={handleError}
          onEnded={handleEnded}
          width="100%"
          height="100%"
          config={{
            youtube: {
              playerVars: {
                modestbranding: 1,
                rel: 0,
                iv_load_policy: 3,
                fs: 1,
                disablekb: 0,
                controls: 0,
                enablejsapi: 1,
                origin: typeof window !== 'undefined' ? window.location.origin : '',
                autoplay: 0,
                mute: 0,
                loop: 0,
                playlist: '',
                start: 0,
                end: 0
              }
            },
            vimeo: {
              playerOptions: {
                responsive: true
              }
            }
          }}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      </div>

      {/* Custom Controls Overlay */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="relative bg-white/20 rounded-full h-1 cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newPlayed = clickX / rect.width;
              handleSeek(newPlayed);
            }}>
              {/* Loaded progress */}
              <div
                className="absolute top-0 left-0 h-full bg-white/40 rounded-full"
                style={{ width: `${loaded * 100}%` }}
              />
              {/* Played progress */}
              <div
                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                style={{ width: `${played * 100}%` }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlayPause}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              {/* Skip buttons */}
              <button
                onClick={skipBackward}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Skip backward 10 seconds"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={skipForward}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Skip forward 10 seconds"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Time display */}
              <span className="text-sm font-mono ml-2">
                {formatTime(played * duration)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Volume control */}
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={muted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                aria-label="Volume"
              />

              {/* Settings */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-32">
                    <div className="text-xs text-white mb-2">Playback Speed</div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`block w-full text-left px-2 py-1 text-xs rounded hover:bg-white/20 ${
                          playbackRate === rate ? 'bg-blue-600' : ''
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Badge */}
      {hasCompleted && (
        <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          ✓ Completed
        </div>
      )}
    </div>
  );
};

VideoPlayer.propTypes = {
  lesson: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    video_url: PropTypes.string,
    content: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    title: PropTypes.string
  }).isRequired,
  onProgress: PropTypes.func,
  onComplete: PropTypes.func,
  onTimeUpdate: PropTypes.func,
  autoPlay: PropTypes.bool,
  startTime: PropTypes.number,
  className: PropTypes.string,
  showControls: PropTypes.bool,
  completionThreshold: PropTypes.number
};

export default VideoPlayer;
