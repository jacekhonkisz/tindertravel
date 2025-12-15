# 🔌 Connect Your External App to Hotel CRM API

Step-by-step guide to connect any external application to your Hotel CRM API.

## 📋 Prerequisites

- Your external app (Python, JavaScript, React, etc.)
- Internet connection
- The API credentials (already have these!)

## 🔑 Your API Credentials

```python
API_BASE = "https://web-production-b200.up.railway.app"
API_KEY = "javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8"
```

---

## 🐍 For Python Applications

### Step 1: Install Required Library

```bash
pip install requests
```

### Step 2: Copy the Code

**Option A: Copy the simple file**
```bash
# Copy SIMPLE_COPY_PASTE.py to your project
cp /Users/macbook/hotelmails/SIMPLE_COPY_PASTE.py /path/to/your/app/hotel_api.py
```

**Option B: Copy just the functions you need**

Create a new file `hotel_api.py` in your project:

```python
import requests

API_BASE = "https://web-production-b200.up.railway.app"
API_KEY = "javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8"

def get_hotels(page=1, per_page=50, stage=None, country=None, city=None, search=None):
    """Get hotels from the API"""
    params = {"page": page, "per_page": per_page}
    if stage:
        params["stage"] = stage
    if country:
        params["country"] = country
    if city:
        params["city"] = city
    if search:
        params["search"] = search
    
    response = requests.get(
        f"{API_BASE}/api/hotels",
        headers={"X-API-Key": API_KEY},
        params=params
    )
    response.raise_for_status()
    return response.json()

def get_stats():
    """Get statistics"""
    response = requests.get(
        f"{API_BASE}/api/stats",
        headers={"X-API-Key": API_KEY}
    )
    response.raise_for_status()
    return response.json()
```

### Step 3: Use in Your App

```python
# In your main app file
from hotel_api import get_hotels, get_stats

# Get hotels
hotels_data = get_hotels(stage="S1", country="Italy", per_page=50)
print(f"Found {hotels_data['pagination']['total']} hotels")

for hotel in hotels_data['hotels']:
    print(f"- {hotel['hotel_name']} ({hotel['city']}, {hotel['country']})")

# Get statistics
stats = get_stats()
print(f"Total hotels: {stats['statistics']['total']}")
```

---

## 🌐 For JavaScript/Node.js Applications

### Step 1: Install Required Library (if using Node.js)

```bash
npm install node-fetch  # For Node.js
# OR use built-in fetch (available in modern browsers and Node.js 18+)
```

### Step 2: Copy the Code

**Option A: Copy the simple file**
```bash
# Copy SIMPLE_COPY_PASTE.js to your project
cp /Users/macbook/hotelmails/SIMPLE_COPY_PASTE.js /path/to/your/app/hotelApi.js
```

**Option B: Copy just the functions you need**

Create a new file `hotelApi.js` in your project:

```javascript
const API_BASE = "https://web-production-b200.up.railway.app";
const API_KEY = "javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8";

async function getHotels(params = {}) {
    const query = new URLSearchParams({
        page: 1,
        per_page: 50,
        ...params
    }).toString();
    
    const response = await fetch(`${API_BASE}/api/hotels?${query}`, {
        headers: { "X-API-Key": API_KEY }
    });
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
}

async function getStats() {
    const response = await fetch(`${API_BASE}/api/stats`, {
        headers: { "X-API-Key": API_KEY }
    });
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
}

// Export for use in other files
module.exports = { getHotels, getStats };  // Node.js
// OR
export { getHotels, getStats };  // ES6 modules
```

### Step 3: Use in Your App

**Node.js:**
```javascript
const { getHotels, getStats } = require('./hotelApi');

// Get hotels
getHotels({ stage: "S1", country: "Italy", per_page: 50 })
    .then(data => {
        console.log(`Found ${data.pagination.total} hotels`);
        data.hotels.forEach(hotel => {
            console.log(`- ${hotel.hotel_name} (${hotel.city}, ${hotel.country})`);
        });
    })
    .catch(error => console.error("Error:", error));

// Get statistics
getStats()
    .then(stats => {
        console.log(`Total hotels: ${stats.statistics.total}`);
    });
```

**Browser/React:**
```javascript
import { getHotels, getStats } from './hotelApi';

// In a React component
function HotelsList() {
    const [hotels, setHotels] = useState([]);
    
    useEffect(() => {
        getHotels({ stage: "S1", per_page: 50 })
            .then(data => setHotels(data.hotels))
            .catch(error => console.error("Error:", error));
    }, []);
    
    return (
        <div>
            {hotels.map(hotel => (
                <div key={hotel.id}>
                    <h3>{hotel.hotel_name}</h3>
                    <p>{hotel.city}, {hotel.country}</p>
                </div>
            ))}
        </div>
    );
}
```

---

## ⚛️ For React Applications

### Step 1: Create API File

Create `src/services/hotelApi.js`:

```javascript
const API_BASE = "https://web-production-b200.up.railway.app";
const API_KEY = "javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8";

export const hotelApi = {
    async getHotels(params = {}) {
        const query = new URLSearchParams({
            page: 1,
            per_page: 50,
            ...params
        }).toString();
        
        const response = await fetch(`${API_BASE}/api/hotels?${query}`, {
            headers: { "X-API-Key": API_KEY }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        return response.json();
    },
    
    async getStats() {
        const response = await fetch(`${API_BASE}/api/stats`, {
            headers: { "X-API-Key": API_KEY }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        return response.json();
    }
};
```

