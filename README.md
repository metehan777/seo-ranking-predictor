# Predictive Ranking Flux System

A comprehensive SEO analytics platform that tracks, analyzes, and predicts search ranking changes over time using AI-powered insights.

- You can follow me on X [https://x.com/metehan777](https://x.com/metehan777)
- You can read posts on [https://metehan.ai](https://metehan.ai)
- You can subscribe on [https://metehanai.substack.com/](https://metehanai.substack.com)


## Features

- **Keyword Tracking**: Monitor important keywords for your business
- **Historical Ranking Data**: View and analyze how your rankings have changed over time
- **AI-Powered Predictions**: Leverage machine learning to predict future ranking changes
- **Content Gap Analysis**: Compare your content against competitors to identify improvements
- **Claude AI Integration**: Get expert analysis of your ranking data and content strategy
- **Visual Analytics**: Interactive charts and visualizations of ranking data

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 14+ and npm
- Claude API key (for AI analysis features)
- SerpAPI key (for gathering ranking data)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/metehan777/seo-ranking-predictor.git
   cd seo-ranking-predictor
   ```

2. **Set up the backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   python3 app.py
   
   # Create .env file with your API keys
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

### Configuration

Create a `.env` file in the backend directory with the following variables:

# Flask configuration
```DEBUG=True
SECRET_KEY=your_secure_secret_
```
