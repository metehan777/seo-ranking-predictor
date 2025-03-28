import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
import json
from scipy import stats

class RankingPredictor:
    def __init__(self):
        self.model = LinearRegression()
        self.volatility_threshold = 2.0
        self.confidence_level = 0.95
    
    def prepare_data(self, rankings_data):
        """Convert rankings data to time series format"""
        df = pd.DataFrame(rankings_data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Add time features
        df['days_since_start'] = (df['timestamp'] - df['timestamp'].min()).dt.total_seconds() / (60*60*24)
        
        return df
    
    def train_model(self, df, url):
        """Train prediction model for a specific URL"""
        url_data = df[df['url'] == url].copy()
        if len(url_data) < 5:  # Need minimum data points
            return None
            
        X = url_data[['days_since_start']]
        y = url_data['position']
        
        self.model.fit(X, y)
        return self.model
    
    def predict_future(self, df, url, days_ahead=14):
        """Predict future rankings for a URL"""
        model = self.train_model(df, url)
        if model is None:
            return None
            
        # Create future dates
        last_date = df['timestamp'].max()
        future_days = np.array([(df['days_since_start'].max() + i) for i in range(1, days_ahead+1)])
        
        # Make predictions
        predictions = model.predict(future_days.reshape(-1, 1))
        
        # Format results
        future_dates = [(last_date + timedelta(days=i)).isoformat() for i in range(1, days_ahead+1)]
        prediction_data = [{"date": date, "predicted_position": float(pos)} 
                          for date, pos in zip(future_dates, predictions)]
        
        return prediction_data
    
    def detect_volatility(self, predictions):
        """Detect if predictions show high volatility"""
        if not predictions:
            return False
            
        positions = [p['predicted_position'] for p in predictions]
        std_dev = np.std(positions)
        max_change = max(positions) - min(positions)
        
        # Threshold for volatility alert
        return std_dev > 2.0 or max_change > 5
    
    def predict_future_rankings(self, rankings, days_ahead=7):
        """Generate ranking predictions for the coming days"""
        if not rankings:
            return {}
            
        # Group rankings by URL
        url_rankings = {}
        for r in rankings:
            url = r.url
            if url not in url_rankings:
                url_rankings[url] = []
            url_rankings[url].append((r.timestamp, r.position))
        
        predictions = {}
        current_date = datetime.utcnow()
        
        for url, data in url_rankings.items():
            # Sort by date
            data.sort(key=lambda x: x[0])
            
            # Extract positions
            positions = [pos for _, pos in data]
            
            if len(positions) < 3:
                # Not enough data for prediction
                continue
                
            # Calculate trend using linear regression
            x = np.arange(len(positions))
            y = np.array(positions)
            slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
            
            # Calculate volatility (standard deviation)
            volatility = np.std(positions)
            
            # Generate predictions for next days
            future_predictions = []
            
            for day in range(1, days_ahead + 1):
                future_date = current_date + timedelta(days=day)
                future_x = len(positions) + day - 1
                
                # Predicted position based on trend
                predicted_pos = intercept + slope * future_x
                
                # Add confidence interval
                conf_interval = std_err * 1.96  # 95% confidence
                
                # Round predictions to integers since rankings are whole numbers
                predicted_pos = int(round(predicted_pos))
                lower_bound = int(max(1, round(predicted_pos - conf_interval)))
                upper_bound = int(round(predicted_pos + conf_interval))
                
                future_predictions.append({
                    "date": future_date.strftime("%Y-%m-%d"),
                    "position": predicted_pos,
                    "lower_bound": lower_bound,
                    "upper_bound": upper_bound
                })
            
            # Store predictions for this URL - convert NumPy types to Python types
            predictions[url] = {
                "current_position": int(positions[-1]),
                "trend": float(slope),
                "volatility": float(volatility),
                "is_volatile": bool(volatility > self.volatility_threshold),
                "predictions": future_predictions
            }
        
        return predictions 