### Step 2: Use in Component

```javascript
import React, { useState, useEffect } from 'react';
import { hotelApi } from './services/hotelApi';

function HotelsList() {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        hotelApi.getHotels({ stage: "S1", per_page: 50 })
            .then(data => {
                setHotels(data.hotels);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    
    return (
        <div>
            <h2>Hotels ({hotels.length})</h2>
            {hotels.map(hotel => (
                <div key={hotel.id} style={{ margin: '10px', padding: '10px', border: '1px solid #ccc' }}>
                    <h3>{hotel.hotel_name}</h3>
                    <p>{hotel.city}, {hotel.country}</p>
                    <p>Email: {hotel.email || 'N/A'}</p>
                    <p>Stage: {hotel.stage}</p>
                </div>
            ))}
        </div>
    );
}

export default HotelsList;
```

---

## 🔧 For Other Languages

### PHP

```php
<?php
$apiBase = "https://web-production-b200.up.railway.app";
$apiKey = "javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8";

function getHotels($params = []) {
    global $apiBase, $apiKey;
    
    $query = http_build_query(array_merge(['page' => 1, 'per_page' => 50], $params));
    $url = "$apiBase/api/hotels?$query";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-Key: $apiKey"]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Usage
$hotels = getHotels(['stage' => 'S1', 'country' => 'Italy']);
echo "Found " . $hotels['pagination']['total'] . " hotels\n";
?>
```

### Go

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "net/url"
)

const apiBase = "https://web-production-b200.up.railway.app"
const apiKey = "javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8"

func getHotels(params map[string]string) (map[string]interface{}, error) {
    u, _ := url.Parse(apiBase + "/api/hotels")
    q := u.Query()
    q.Set("page", "1")
    q.Set("per_page", "50")
    for k, v := range params {
        q.Set(k, v)
    }
    u.RawQuery = q.Encode()
    
    req, _ := http.NewRequest("GET", u.String(), nil)
    req.Header.Set("X-API-Key", apiKey)
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    return result, nil
}

func main() {
    hotels, _ := getHotels(map[string]string{"stage": "S1"})
    fmt.Println("Hotels:", hotels)
}
```

---

## ✅ Testing Your Connection

### Quick Test Script

**Python:**
```python
import requests

API_BASE = "https://web-production-b200.up.railway.app"
API_KEY = "javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8"

# Test connection
response = requests.get(
    f"{API_BASE}/api/stats",
    headers={"X-API-Key": API_KEY}
)

if response.status_code == 200:
    print("✅ Connection successful!")
    print(response.json())
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)
```

**JavaScript:**
```javascript
const API_BASE = "https://web-production-b200.up.railway.app";
const API_KEY = "javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8";

fetch(`${API_BASE}/api/stats`, {
    headers: { "X-API-Key": API_KEY }
})
.then(response => response.json())
.then(data => {
    console.log("✅ Connection successful!");
    console.log(data);
})
.catch(error => {
    console.error("❌ Error:", error);
});
```

---

## 🔒 Security Best Practices

### 1. Store API Key Securely

**Python:**
```python
import os

# Use environment variable
API_KEY = os.getenv("HOTEL_CRM_API_KEY", "javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8")
```

**JavaScript:**
```javascript
// Use environment variable
const API_KEY = process.env.REACT_APP_HOTEL_CRM_API_KEY || "javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8";
```

### 2. Create .env File

Create `.env` file in your project:
```
HOTEL_CRM_API_KEY=javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8
```

**Never commit .env to git!** Add to `.gitignore`:
```
.env
```

---

## 📚 Common Use Cases

### Get All Hotels in a Stage

**Python:**
```python
all_hotels = []
page = 1

while True:
    data = get_hotels(stage="S1", page=page, per_page=50)
    all_hotels.extend(data['hotels'])
    if not data['pagination']['has_next']:
        break
    page += 1

print(f"Total: {len(all_hotels)} hotels")
```

**JavaScript:**
```javascript
async function getAllHotels(stage) {
    let allHotels = [];
    let page = 1;
    
    while (true) {
        const data = await getHotels({ stage, page, per_page: 50 });
        allHotels.push(...data.hotels);
        if (!data.pagination.has_next) break;
        page++;
    }
    
    return allHotels;
}
```

### Search Hotels

**Python:**
```python
results = get_hotels(search="Grand", country="Italy")
print(f"Found {results['pagination']['total']} hotels")
```

**JavaScript:**
```javascript
const results = await getHotels({ search: "Grand", country: "Italy" });
console.log(`Found ${results.pagination.total} hotels`);
```

---

## 🆘 Troubleshooting

### Error: "Authentication required"
- Check that API key is correct
- Verify `X-API-Key` header is being sent
- Check API key hasn't changed

### Error: Connection timeout
- Check internet connection
- Verify API URL is correct
- Check if Railway app is running

### Error: 404 Not Found
- Verify endpoint URL is correct
- Check API base URL

---

## 📞 Need Help?

1. Test with the test scripts above
2. Check `COPY_PASTE_CODE.md` for more examples
3. See `API_TUTORIAL.md` for complete API reference

---

## 🎯 Quick Checklist

- [ ] Installed required libraries (requests for Python, etc.)
- [ ] Copied API code to your project
- [ ] Added API credentials
- [ ] Tested connection with test script
- [ ] Integrated into your app
- [ ] Stored API key securely (environment variable)

**You're ready to go!** 🚀

