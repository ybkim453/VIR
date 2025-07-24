import '../components/UploadPage.css';

function UploadPage({ onVideoUpload }) {
  return (
    <div className="upload-page">
      <input
        type="file"
        accept="video/*"
        onChange={onVideoUpload}
        style={{ display: 'none' }}
        id="video-upload"
      />
      <label htmlFor="video-upload" className="upload-container">
        <div className="upload-area">
          <div className="upload-header">
            <h2>Insert video here</h2>
          </div>
          <div className="upload-bottom">
            <div className="file-input-area"></div>
            <div className="upload-button">
              upload
            </div>
          </div>
        </div>
      </label>
    </div>
  );
}

export default UploadPage; 