import { useState } from 'react';
import { TwelveLabs } from 'twelvelabs-js';
import UploadPage from './pages/UploadPage';
import SearchPage from './pages/SearchPage';
import PromptingPage from './pages/PromptingPage';
import CheckPage from './pages/CheckPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('upload'); // 'upload' | 'search' | 'prompting' | 'check'
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [selectedResult, setSelectedResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [index, setIndex] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

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
      setCurrentPage('search'); // 업로드 후 검색 페이지로 이동

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
        // setUploadStatus('영상 업로드 중...');
        
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
              setCurrentPage('prompting'); // 업로드 완료 후 PromptingPage로 이동
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

    // 프롬프트 제출 핸들러
  const handlePromptSubmit = async (prompt) => {
    console.log('프롬프트 제출:', prompt);
    console.log('현재 상태:', { client: !!client, index: !!index, videoId });
    
    setSearchQuery(prompt);
    setCurrentPage('search'); // 검색 중 페이지로 이동
    setIsSearching(true);

    if (!client || !index || !videoId) {
      console.error('검색에 필요한 정보가 없습니다.', { client: !!client, index: !!index, videoId });
      setCurrentPage('prompting');
      setIsSearching(false);
      return;
    }

    try {
      console.log('검색 시작...');
      // TwelveLabs 검색 API 호출
      const searchResponse = await client.search.query({
        indexId: index.id,
        queryText: prompt,
        options: ["visual", "audio"],
        searchPool: {
          videos: [{ id: videoId }]
        }
      });

      console.log('검색 응답:', searchResponse);

      if (searchResponse.data && searchResponse.data.length > 0) {
        console.log('검색 결과 있음, CheckPage로 이동');
        setSearchResults(searchResponse.data);
        setCurrentResultIndex(0);
        setCurrentPage('check'); // 검색 완료 후 체크 페이지로 이동
      } else {
        console.log('검색 결과가 없습니다.');
        setCurrentPage('prompting'); // 결과가 없으면 다시 프롬프트 페이지로
      }
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
      setCurrentPage('prompting'); // 오류 시 다시 프롬프트 페이지로
    } finally {
      setIsSearching(false);
    }
  };

  // CheckPage 핸들러들
  const handleYesClick = (result) => {
    // 예 선택 시: PromptingPage로 돌아가고 영상을 해당 시간대로 스크러빙
    setSelectedResult(result);
    setCurrentPage('prompting');
  };

  const handleNoClick = (currentIndex) => {
    // 아니오 선택 시: 다음 검색 결과로 이동
    if (currentIndex + 1 < searchResults.length) {
      setCurrentResultIndex(currentIndex + 1);
    } else {
      // 더 이상 결과가 없으면 PromptingPage로 돌아가기
      setCurrentPage('prompting');
    }
  };
  
    // 페이지별 컨텐츠 렌더링
  const renderPageContent = () => {
    switch (currentPage) {
      case 'upload':
        return <UploadPage onVideoUpload={handleVideoUpload} />;
      case 'search':
        return <SearchPage />;
      case 'prompting':
        return <PromptingPage videoUrl={videoUrl} selectedResult={selectedResult} onPromptSubmit={handlePromptSubmit} />;
      case 'check':
        return (
          <CheckPage 
            videoUrl={videoUrl}
            searchResults={searchResults}
            currentResultIndex={currentResultIndex}
            onYesClick={handleYesClick}
            onNoClick={handleNoClick}
          />
        );
      default:
        return <UploadPage onVideoUpload={handleVideoUpload} />;
    }
  };

  return (
    <div className="app">
      {/* 공통 배경 */}
      <div className="background">
        <div className="wave-section"></div>
        <div className="white-section"></div>
      </div>
      
      {/* 공통 헤더 */}
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-main">VIR</span>
          <span className="title-sub">Video Indexing & Retrieval</span>
        </h1>
      </header>

      {/* 페이지별 컨텐츠 */}
      <main className="app-content">
        {renderPageContent()}
      </main>

      {/* 업로드 상태 표시 - 주석처리함 */}
      {/* {uploadStatus && (
        <div className="upload-status">
          {uploadStatus}
        </div>
      )} */}
    </div>
  );
}

export default App;
