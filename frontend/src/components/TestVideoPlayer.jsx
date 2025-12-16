import React from 'react';
import ReactPlayer from 'react-player';

const TestVideoPlayer = () => {
  const testVideoUrl = "https://www.youtube.com/watch?v=LS8nyCVVLZ4"; // User's provided URL

  return (
    <div style={{ width: '640px', height: '360px', margin: '20px auto', border: '1px solid red' }}>
      <h3>Isolated ReactPlayer Test</h3>
      <p>Attempting to play: {testVideoUrl}</p>
      <ReactPlayer
        url={testVideoUrl}
        playing={true}
        controls={true}
        width="100%"
        height="100%"
        onReady={() => console.log('TestVideoPlayer: ReactPlayer is READY!')}
        onError={(e) => console.error('TestVideoPlayer: ReactPlayer ERROR:', e)}
        onPlay={() => console.log('TestVideoPlayer: Playing!')}
        onPause={() => console.log('TestVideoPlayer: Paused!')}
        config={{
          youtube: {
            playerVars: {
              modestbranding: 1,
              rel: 0,
              iv_load_policy: 3,
              fs: 1,
              disablekb: 0,
              controls: 1, // Show native YouTube controls for this test
              enablejsapi: 1,
              origin: typeof window !== 'undefined' ? window.location.origin : '',
            }
          }
        }}
      />
    </div>
  );
};

export default TestVideoPlayer;
