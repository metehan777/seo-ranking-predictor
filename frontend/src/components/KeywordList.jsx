import React, { useState } from 'react';
import { addKeyword } from '../services/api';

const KeywordList = ({ keywords, selectedKeyword, onSelect }) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [industry, setIndustry] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newKeyword) return;
    
    try {
      setError(null);
      const response = await addKeyword(newKeyword, industry);
      setNewKeyword('');
      setIndustry('');
      setIsAdding(false);
      // Reload the page to refresh keywords
      window.location.reload();
    } catch (err) {
      setError('Failed to add keyword');
      console.error(err);
    }
  };

  return (
    <div className="keyword-list">
      <h2>Keywords</h2>
      
      <div className="keyword-actions">
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="add-button"
        >
          {isAdding ? 'Cancel' : 'Add Keyword'}
        </button>
      </div>
      
      {isAdding && (
        <form onSubmit={handleSubmit} className="keyword-form">
          <div className="form-group">
            <label htmlFor="keyword">Keyword Term</label>
            <input
              type="text"
              id="keyword"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="e.g., seo tools"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="industry">Industry (optional)</label>
            <input
              type="text"
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Marketing"
            />
          </div>
          
          <button type="submit" className="submit-button">Add</button>
          
          {error && <div className="error">{error}</div>}
        </form>
      )}
      
      <ul className="keywords">
        {keywords.length > 0 ? (
          keywords.map((keyword) => (
            <li 
              key={keyword.id}
              className={selectedKeyword && selectedKeyword.id === keyword.id ? 'selected' : ''}
              onClick={() => onSelect(keyword)}
            >
              <div className="keyword-term">{keyword.term}</div>
              {keyword.industry && <div className="keyword-industry">{keyword.industry}</div>}
            </li>
          ))
        ) : (
          <li className="no-keywords">No keywords added yet</li>
        )}
      </ul>
    </div>
  );
};

export default KeywordList; 