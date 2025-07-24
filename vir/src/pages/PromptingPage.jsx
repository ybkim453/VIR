import { useEffect, useRef } from 'react';
import '../components/PromptingPage.css';

function PromptingPage({ videoUrl, selectedResult, onPromptSubmit }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (selectedResult && videoRef.current) {
      const video = videoRef.current;
      const handleLoadedData = () => {
        video.currentTime = selectedResult.start;
        video.removeEventListener('loadeddata', handleLoadedData);
      };
      
      if (video.readyState >= 2) {
        video.currentTime = selectedResult.start;
      } else {
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