import { useState } from 'react';
import { TwelveLabs } from 'twelvelabs-js';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('upload'); // 'upload' | 'player'
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [index, setIndex] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(''); // 업로드 상태 메시지

  // TwelveLabs 클라이언트 초기화 (.env에서 API 키 읽기)
  let client = null;
  try {
    const apiKey = import.meta.env.TL_API_KEY || "tlk_0RFWNZG13Q2G9E2KHNXCT1RF6VN0";
    client = new TwelveLabs({ apiKey });
    console.log('TwelveLabs client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize TwelveLabs client:', error);
  }

  // 영상 업로드 핸들러
  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setCurrentView('player');

      // TwelveLabs에 영상 업로드
      if (!client) {
        console.error('TwelveLabs client not available');
        return;
      }

      try {
        // 인덱스 생성
        setUploadStatus('인덱스 생성 중...');
        const newIndex = await client.index.create({
          name: `vir-${Date.now()}`,
          models: [
            { name: "marengo2.7", options: ["visual", "audio"] },
            { name: "pegasus1.2", options: ["visual", "audio"] }
          ]
        });
        setIndex(newIndex);

        // 영상 업로드 (REST API 직접 호출)
        setUploadStatus('영상 업로드 중...');
        
        // 파일 정보 로그
        console.log('File info:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });
        
        const formData = new FormData();
        formData.append('video_file', file);
        formData.append('index_id', newIndex.id);
        formData.append('language', 'ko');
        
        const apiKey = import.meta.env.TL_API_KEY || "tlk_0RFWNZG13Q2G9E2KHNXCT1RF6VN0";
        const response = await fetch('https://api.twelvelabs.io/v1.3/tasks', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey
          },
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error Details:', errorData);
          throw new Error(`API Error: ${errorData.message || errorData.code || response.status}`);
        }
        
        const task = await response.json();
        setUploadStatus('영상 처리 중...');

        // 업로드 완료 대기 (REST API 직접 호출)
        const checkStatus = async () => {
          try {
            const statusResponse = await fetch(`https://api.twelvelabs.io/v1.3/tasks/${task._id}`, {
              headers: {
                'x-api-key': apiKey
              }
            });
            const updatedTask = await statusResponse.json();
            
            if (updatedTask.status === 'ready') {
              setVideoId(updatedTask.video_id);
              setUploadStatus('업로드 완료! 이제 검색할 수 있습니다.');
            } else if (updatedTask.status === 'failed') {
              setUploadStatus('업로드 실패');
            } else {
              setTimeout(checkStatus, 5000);
            }
          } catch (error) {
            setUploadStatus('오류 발생');
          }
        };
        checkStatus();

      } catch (error) {
        setUploadStatus('업로드 오류 발생');
      }
    }
  };

  // 검색 핸들러
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('검색어를 입력해주세요.');
      return;
    }

    if (!client) {
      alert('TwelveLabs 클라이언트가 초기화되지 않았습니다.');
      return;
    }

    if (!index || !videoId) {
      alert('영상이 아직 처리 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for:', searchQuery);
      const results = await client.search.query({
        indexId: index.id,           // 올바른 키 이름
        queryText: searchQuery,      // 올바른 키 이름
        options: ["visual", "audio"]
      });

      const searchData = [];
      for (const clip of results.data) {
        searchData.push({
          start: clip.start,
          end: clip.end,
          score: clip.score
        });
      }

      setSearchResults(searchData);
      console.log('Search results:', searchData);

      // 첫 번째 결과로 영상 이동
      if (searchData.length > 0) {
        const video = document.querySelector('.video-player');
        if (video) {
          video.currentTime = searchData[0].start;
        }
      }

    } catch (error) {
      console.error('Search error:', error);
      alert('검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  // 새 영상 업로드
  const handleNewVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoFile(null);
    setVideoUrl(null);
    setSearchQuery('');
    setSearchResults([]);
    setVideoId(null);
    setIndex(null);
    setUploadStatus('');
    setCurrentView('upload');
  };

  // 검색 결과 클릭 시 해당 시간으로 이동
  const handleResultClick = (startTime) => {
    const video = document.querySelector('.video-player');
    if (video) {
      video.currentTime = startTime;
    }
  };

  return (
    <div className="app">
      {currentView === 'upload' ? (
        // 업로드 페이지
        <div className="upload-page">
          <h1>VIR - Video Indexing & Retrieval</h1>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            style={{ display: 'none' }}
            id="video-upload"
          />
          <label htmlFor="video-upload" className="upload-button">
            영상 업로드 하기
          </label>
          {!client && (
            <p style={{color: 'red', marginTop: '20px'}}>
              ⚠️ TwelveLabs API 연결에 문제가 있습니다.
            </p>
          )}
        </div>
      ) : (
        // 플레이어 페이지
        <div className="player-page">
          <button onClick={handleNewVideo} className="new-video-btn">
            새 영상 업로드
          </button>
          
          <video
            src={videoUrl}
            controls
            className="video-player"
          />
          
          {/* 업로드 상태 표시 */}
          {uploadStatus && (
            <div className="upload-status">
              {uploadStatus}
            </div>
          )}
          
          <div className="search-section">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="찾고 싶은 장면을 설명하세요..."
              className="search-input"
            />
            <button 
              onClick={handleSearch} 
              className="search-button"
              disabled={isSearching || !client}
            >
              {isSearching ? '검색 중...' : '검색하기'}
            </button>
          </div>

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>검색 결과:</h3>
              {searchResults.map((result, index) => (
                <div 
                  key={index} 
                  className="result-item"
                  onClick={() => handleResultClick(result.start)}
                >
                  {Math.floor(result.start / 60)}:{(result.start % 60).toFixed(0).padStart(2, '0')} - 
                  {Math.floor(result.end / 60)}:{(result.end % 60).toFixed(0).padStart(2, '0')} 
                  (점수: {result.score.toFixed(1)})
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
