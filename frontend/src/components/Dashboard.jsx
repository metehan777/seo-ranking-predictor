import React, { useState, useEffect } from 'react';
import { fetchKeywords, fetchRankings, fetchPredictions, updateRankings } from '../services/api';
import KeywordList from './KeywordList';
import RankingChart from './RankingChart';
import PredictionChart from './PredictionChart';
import AnalysisPanel from './AnalysisPanel';
import AlertConfig from './AlertConfig';
import ContentAnalysis from './ContentAnalysis';
import './Dashboard.css';

const Dashboard = () => {
  const [keywords, setKeywords] = useState([]);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFetchingRankings, setIsFetchingRankings] = useState(false);

  useEffect(() => {
    const loadKeywords = async () => {
      try {
        const data = await fetchKeywords();
        setKeywords(data);
        if (data.length > 0) {
          setSelectedKeyword(data[0]);
        }
      } catch (err) {
        setError('Failed to load keywords');
        console.error(err);
      }
    };
    
    loadKeywords();
  }, []);

  useEffect(() => {
    if (!selectedKeyword) return;
    
    const loadData = async () => {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      try {
        // First try to get rankings data
        const rankingsData = await fetchRankings(selectedKeyword.id);
        setRankings(rankingsData);
        
        // Then try to get predictions (which might fail)
        try {
          const predictionsData = await fetchPredictions(selectedKeyword.id);
          setPredictions(predictionsData.predictions || {});
          setAnalysis(predictionsData.claude_analysis);
        } catch (predictionError) {
          console.error('Prediction error:', predictionError);
          // Don't set the main error state, just show empty predictions
          setPredictions({});
          setAnalysis(null);
        }
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedKeyword]);

  const handleKeywordSelect = (keyword) => {
    setSelectedKeyword(keyword);
  };

  const handleFetchRankings = async () => {
    if (!selectedKeyword) return;
    
    setIsFetchingRankings(true);
    try {
      await updateRankings(selectedKeyword.id);
      // Reload data after fetching new rankings
      const rankingsData = await fetchRankings(selectedKeyword.id);
      setRankings(rankingsData);
      
      // Try to get predictions with new data
      try {
        const predictionsData = await fetchPredictions(selectedKeyword.id);
        setPredictions(predictionsData.predictions || {});
        setAnalysis(predictionsData.claude_analysis);
      } catch (err) {
        console.error('Prediction error after update:', err);
      }
    } catch (err) {
      setError('Failed to fetch new rankings');
      console.error(err);
    } finally {
      setIsFetchingRankings(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Predictive Ranking Flux System</h1>
      </header>
      
      <div className="sidebar">
        <KeywordList 
          keywords={keywords} 
          selectedKeyword={selectedKeyword}
          onSelect={handleKeywordSelect}
        />
        <AlertConfig />
      </div>
      
      <main className="main-content">
        {isLoading ? (
          <div className="loading">Loading data...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            <div className="action-buttons">
              <button 
                onClick={handleFetchRankings} 
                disabled={isFetchingRankings || !selectedKeyword}
                className="fetch-rankings-button"
              >
                {isFetchingRankings ? 'Fetching...' : 'Fetch Latest Rankings'}
              </button>
            </div>
            <div className="charts-container">
              <RankingChart data={rankings} />
              <PredictionChart predictions={predictions} />
            </div>
            <AnalysisPanel analysis={analysis} />
            
            {selectedKeyword && (
              <ContentAnalysis keyword={selectedKeyword} rankings={rankings} />
            )}

            <div style={{margin: '20px 0', padding: '10px', background: '#f5f5f5', borderRadius: '4px'}}>
              <h3>Claude Analysis Debug</h3>
              <pre style={{overflow: 'auto', maxHeight: '200px'}}>
                Raw data: {JSON.stringify(analysis, null, 2)}
              </pre>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard; 