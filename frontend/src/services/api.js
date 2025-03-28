const API_BASE_URL = 'http://localhost:5001/api';

export const fetchKeywords = async () => {
  try {
    console.log('Fetching keywords from API...');
    const response = await fetch(`${API_BASE_URL}/keywords`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response text:', errorText);
      throw new Error(`Failed to fetch keywords: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Keywords data:', data);
    return data;
  } catch (error) {
    console.error('Fetch keywords error:', error);
    throw new Error('Failed to fetch keywords');
  }
};

export const addKeyword = async (term, industry) => {
  console.log('Adding keyword:', { term, industry });
  
  try {
    const response = await fetch(`${API_BASE_URL}/keywords`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ term, industry })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response:', errorData);
      throw new Error(errorData.message || 'Failed to add keyword');
    }
    
    return response.json();
  } catch (error) {
    console.error('Request error:', error);
    throw error;
  }
};

export const fetchRankings = async (keywordId, days = 30) => {
  const response = await fetch(`${API_BASE_URL}/keywords/${keywordId}/rankings?days=${days}`);
  if (!response.ok) throw new Error('Failed to fetch rankings');
  return response.json();
};

export const fetchPredictions = async (keywordId) => {
  try {
    console.log(`Fetching predictions for keyword ID: ${keywordId}`);
    const response = await fetch(`${API_BASE_URL}/keywords/${keywordId}/predict`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Prediction error response:', data);
      throw new Error(data.error || 'Failed to fetch predictions');
    }
    
    return data;
  } catch (error) {
    console.error('Prediction request error:', error);
    throw error;
  }
};

export const updateRankings = async (keywordId) => {
  const response = await fetch(`${API_BASE_URL}/keywords/${keywordId}/fetch`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to update rankings');
  return response.json();
};

export const analyzeContent = async (keywordId, targetUrl, competitorUrls = []) => {
  try {
    console.log(`Analyzing content for keyword ID: ${keywordId}`);
    const response = await fetch(`${API_BASE_URL}/keywords/${keywordId}/content-analysis`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target_url: targetUrl,
        competitor_urls: competitorUrls
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Content analysis error response:', data);
      throw new Error(data.error || 'Failed to analyze content');
    }
    
    return data;
  } catch (error) {
    console.error('Content analysis request error:', error);
    throw error;
  }
}; 