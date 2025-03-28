import React, { useState } from 'react';
import { analyzeContent } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './ContentAnalysis.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ContentAnalysis = ({ keyword, rankings }) => {
  const [targetUrl, setTargetUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!targetUrl) {
      setError('Please enter a target URL to analyze');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await analyzeContent(keyword.id, targetUrl);
      setAnalysis(result.analysis);
    } catch (err) {
      setError('Failed to analyze content: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const renderStrengthsWeaknessesChart = () => {
    if (!analysis || (!analysis.strengths && !analysis.weaknesses)) return null;
    
    const labels = ['Content Factors'];
    const strengthsData = analysis.strengths ? analysis.strengths.slice(0, 10).map((_, i) => 10 - i) : [];
    const weaknessesData = analysis.weaknesses ? analysis.weaknesses.slice(0, 10).map((_, i) => -(i + 1)) : [];
    
    const data = {
      labels,
      datasets: [
        {
          label: 'Strengths',
          data: strengthsData,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
        {
          label: 'Weaknesses',
          data: weaknessesData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
        },
      ],
    };
    
    const options = {
      indexAxis: 'y',
      elements: {
        bar: {
          borderWidth: 2,
        },
      },
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
        title: {
          display: true,
          text: 'Content Strengths & Weaknesses',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const index = Math.abs(context.raw) - 1;
              if (context.raw > 0) {
                return analysis.strengths[index];
              } else {
                return analysis.weaknesses[Math.abs(context.raw) - 1];
              }
            }
          }
        }
      },
    };
    
    return <Bar options={options} data={data} />;
  };

  return (
    <div className="content-analysis">
      <h2>Content Gap Analysis</h2>
      
      <div className="url-input">
        <label htmlFor="target-url">Enter your URL to analyze:</label>
        <input
          id="target-url"
          type="text"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          placeholder="https://yourdomain.com/page"
        />
        <button onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing...' : 'Analyze Content'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {isAnalyzing && (
        <div className="loading-message">
          Analyzing content and comparing with competitors...
          This may take a minute.
        </div>
      )}
      
      {analysis && (
        <div className="analysis-results">
          <div className="score-container">
            <div className="competitive-score">
              <h3>Competitiveness Score</h3>
              <div className="score">{analysis.competitiveness_score}/10</div>
            </div>
          </div>
          
          <div className="chart-container">
            {renderStrengthsWeaknessesChart()}
          </div>
          
          <div className="content-lists">
            <div className="strengths">
              <h3>Content Strengths</h3>
              <ul>
                {analysis.strengths && analysis.strengths.map((strength, i) => (
                  <li key={`strength-${i}`}>{strength}</li>
                ))}
              </ul>
            </div>
            
            <div className="weaknesses">
              <h3>Content Gaps</h3>
              <ul>
                {analysis.weaknesses && analysis.weaknesses.map((weakness, i) => (
                  <li key={`weakness-${i}`}>{weakness}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="recommendations">
            <h3>Recommendations</h3>
            <ul>
              {analysis.recommendations && analysis.recommendations.map((rec, i) => (
                <li key={`rec-${i}`}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentAnalysis; 