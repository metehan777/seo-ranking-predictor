from app import app, db
from models.database import Keyword

# Create a simple script to check database connection
with app.app_context():
    # Check if the tables exist
    print("Checking database...")
    try:
        # Try to query the database
        keywords = Keyword.query.all()
        print(f"Database connection successful. Found {len(keywords)} keywords.")
        
        # Create a test keyword
        test_keyword = Keyword(term="test_keyword", industry="Test")
        db.session.add(test_keyword)
        db.session.commit()
        print(f"Successfully added test keyword with ID: {test_keyword.id}")
        
        # Clean up
        db.session.delete(test_keyword)
        db.session.commit()
        print("Test keyword removed")
        
    except Exception as e:
        print(f"Database error: {str(e)}") 