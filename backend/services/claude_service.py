import anthropic
import json
from config import Config
from services.content_service import ContentService

class ClaudeService:
    def __init__(self, api_key=None):
        self.api_key = api_key or Config.CLAUDE_API_KEY
        self.client = anthropic.Anthropic(api_key=self.api_key) if self.api_key else None
        
    def is_available(self):
        return self.client is not None
        
    def analyze_rankings(self, keyword, rankings, predictions):
        """Generate an analysis of ranking trends using Claude"""
        if not self.is_available():
            return None
            
        # Prepare data for Claude
        ranking_data = []
        for r in rankings:
            ranking_data.append({
                "date": r.timestamp.strftime("%Y-%m-%d"),
                "url": r.url,
                "position": r.position
            })
        
        # Create prompt for Claude
        prompt = f"""Analyze these search ranking trends for the keyword "{keyword}". 
        
Ranking history:
{json.dumps(ranking_data, indent=2)}

Predictions:
{json.dumps(predictions, indent=2)}

Please provide an analysis covering:
1. An overall summary of the ranking trends
2. Which URLs showed significant volatility
3. Which URLs are predicted to improve or decline in rankings
4. Any patterns or anomalies in the data
5. Strategic recommendations based on these trends

Format your response as JSON with these keys: "summary", "volatility_analysis", "prediction_analysis", "patterns_discovered", and "recommendations"."""

        try:
            # Call Claude API
            response = self.client.messages.create(
                model="claude-3-5-sonnet-latest",
                max_tokens=2000,
                temperature=0.2,
                system="You are an SEO analytics expert who analyzes search ranking trends and provides insights. Your responses should be detailed, data-driven, and actionable.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Parse the response
            try:
                analysis_text = response.content[0].text
                print("Raw Claude response:", analysis_text)
                
                # Try to extract a JSON object from the response
                try:
                    # Find JSON content (it might be wrapped in markdown code blocks)
                    if "```json" in analysis_text:
                        json_part = analysis_text.split("```json")[1].split("```")[0].strip()
                        analysis = json.loads(json_part)
                        print("Successfully parsed JSON from code block")
                    else:
                        analysis = json.loads(analysis_text)
                        print("Successfully parsed JSON directly")
                    
                    return analysis
                except json.JSONDecodeError as e:
                    print(f"JSON parsing error: {str(e)}")
                    
                    # If the JSON is incomplete or malformed, try to clean it up
                    if "raw_analysis" in analysis_text:
                        # We might already have a nested structure, try to parse that
                        try:
                            if isinstance(analysis_text, dict) and "raw_analysis" in analysis_text:
                                raw_json = analysis_text["raw_analysis"]
                                if "```json" in raw_json:
                                    json_part = raw_json.split("```json")[1].split("```")[0].strip()
                                    return json.loads(json_part)
                        except:
                            pass
                    
                    # Fall back to returning the raw text
                    return {"raw_analysis": analysis_text}
            except Exception as inner_e:
                print(f"Error parsing Claude response: {str(inner_e)}")
                return {"error": "Failed to parse Claude response"}
                
        except Exception as e:
            print(f"Error calling Claude API: {str(e)}")
            return {"error": f"Claude API error: {str(e)}"}

    def predict_ranking_changes(self, historical_data):
        """Use Claude to analyze and predict ranking changes"""
        prompt = f"""
        You are an expert SEO analyst. Based on the following historical ranking data, 
        analyze trends and predict upcoming ranking volatility. Identify potential 
        ranking shifts and suggest content or technical adjustments.
        
        Historical ranking data:
        {json.dumps(historical_data, indent=2)}
        
        Provide your analysis in JSON format with the following structure:
        {{
            "trend_analysis": "Your detailed analysis of trends observed in the data",
            "volatility_prediction": "Your prediction about upcoming ranking volatility",
            "expected_changes": [{"url": "URL", "current_position": X, "predicted_shift": Y}],
            "recommended_actions": ["Action 1", "Action 2"]
        }}
        """
        
        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-latest",
                max_tokens=4096,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            # Extract JSON from response
            analysis_text = response.content[0].text
            # Find the start of the JSON in the response
            json_start = analysis_text.find('{')
            json_end = analysis_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                analysis_json = analysis_text[json_start:json_end]
                return json.loads(analysis_json)
            return {"error": "Could not parse JSON from Claude response"}
        except Exception as e:
            return {"error": f"Claude API error: {str(e)}"}

    def analyze_content_gaps(self, query, target_url, competitor_urls):
        """Analyze content gaps between target page and competitors"""
        if not self.is_available():
            return None
        
        try:
            # Fetch content
            content_service = ContentService()
            target_content = content_service.fetch_page_content(target_url)
            competitor_contents = content_service.fetch_multiple_pages(competitor_urls, limit=3)
            
            # Create prompt for Claude
            prompt = f"""Analyze content gaps for the search query "{query}".

TARGET PAGE:
URL: {target_content['url']}
Title: {target_content['title']}
Meta Description: {target_content['meta_description']}
Headings: {', '.join(target_content['headings'][:5])}
Word Count: {target_content['word_count']}
Content Preview: {target_content['content'][:1000]}...

COMPETITOR PAGES:
"""

            for i, comp in enumerate(competitor_contents, 1):
                prompt += f"""
COMPETITOR {i}:
URL: {comp['url']}
Title: {comp['title']}
Meta Description: {comp['meta_description']}
Headings: {', '.join(comp['headings'][:5]) if 'headings' in comp and comp['headings'] else 'N/A'}
Word Count: {comp.get('word_count', 'N/A')}
Content Preview: {comp.get('content', 'N/A')[:500]}...
"""

            prompt += """
Based on this data, please:
1. Identify the top 10 content strengths of the target page
2. Identify the top 10 content gaps or weaknesses compared to competitors
3. Provide specific recommendations for improving the target page
4. Rate the competitiveness of the target page (1-10 scale)

Format your response as JSON with these keys: "strengths", "weaknesses", "recommendations", and "competitiveness_score".
"""

            # Call Claude API
            response = self.client.messages.create(
                model="claude-3-7-sonnet-latest",
                max_tokens=3000,
                temperature=0.2,
                system="You are an SEO content analyst who specializes in identifying content gaps and opportunities. You provide detailed, actionable insights based on content analysis.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Parse the response
            try:
                analysis_text = response.content[0].text
                # Try to extract JSON
                if "```json" in analysis_text:
                    json_part = analysis_text.split("```json")[1].split("```")[0].strip()
                    analysis = json.loads(json_part)
                else:
                    analysis = json.loads(analysis_text)
                
                return analysis
            except:
                # Return raw text if parsing fails
                return {"raw_analysis": analysis_text}
            
        except Exception as e:
            print(f"Error analyzing content: {str(e)}")
            return {"error": f"Content analysis error: {str(e)}"} 