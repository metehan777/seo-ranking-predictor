from flask import Blueprint, request, jsonify
from models.database import db, Keyword, Ranking
from services.serp_service import SerpDataService
from services.claude_service import ClaudeService
from services.predictor import RankingPredictor
from datetime import datetime, timedelta
import numpy as np

api_bp = Blueprint('api', __name__)
serp_service = SerpDataService()
claude_service = ClaudeService()
predictor = RankingPredictor()

@api_bp.route('/keywords', methods=['GET'])
def get_keywords():
    keywords = Keyword.query.all()
    return jsonify([{"id": k.id, "term": k.term, "industry": k.industry} for k in keywords])

@api_bp.route('/keywords', methods=['POST'])
def add_keyword():
    print("Received add_keyword request")
    
    try:
        # Log the request data
        print(f"Request data: {request.data}")
        data = request.json
        print(f"Parsed JSON: {data}")
        
        if not data or 'term' not in data:
            print("Missing keyword term")
            return jsonify({"error": "Missing keyword term"}), 400
        
        print(f"Creating keyword with term: {data['term']}, industry: {data.get('industry')}")
        keyword = Keyword(term=data['term'], industry=data.get('industry'))
        
        print("Adding to session")
        db.session.add(keyword)
        
        print("Committing to database")
        db.session.commit()
        
        print(f"Keyword created with ID: {keyword.id}")
        
        # Fetch initial rankings data
        try:
            print(f"Fetching initial rankings for keyword ID: {keyword.id}")
            serp_data = serp_service.fetch_rankings(keyword.term)
            
            if serp_data and 'organic_results' in serp_data:
                # Save rankings
                timestamp = datetime.utcnow()
                for idx, result in enumerate(serp_data.get('organic_results', []), 1):
                    ranking = Ranking(
                        keyword_id=keyword.id,
                        url=result['url'],
                        position=idx,
                        timestamp=timestamp
                    )
                    db.session.add(ranking)
                
                db.session.commit()
                print(f"Initial rankings saved for keyword ID: {keyword.id}")
            else:
                print(f"No SERP data found for keyword: {keyword.term}")
        except Exception as e:
            print(f"Error fetching initial rankings: {str(e)}")
            # Continue with response even if ranking fetch fails
        
        return jsonify({
            "id": keyword.id, 
            "term": keyword.term, 
            "message": "Keyword added successfully"
        })
    except Exception as e:
        print(f"Error in add_keyword: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"error": f"Failed to add keyword: {str(e)}"}), 500

@api_bp.route('/keywords/<int:keyword_id>/rankings', methods=['GET'])
def get_rankings(keyword_id):
    days = request.args.get('days', 30, type=int)
    since = datetime.utcnow() - timedelta(days=days)
    
    rankings = Ranking.query.filter_by(keyword_id=keyword_id)\
                            .filter(Ranking.timestamp >= since)\
                            .all()
    
    return jsonify([r.to_dict() for r in rankings])

@api_bp.route('/keywords/<int:keyword_id>/fetch', methods=['POST'])
def fetch_rankings_for_keyword(keyword_id):
    keyword = Keyword.query.get_or_404(keyword_id)
    
    # Get SERP data
    serp_data = serp_service.fetch_rankings(keyword.term)
    if not serp_data:
        return jsonify({"error": "Failed to fetch SERP data"}), 500
    
    # Save rankings
    timestamp = datetime.utcnow()
    for idx, result in enumerate(serp_data.get('organic_results', []), 1):
        ranking = Ranking(
            keyword_id=keyword_id,
            url=result['url'],
            position=idx,
            timestamp=timestamp
        )
        db.session.add(ranking)
    
    db.session.commit()
    return jsonify({"message": "Rankings updated"})

@api_bp.route('/keywords/<int:keyword_id>/predict', methods=['GET'])
def predict_rankings(keyword_id):
    try:
        # Check if keyword exists
        keyword = Keyword.query.get(keyword_id)
        if not keyword:
            return jsonify({"error": "Keyword not found"}), 404
            
        # Get the latest rankings
        days = request.args.get('days', 30, type=int)
        since = datetime.utcnow() - timedelta(days=days)
        
        rankings = Ranking.query.filter_by(keyword_id=keyword_id)\
                              .filter(Ranking.timestamp >= since)\
                              .order_by(Ranking.timestamp.desc())\
                              .all()
        
        if not rankings:
            # Instead of returning an error, return an empty prediction set
            return jsonify({
                "keyword": {"id": keyword.id, "term": keyword.term},
                "predictions": {},
                "days_analyzed": days,
                "claude_analysis": None,
                "message": "No historical ranking data available for predictions. Try fetching rankings first."
            })
        
        # Generate predictions using the predictor service
        try:
            predictions_data = predictor.predict_future_rankings(rankings)
            
            # Generate analysis using Claude
            analysis = None
            if claude_service.is_available():
                try:
                    analysis = claude_service.analyze_rankings(keyword.term, rankings, predictions_data)
                except Exception as e:
                    print(f"Claude analysis error: {str(e)}")
            
            return jsonify({
                "keyword": {"id": keyword.id, "term": keyword.term},
                "predictions": predictions_data,
                "days_analyzed": days,
                "claude_analysis": analysis
            })
            
        except Exception as e:
            print(f"Prediction error: {str(e)}")
            return jsonify({"error": f"Failed to generate predictions: {str(e)}"}), 500
            
    except Exception as e:
        print(f"Error in predict_rankings: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@api_bp.route('/keywords/<int:keyword_id>/content-analysis', methods=['POST'])
def analyze_content(keyword_id):
    try:
        keyword = Keyword.query.get_or_404(keyword_id)
        data = request.json
        
        if not data or 'target_url' not in data:
            return jsonify({"error": "Target URL is required"}), 400
            
        target_url = data['target_url']
        competitor_urls = data.get('competitor_urls', [])
        
        # If no competitor URLs provided, get top ranking URLs
        if not competitor_urls:
            # Get latest rankings
            latest_rankings = Ranking.query\
                .filter_by(keyword_id=keyword_id)\
                .order_by(Ranking.timestamp.desc())\
                .limit(10)\
                .all()
                
            # Get URLs excluding target URL
            competitor_urls = [r.url for r in latest_rankings if r.url != target_url][:5]
        
        # Analyze content
        if not claude_service.is_available():
            return jsonify({"error": "Claude API not available"}), 503
            
        analysis = claude_service.analyze_content_gaps(
            query=keyword.term,
            target_url=target_url,
            competitor_urls=competitor_urls
        )
        
        if not analysis:
            return jsonify({"error": "Failed to analyze content"}), 500
            
        return jsonify({
            "keyword": {"id": keyword.id, "term": keyword.term},
            "target_url": target_url,
            "competitor_urls": competitor_urls,
            "analysis": analysis
        })
        
    except Exception as e:
        print(f"Error in content analysis: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@api_bp.route('/debug', methods=['GET'])
def debug_route():
    """Debug route to help diagnose serialization issues"""
    try:
        # Create a simple test with NumPy values
        test_data = {
            "integer": np.int64(42),
            "float": np.float64(3.14),
            "boolean": np.bool_(True),
            "array": np.array([1, 2, 3])
        }
        
        # Convert to regular Python types manually
        clean_data = {
            "integer": int(test_data["integer"]),
            "float": float(test_data["float"]),
            "boolean": bool(test_data["boolean"]),
            "array": test_data["array"].tolist()
        }
        
        return jsonify({
            "message": "Debug successful",
            "data": clean_data
        })
    except Exception as e:
        print(f"Debug error: {str(e)}")
        return jsonify({"error": f"Debug error: {str(e)}"}), 500 