import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';

const PredictionChart = ({ predictions }) => {
  // Check if we have prediction data
  const hasPredictions = predictions && Object.keys(predictions).length > 0;

  // Process the data for the chart
  const chartData = useMemo(() => {
    if (!hasPredictions) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Get all unique dates from predictions
    const allDates = new Set();
    
    // Iterate through the URLs and their predictions
    Object.values(predictions).forEach(urlData => {
      if (urlData.predictions && Array.isArray(urlData.predictions)) {
        urlData.predictions.forEach(pred => {
          if (pred.date) {
            allDates.add(pred.date);
          }
        });
      }
    });
    
    // Sort dates chronologically
    const sortedDates = Array.from(allDates).sort();
    
    // Create datasets for each URL
    const datasets = Object.entries(predictions).map(([url, urlData], index) => {
      // Skip if no predictions array
      if (!urlData.predictions || !Array.isArray(urlData.predictions)) {
        return null;
      }
      
      // Create a map of date to position for easier lookup
      const datePositionMap = {};
      urlData.predictions.forEach(pred => {
        if (pred.date && pred.position) {
          datePositionMap[pred.date] = pred.position;
        }
      });
      
      // Generate colors based on index
      const hue = (index * 137) % 360;
      const color = `hsl(${hue}, 70%, 60%)`;
      
      // Get domain from URL for the label
      let label;
      try {
        const urlObj = new URL(url);
        label = urlObj.hostname.replace('www.', '');
      } catch (e) {
        label = url;
      }
      
      return {
        label: label,
        data: sortedDates.map(date => datePositionMap[date] || null),
        borderColor: color,
        backgroundColor: `${color}33`,
        tension: 0.2,
        pointRadius: 3
      };
    }).filter(Boolean); // Filter out nulls
    
    return {
      labels: sortedDates,
      datasets
    };
  }, [predictions, hasPredictions]);

  if (!hasPredictions) {
    return (
      <div className="prediction-chart">
        <h2>Ranking Predictions</h2>
        <p className="no-data">No prediction data available</p>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Predicted Ranking Changes',
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            return `Date: ${tooltipItems[0].label}`;
          },
          label: (context) => {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;
            return `${datasetLabel}: Position ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        reverse: true,
        title: {
          display: true,
          text: 'Position'
        },
        min: 1,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="prediction-chart">
      <h2>Ranking Predictions</h2>
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default PredictionChart; 