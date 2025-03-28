import requests
import json

# Test adding a keyword directly
url = "http://localhost:5000/api/keywords"
data = {"term": "test keyword", "industry": "Testing"}

print(f"Sending request to {url} with data: {data}")
response = requests.post(url, json=data)

print(f"Status code: {response.status_code}")
try:
    print(f"Response body: {response.json()}")
except:
    print(f"Raw response: {response.text}") 