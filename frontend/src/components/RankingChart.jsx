import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const RankingChart = ({ data }) => {
  // Process and organize the ranking data for charting
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Group by URL
    const urlGroups = data.reduce((acc, item) => {
      if (!acc[item.url]) {
        acc[item.url] = [];
      }
      acc[item.url].push(item);
      return acc;
    }, {});

    // Get all unique dates
    const allDates = [...new Set(data.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleDateString();
    }))].sort((a, b) => new Date(a) - new Date(b));

    // Create datasets for each URL
    const datasets = Object.entries(urlGroups).map(([url, items], index) => {
      // Get a domain from URL for label
      const domain = new URL(url).hostname.replace('www.', '');
      
      // Create a mapping of date to position
      const datePositionMap = items.reduce((acc, item) => {
        const date = new Date(item.timestamp).toLocaleDateString();
        acc[date] = item.position;
        return acc;
      }, {});
      
      // Create data array with positions for each date
      const positions = allDates.map(date => datePositionMap[date] || null);
      
      return {
        label: domain,
        data: positions,
        borderColor: getColor(index),
        backgroundColor: getColor(index, 0.1),
        fill: false,
        tension: 0.1
      };
    });

    return {
      labels: allDates,
      datasets: datasets.slice(0, 10) // Limit to top 10 URLs for readability
    };
  }, [data]);

  // Helper function to generate colors
  function getColor(index, alpha = 1) {
    const colors = [
      `rgba(255, 99, 132, ${alpha})`,
      `rgba(54, 162, 235, ${alpha})`,
      `rgba(255, 206, 86, ${alpha})`,
      `rgba(75, 192, 192, ${alpha})`,
      `rgba(153, 102, 255, ${alpha})`,
      `rgba(255, 159, 64, ${alpha})`,
      `rgba(199, 199, 199, ${alpha})`,
      `rgba(83, 102, 255, ${alpha})`,
      `rgba(40, 159, 164, ${alpha})`,
      `rgba(210, 105, 30, ${alpha})`
    ];
    return colors[index % colors.length];
  }

  const options = {
    scales: {
      y: {
        reverse: true, // Higher rank = lower number
        min: 1,
        title: {
          display: true,
          text: 'Ranking Position'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Historical SERP Rankings'
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            return tooltipItems[0].label;
          },
          label: (context) => {
            return `${context.dataset.label}: Position ${context.parsed.y}`;
          }
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  return (
    <div className="chart-container">
      <h2>Ranking History</h2>
      <div style={{ height: '400px' }}>
        {data && data.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <p>No ranking data available</p>
        )}
      </div>
    </div>
  );
};

export default RankingChart; 