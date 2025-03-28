import React from 'react';
import './AnalysisPanel.css';

// Helper function to safely extract hostname from URLs
const getDisplayName = (urlString) => {
  try {
    // Add protocol if missing
    if (urlString && !urlString.startsWith('http')) {
      urlString = 'https://' + urlString;
    }
    const url = new URL(urlString);
    return url.hostname.replace('www.', '');
  } catch (e) {
    // Fall back to using the URL string directly
    return urlString?.split('/')[0] || 'Unknown URL';
  }
};

const AnalysisPanel = ({ analysis }) => {
  // Process the analysis data - handle raw_analysis case
  const processedAnalysis = React.useMemo(() => {
    if (!analysis) return null;
    
    // Check if analysis has raw_analysis that contains JSON
    if (analysis.raw_analysis && typeof analysis.raw_analysis === 'string') {
      try {
        // If raw_analysis contains a JSON string in markdown format
        if (analysis.raw_analysis.includes('```json')) {
          const jsonPart = analysis.raw_analysis.split('```json')[1].split('```')[0].trim();
          return JSON.parse(jsonPart);
        }
        // Try to parse it as direct JSON
        return JSON.parse(analysis.raw_analysis);
      } catch (e) {
        console.error('Error parsing raw_analysis:', e);
        return analysis;
      }
    }
    
    return analysis;
  }, [analysis]);
  
  // Check if we have valid analysis data
  const hasAnalysis = processedAnalysis && 
    (processedAnalysis.summary || processedAnalysis.volatility_analysis || 
     processedAnalysis.prediction_analysis || processedAnalysis.recommendations || 
     processedAnalysis.patterns_discovered);
  
  if (!hasAnalysis) {
    return (
      <div className="analysis-panel">
        <h2>Claude Analysis</h2>
        <p className="no-data">No analysis data available.</p>
      </div>
    );
  }
  
  return (
    <div className="analysis-panel">
      <h2>Claude Analysis</h2>
      
      {processedAnalysis.summary && (
        <div className="analysis-section">
          <h3>Summary</h3>
          <p>{processedAnalysis.summary}</p>
        </div>
      )}
      
      {processedAnalysis.volatility_analysis && (
        <div className="analysis-section">
          <h3>Volatility Analysis</h3>
          {typeof processedAnalysis.volatility_analysis === 'string' ? (
            <p>{processedAnalysis.volatility_analysis}</p>
          ) : (
            <>
              {processedAnalysis.volatility_analysis.highly_volatile_urls && (
                <div>
                  <h4>Highly Volatile URLs</h4>
                  <ul>
                    {processedAnalysis.volatility_analysis.highly_volatile_urls.map((item, idx) => (
                      <li key={idx}>
                        <strong>{getDisplayName(item.url)}</strong>: {item.note || item.insight || ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Support both high_volatility_urls and highly_volatile_urls (different naming conventions) */}
              {!processedAnalysis.volatility_analysis.highly_volatile_urls && processedAnalysis.volatility_analysis.high_volatility_urls && (
                <div>
                  <h4>High Volatility URLs</h4>
                  <ul>
                    {processedAnalysis.volatility_analysis.high_volatility_urls.map((item, idx) => (
                      <li key={idx}>
                        <strong>{getDisplayName(item.url)}</strong>: {item.insight || item.note || ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {processedAnalysis.volatility_analysis.stable_urls && (
                <div>
                  <h4>Stable URLs</h4>
                  <ul>
                    {processedAnalysis.volatility_analysis.stable_urls.map((item, idx) => (
                      <li key={idx}>
                        <strong>
                          {typeof item === 'string' 
                            ? getDisplayName(item) 
                            : getDisplayName(item.url)}
                        </strong>
                        {typeof item !== 'string' && item.insight && `: ${item.insight}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {processedAnalysis.prediction_analysis && (
        <div className="analysis-section">
          <h3>Prediction Analysis</h3>
          {typeof processedAnalysis.prediction_analysis === 'string' ? (
            <p>{processedAnalysis.prediction_analysis}</p>
          ) : (
            <>
              {processedAnalysis.prediction_analysis.improving_urls && (
                <div>
                  <h4>Improving URLs</h4>
                  <ul>
                    {processedAnalysis.prediction_analysis.improving_urls.map((item, idx) => (
                      <li key={idx}>
                        <strong>{getDisplayName(item.url)}</strong>: {item.insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {processedAnalysis.prediction_analysis.declining_urls && (
                <div>
                  <h4>Declining URLs</h4>
                  <ul>
                    {processedAnalysis.prediction_analysis.declining_urls.map((item, idx) => (
                      <li key={idx}>
                        <strong>{getDisplayName(item.url)}</strong>: {item.insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {processedAnalysis.patterns_discovered && (
        <div className="analysis-section">
          <h3>Patterns Discovered</h3>
          {typeof processedAnalysis.patterns_discovered === 'string' ? (
            <p>{processedAnalysis.patterns_discovered}</p>
          ) : (
            <ul>
              {Object.entries(processedAnalysis.patterns_discovered).map(([category, patterns]) => (
                <li key={category}>
                  <strong>{category.replace(/_/g, ' ')}</strong>:
                  {typeof patterns === 'string' ? (
                    <p>{patterns}</p>
                  ) : (
                    <ul>
                      {Object.entries(patterns).map(([key, value]) => (
                        <li key={key}>
                          <strong>{key.replace(/_/g, ' ')}</strong>: {value}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {processedAnalysis.recommendations && (
        <div className="analysis-section">
          <h3>Recommended Actions</h3>
          {typeof processedAnalysis.recommendations === 'string' ? (
            <p>{processedAnalysis.recommendations}</p>
          ) : typeof processedAnalysis.recommendations === 'object' && !Array.isArray(processedAnalysis.recommendations) ? (
            <ul>
              {Object.entries(processedAnalysis.recommendations).map(([category, recs]) => (
                <li key={category}>
                  <strong>{category.replace(/_/g, ' ')}</strong>:
                  {Array.isArray(recs) ? (
                    <ul>
                      {recs.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{recs}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <ul>
              {Array.isArray(processedAnalysis.recommendations) && 
               processedAnalysis.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel; 