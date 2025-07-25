import { useState, useRef, useEffect } from 'react';
import '../components/CheckPage.css';

function CheckPage({ videoUrl, searchResults, currentResultIndex = 0, onYesClick, onNoClick }) {
  const currentResult = searchResults && searchResults[currentResultIndex];
  const videoRef = useRef(null);

  // currentResultIndex가 변경될 때마다 영상을 해당 시간대로 이동
  useEffect(() => {
    if (currentResult && videoRef.current) {
      const video = videoRef.current;
      const handleLoadedData = () => {
        video.currentTime = currentResult.start;
        video.removeEventListener('loadeddata', handleLoadedData);
      };
      
      if (video.readyState >= 2) {
        // 이미 로드된 경우
        video.currentTime = currentResult.start;
      } else {
        // 로드되기를 기다리는 경우
        video.addEventListener('loadeddata', handleLoadedData);
      }
    }
  }, [currentResult, currentResultIndex]);
  
  if (!currentResult) {
    return (
      <div className="check-page">
        <div className="check-container">
          <div className="no-results">
            <span>검색 결과가 없습니다.</span>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const startTime = currentResult.start;
  const endTime = currentResult.end;
  const timeRange = `${formatTime(startTime)} ~ ${formatTime(endTime)}`;

  return (
    <div className="check-page">
      <div className="check-container">
        <div className="check-area">
          {/* 질문과 시간대 */}
          <div className="question-section">
            <h2>이 장면이 맞나요?</h2>
            <span className="time-range">{timeRange}</span>
          </div>

          <div className="video-frame-section">
            {videoUrl ? (
              <video 
                ref={videoRef}
                src={videoUrl} 
                className="result-video"
                controls={false}
                muted
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="video-placeholder">
                <span>영상을 불러오는 중...</span>
              </div>
            )}
          </div>

          <div className="choice-buttons">
            <button 
              className="choice-button yes-button"
              onClick={() => onYesClick && onYesClick(currentResult)}
            >
              예
            </button>
            <button 
              className="choice-button no-button"
              onClick={() => onNoClick && onNoClick(currentResultIndex)}
            >
              아니오
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckPage; 