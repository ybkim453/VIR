import '../components/SearchPage.css';

function SearchPage() {
  return (
    <div className="search-page">
      <div className="search-container">
        <div className="search-area">
          <div className="search-content">
            <span className="search-text">Searching</span>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchPage; 