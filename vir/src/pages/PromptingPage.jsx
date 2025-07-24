import { useEffect, useRef } from 'react';
import '../components/PromptingPage.css';

function PromptingPage({ videoUrl, selectedResult, onPromptSubmit }) {
  const videoRef = useRef(null);

  // selectedResult가 있을 때 영상을 해당 시간대로 스크러빙
  useEffect(() => {
    if (selectedResult && videoRef.current) {
      const video = videoRef.current;
      const handleLoadedData = () => {
        video.currentTime = selectedResult.start;
        video.removeEventListener('loadeddata', handleLoadedData);
      };
      
      if (video.readyState >= 2) {
        // 이미 로드된 경우
        video.currentTime = selectedResult.start;
      } else {
        // 로드되기를 기다리는 경우
        video.addEventListener('loadeddata', handleLoadedData);
      }
    }
  }, [selectedResult]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const prompt = formData.get('prompt');
    if (prompt.trim() && onPromptSubmit) {
      onPromptSubmit(prompt);
    }
  };

  return (
    <div className="prompting-page">
      <div className="prompting-container">
        <div className="container-area">
          {/* 영상 영역 */}
          <div className="video-section">
            {videoUrl ? (
              <video 
                ref={videoRef}
                src={videoUrl} 
                controls 
                className="uploaded-video"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="video-placeholder">
                <span>영상을 불러오는 중...</span>
              </div>
            )}
          </div>

          {/* 프롬프트 입력 영역 */}
          <form onSubmit={handleSubmit} className="prompt-form">
            <div className="prompt-input-container">
              <input
                type="text"
                name="prompt"
                placeholder="영상에 대해 질문하세요..."
                className="prompt-input"
                required
              />
              <button type="submit" className="prompt-submit-button">
                검색
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PromptingPage; 