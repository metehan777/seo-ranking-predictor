import React, { useState } from 'react';

const AlertConfig = () => {
  const [threshold, setThreshold] = useState(5);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [email, setEmail] = useState('');
  
  const handleSave = (e) => {
    e.preventDefault();
    // In a full implementation, this would save to the backend
    alert(`Settings saved! Threshold: ${threshold}, Email alerts: ${emailAlerts ? 'On' : 'Off'}`);
  };
  
  return (
    <div className="alert-config">
      <h2>Alert Settings</h2>
      
      <form onSubmit={handleSave}>
        <div className="form-group">
          <label htmlFor="threshold">Volatility Threshold</label>
          <input 
            type="range" 
            id="threshold" 
            min="1" 
            max="10" 
            value={threshold} 
            onChange={(e) => setThreshold(parseInt(e.target.value))}
          />
          <div className="range-value">{threshold}</div>
          <small>Alert when predicted position change exceeds this value</small>
        </div>
        
        <div className="form-group checkbox">
          <input 
            type="checkbox" 
            id="email-alerts" 
            checked={emailAlerts}
            onChange={(e) => setEmailAlerts(e.target.checked)} 
          />
          <label htmlFor="email-alerts">Enable email alerts</label>
        </div>
        
        {emailAlerts && (
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required={emailAlerts}
            />
          </div>
        )}
        
        <button type="submit" className="save-button">Save Settings</button>
      </form>
    </div>
  );
};

export default AlertConfig; 