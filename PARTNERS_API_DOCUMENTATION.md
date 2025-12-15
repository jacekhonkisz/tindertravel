# Partners API Documentation

Complete guide to the Partners API endpoints for managing hotel partners in the CRM system.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Data Models](#data-models)
5. [Endpoints](#endpoints)
   - [List Partners](#1-list-partners)
   - [Get Single Partner](#2-get-single-partner)
   - [Get Partner with Prospect Data](#3-get-partner-with-prospect-data)
   - [Update Partner](#4-update-partner)
   - [Promote Prospects to Partners](#5-promote-prospects-to-partners)
   - [Assign Dropbox Folder](#6-assign-dropbox-folder)
   - [Create Dropbox Folder](#7-create-dropbox-folder)
   - [Get Partner Photos](#8-get-partner-photos)
6. [Error Handling](#error-handling)
7. [Integration Examples](#integration-examples)

---

## Overview

The Partners API provides endpoints for managing hotel partners - operational records separate from CRM prospects. Partners can have:
- Operational data (website, coordinates, tags, status)
- Dropbox folder assignments for photo storage
- Links to original prospect records (read-only)

**Key Concepts:**
- **Prospects**: Original CRM records in `hotels` table
- **Partners**: Operational records in `hotels_partners` table
- **Promotion**: Process of converting a prospect to a partner
- **Linking**: Partners maintain a `prospect_id` reference to original prospect

---

## Authentication

All endpoints require authentication via one of:

1. **Session Authentication** (Browser)
   - User must be logged in via `/login`
   - Session cookie is automatically sent

2. **API Key Authentication** (External)
   - Include header: `X-API-Key: your-api-key`
   - API keys configured in environment variables

**Example with API Key:**
```bash
curl -H "X-API-Key: your-api-key" \
     https://your-domain.com/api/partners
```

**Example with Session:**
```javascript
fetch('/api/partners', {
  credentials: 'include'  // Sends session cookie
})
```

---

## Base URL

- **Production**: `https://your-domain.com`
- **Development**: `http://localhost:5001`

All endpoints are prefixed with `/api/partners`

---

## Data Models

### Partner Object

```typescript
interface Partner {
  id: string;                    // UUID
  prospect_id: number;           // Reference to hotels.id
  hotel_name: string;             // Required
  website?: string;               // Optional URL
  location_label?: string;        // e.g., "Paris, France"
  country_code?: string;          // ISO-3166 alpha-2 (e.g., "FR", "US")
  city?: string;
  google_place_id?: string;
  lat?: number;                   // Latitude (-90 to 90)
  lng?: number;                   // Longitude (-180 to 180)
  dropbox_folder_id?: string;     // Dropbox folder ID
  dropbox_path?: string;          // Dropbox folder path
  tags: string[];                 // Array of tag strings
  status: 'active' | 'paused' | 'offboarded';
  notes?: string;
  created_at: string;             // ISO 8601 timestamp
  updated_at: string;             // ISO 8601 timestamp
}
```

### Prospect Object (Read-only)

```typescript
interface Prospect {
  id: number;
  hotel_name: string;
  email?: string;
  website?: string;
  country?: string;
  city?: string;
  stage?: string;
  status?: string;
  notes?: string;
  partner_id?: string;            // Link back to partner
}
```

### Photo Object

```typescript
interface Photo {
  name: string;                   // Filename
  path: string;                   // Full Dropbox path
  url: string;                    // Temporary download URL (4-hour validity)
  size: number;                   // File size in bytes
  modified?: string;              // ISO 8601 timestamp
}
```

---

## Endpoints

### 1. List Partners

Get a paginated list of partners with filtering and search.

**Endpoint:** `GET /api/partners`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (1-indexed) |
| `per_page` | integer | No | 50 | Items per page (max 100) |
| `q` | string | No | - | Search query (searches hotel_name, website, location_label, city) |
| `status` | string | No | - | Filter by status: `active`, `paused`, `offboarded` |
| `country_code` | string | No | - | Filter by ISO-3166 country code (e.g., `US`, `FR`) |
| `tag` | string | No | - | Filter by tag (exact match) |

**Example Request:**

```bash
curl -H "X-API-Key: your-api-key" \
     "https://your-domain.com/api/partners?page=1&per_page=20&status=active&country_code=US"
```

```javascript
const response = await fetch('/api/partners?page=1&per_page=20&status=active', {
  credentials: 'include'
});
const data = await response.json();
```

**Response:**

```json
{
  "partners": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "prospect_id": 12345,
      "hotel_name": "Grand Hotel Paris",
      "website": "https://grandhotelparis.com",
      "location_label": "Paris, France",
      "country_code": "FR",
      "city": "Paris",
      "lat": 48.8566,
      "lng": 2.3522,
      "dropbox_path": "/Glintz/Partners_Photos/Grand_Hotel_Paris",
      "tags": ["luxury", "city-center"],
      "status": "active",
      "notes": "Premium partner",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:22:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "per_page": 20,
  "total_pages": 8
}
```

**Features:**
- Automatic country code backfill: If partner has coordinates but no `country_code`, the system automatically reverse geocodes and updates the database
- Search is case-insensitive and searches across multiple fields
- Results are sorted by `created_at` descending (newest first)

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `partners` | array | Array of Partner objects |
| `total` | integer | Total number of partners matching filters |
| `page` | integer | Current page number |
| `per_page` | integer | Items per page |
| `total_pages` | integer | Total number of pages |

---

### 2. Get Single Partner

Get detailed information about a single partner.

**Endpoint:** `GET /api/partners/<partner_id>`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `partner_id` | string (UUID) | Yes | Partner UUID |

**Example Request:**

```bash
curl -H "X-API-Key: your-api-key" \
     "https://your-domain.com/api/partners/550e8400-e29b-41d4-a716-446655440000"
```

```javascript
const response = await fetch('/api/partners/550e8400-e29b-41d4-a716-446655440000', {
  credentials: 'include'
});
const data = await response.json();
```

**Response:**

```json
{
  "partner": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "prospect_id": 12345,
    "hotel_name": "Grand Hotel Paris",
    "website": "https://grandhotelparis.com",
    "location_label": "Paris, France",
    "country_code": "FR",
    "city": "Paris",
    "google_place_id": "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
    "lat": 48.8566,
    "lng": 2.3522,
    "dropbox_folder_id": "id:abc123...",
    "dropbox_path": "/Glintz/Partners_Photos/Grand_Hotel_Paris",
    "tags": ["luxury", "city-center"],
    "status": "active",
    "notes": "Premium partner with excellent service",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:22:00Z"
  }
}
```

**Error Responses:**

- `404 Not Found`: Partner does not exist
- `500 Internal Server Error`: Server error

---

### 3. Get Partner with Prospect Data

Get partner data plus linked prospect (CRM) data. Prospect data is read-only.

**Endpoint:** `GET /api/partners/<partner_id>/with-prospect`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `partner_id` | string (UUID) | Yes | Partner UUID |

**Example Request:**

```bash
curl -H "X-API-Key: your-api-key" \
     "https://your-domain.com/api/partners/550e8400-e29b-41d4-a716-446655440000/with-prospect"
```

```javascript
const response = await fetch(
  '/api/partners/550e8400-e29b-41d4-a716-446655440000/with-prospect',
  { credentials: 'include' }
);
const data = await response.json();
```

**Response:**

```json
{
  "partner": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "prospect_id": 12345,
    "hotel_name": "Grand Hotel Paris",
    "website": "https://grandhotelparis.com",
    "location_label": "Paris, France",
    "country_code": "FR",
    "city": "Paris",
    "lat": 48.8566,
    "lng": 2.3522,
    "dropbox_path": "/Glintz/Partners_Photos/Grand_Hotel_Paris",
    "tags": ["luxury", "city-center"],
    "status": "active",
    "notes": "Premium partner",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:22:00Z"
  },
  "prospect": {
    "id": 12345,
    "hotel_name": "Grand Hotel Paris",
    "email": "contact@grandhotelparis.com",
    "website": "https://grandhotelparis.com",
    "country": "France",
    "city": "Paris",
    "stage": "Partners",
    "status": "active",
    "notes": "Original CRM notes",
    "partner_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Notes:**
- Prospect data is read-only (cannot be modified via Partners API)
- If prospect doesn't exist, `prospect` will be `null`
- Prospect data includes original CRM fields like `email`, `stage`, etc.

---

### 4. Update Partner

Update operational fields of a partner. Only operational fields can be updated; prospect data is read-only.

**Endpoint:** `PATCH /api/partners/<partner_id>`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `partner_id` | string (UUID) | Yes | Partner UUID |

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "hotel_name": "Updated Hotel Name",
  "website": "https://newwebsite.com",
  "location_label": "New Location",
  "country_code": "US",
  "city": "New York",
  "google_place_id": "ChIJOwg_06VPwokRYv534QaPC8g",
  "lat": 40.7128,
  "lng": -74.0060,
  "tags": ["luxury", "beachfront"],
  "status": "active",
  "notes": "Updated notes",
  "dropbox_folder_id": "id:new-folder-id"
}
```

**Field Validation:**

| Field | Validation Rules |
|-------|------------------|
| `hotel_name` | Required if provided, cannot be empty |
| `lat` | Must be between -90 and 90 |
| `lng` | Must be between -180 and 180 |
| `status` | Must be one of: `active`, `paused`, `offboarded` |
| `tags` | Must be an array of strings |
| `website`, `location_label`, `city`, `notes`, `google_place_id`, `dropbox_folder_id` | Can be set to `null` to clear |

**Automatic Features:**
- If `lat` and `lng` are updated but `country_code` is missing, the system automatically reverse geocodes to get the country code
- Empty strings for nullable fields are converted to `null`

**Example Request:**

```bash
curl -X PATCH \
     -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     -d '{
       "website": "https://newwebsite.com",
       "lat": 40.7128,
       "lng": -74.0060,
       "tags": ["luxury", "city-center"]
     }' \
     "https://your-domain.com/api/partners/550e8400-e29b-41d4-a716-446655440000"
```

```javascript
const response = await fetch(
  '/api/partners/550e8400-e29b-41d4-a716-446655440000',
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      website: 'https://newwebsite.com',
      lat: 40.7128,
      lng: -74.0060,
      tags: ['luxury', 'city-center']
    })
  }
);
const data = await response.json();
```

**Response:**

```json
{
  "partner": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "prospect_id": 12345,
    "hotel_name": "Grand Hotel Paris",
    "website": "https://newwebsite.com",
    "location_label": "Paris, France",
    "country_code": "FR",
    "city": "Paris",
    "lat": 40.7128,
    "lng": -74.0060,
    "tags": ["luxury", "city-center"],
    "status": "active",
    "updated_at": "2024-01-21T10:00:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid field values (e.g., lat out of range)
- `404 Not Found`: Partner does not exist
- `500 Internal Server Error`: Server error

---

### 5. Promote Prospects to Partners

Bulk promote one or more prospects from the CRM to partners. This operation is idempotent - safe to call multiple times.

**Endpoint:** `POST /api/partners/promote`

**Authentication:** Required

**Request Body:**

```json
{
  "prospect_ids": [12345, 12346, 12347]
}
```

**Example Request:**

```bash
curl -X POST \
     -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"prospect_ids": [12345, 12346]}' \
     "https://your-domain.com/api/partners/promote"
```

```javascript
const response = await fetch('/api/partners/promote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    prospect_ids: [12345, 12346, 12347]
  })
});
const data = await response.json();
```

**Response:**

```json
{
  "created": [
    {
      "prospect_id": 12345,
      "partner_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  ],
  "linked_existing": [
    {
      "prospect_id": 12346,
      "partner_id": "660e8400-e29b-41d4-a716-446655440001"
    }
  ],
  "failed": [
    {
      "prospect_id": 12347,
      "reason": "Prospect not found"
    }
  ]
}
```

**Response Fields:**

| Field | Description |
|-------|-------------|
| `created` | Array of newly created partners |
| `linked_existing` | Array of prospects linked to existing partners |
| `failed` | Array of prospects that failed to promote (with reason) |

**Behavior:**

1. **New Partner Creation**: If prospect doesn't have a partner, creates new partner record
2. **Existing Partner Link**: If partner already exists for prospect, links prospect to existing partner
3. **Already Linked**: If prospect already has `partner_id`, skips (idempotent)
4. **Data Mapping**: Automatically maps prospect data to partner:
   - `hotel_name` → `hotel_name`
   - `website` → `website`
   - `city` + `country` → `location_label`
   - `country` → `country_code` (converted to ISO-3166)
   - Sets `status` to `active`
   - Initializes `tags` as empty array

**Automatic Actions:**
- Sets `promoted_at` timestamp on prospect
- Sets `promoted_by` to current user email (or "system")
- Links prospect to partner via `partner_id` field

**Error Responses:**

- `400 Bad Request`: Missing or invalid `prospect_ids` array
- `500 Internal Server Error`: Server error

---

### 6. Assign Dropbox Folder

Assign an existing Dropbox folder to a partner for photo storage.

**Endpoint:** `POST /api/partners/<partner_id>/dropbox-folder`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `partner_id` | string (UUID) | Yes | Partner UUID |

**Request Body:**

```json
{
  "folder_id": "id:abc123def456..."
}
```

**Note:** `folder_id` can be either:
- Dropbox folder ID (e.g., `id:abc123...`)
- Dropbox folder path (e.g., `/Glintz/Partners_Photos/HotelName`)

**Example Request:**

```bash
curl -X POST \
     -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"folder_id": "id:abc123def456..."}' \
     "https://your-domain.com/api/partners/550e8400-e29b-41d4-a716-446655440000/dropbox-folder"
```

```javascript
const response = await fetch(
  '/api/partners/550e8400-e29b-41d4-a716-446655440000/dropbox-folder',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      folder_id: 'id:abc123def456...'
    })
  }
);
const data = await response.json();
```

**Response:**

```json
{
  "partner": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "prospect_id": 12345,
    "hotel_name": "Grand Hotel Paris",
    "dropbox_folder_id": "id:abc123def456...",
    "dropbox_path": "/Glintz/Partners_Photos/Grand_Hotel_Paris",
    "updated_at": "2024-01-21T10:00:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing `folder_id` or invalid format
- `401 Unauthorized`: Dropbox authentication failed
- `404 Not Found`: Partner or folder not found
- `500 Internal Server Error`: Server or Dropbox API error

**Notes:**
- Verifies folder exists in Dropbox before assigning
- Stores both `dropbox_folder_id` and `dropbox_path`
- Updates `updated_at` timestamp

---

### 7. Create Dropbox Folder

Create a new Dropbox folder for a partner and automatically assign it.

**Endpoint:** `POST /api/integrations/dropbox/create-folder`

**Authentication:** Required

**Request Body:**

```json
{
  "partner_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "CustomFolderName"  // Optional, defaults to partner ID + hotel name slug
}
```

**Example Request:**

```bash
curl -X POST \
     -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     -d '{
       "partner_id": "550e8400-e29b-41d4-a716-446655440000",
       "name": "GrandHotelParis"
     }' \
     "https://your-domain.com/api/integrations/dropbox/create-folder"
```

```javascript
const response = await fetch('/api/integrations/dropbox/create-folder', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    partner_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'GrandHotelParis'  // Optional
  })
});
const data = await response.json();
```

**Response:**

```json
{
  "folder_id": "id:abc123def456...",
  "path": "/Hotels/550e8400-e29b-41d4-a716-446655440000_Grand_Hotel_Paris",
  "partner": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "dropbox_folder_id": "id:abc123def456...",
    "dropbox_path": "/Hotels/550e8400-e29b-41d4-a716-446655440000_Grand_Hotel_Paris"
  }
}
```

**Folder Naming:**
- If `name` is provided, uses that name
- Otherwise, generates: `{partner_id}_{hotel_name_slug}`
- Folder is created under `/Hotels/` path
- Hotel name is slugified (special characters replaced with underscores)

**Error Responses:**

- `400 Bad Request`: Missing `partner_id` or folder already exists
- `404 Not Found`: Partner not found
- `500 Internal Server Error`: Server or Dropbox API error

**Notes:**
- If folder already exists, links existing folder to partner (doesn't fail)
- Automatically updates partner's `dropbox_folder_id` and `dropbox_path`

---

### 8. Get Partner Photos

Get all photos from a partner's assigned Dropbox folder.

**Endpoint:** `GET /api/partners/<partner_id>/photos`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `partner_id` | string (UUID) | Yes | Partner UUID |

**Example Request:**

```bash
curl -H "X-API-Key: your-api-key" \
     "https://your-domain.com/api/partners/550e8400-e29b-41d4-a716-446655440000/photos"
```

```javascript
const response = await fetch(
  '/api/partners/550e8400-e29b-41d4-a716-446655440000/photos',
  { credentials: 'include' }
);
const data = await response.json();
```

**Response:**

```json
{
  "photos": [
    {
      "name": "hotel-exterior.jpg",
      "path": "/Glintz/Partners_Photos/Grand_Hotel_Paris/hotel-exterior.jpg",
      "url": "https://dl.dropboxusercontent.com/...",
      "size": 2048576,
      "modified": "2024-01-15T10:30:00Z"
    },
    {
      "name": "lobby.jpg",
      "path": "/Glintz/Partners_Photos/Grand_Hotel_Paris/lobby.jpg",
      "url": "https://dl.dropboxusercontent.com/...",
      "size": 1536000,
      "modified": "2024-01-14T15:20:00Z"
    }
  ],
  "count": 2,
  "folder_path": "/Glintz/Partners_Photos/Grand_Hotel_Paris",
  "partner_name": "Grand Hotel Paris"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `photos` | array | Array of Photo objects |
| `count` | integer | Number of photos found |
| `folder_path` | string | Dropbox folder path |
| `partner_name` | string | Partner hotel name |

**Photo Object Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Filename |
| `path` | string | Full Dropbox path |
| `url` | string | Temporary download URL (valid 4 hours) |
| `size` | integer | File size in bytes |
| `modified` | string | Last modified timestamp (ISO 8601) |

**Supported Image Formats:**
- `.jpg`, `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.bmp`
- `.svg`
- `.heic`, `.heif`

**Features:**
- Automatically filters for image files only
- Handles pagination for folders with many files
- Sorts photos by modified date (newest first)
- Generates temporary download links (4-hour validity)

**Error Responses:**

- `404 Not Found`: Partner not found
- `401 Unauthorized`: Dropbox authentication failed
- `500 Internal Server Error`: Server or Dropbox API error

**Empty States:**

If no Dropbox folder is assigned:
```json
{
  "photos": [],
  "count": 0,
  "folder_path": null,
  "message": "No Dropbox folder assigned to this partner"
}
```

If folder not found:
```json
{
  "photos": [],
  "count": 0,
  "folder_path": "/Glintz/Partners_Photos/MissingFolder",
  "message": "Dropbox folder not found. It may have been moved or deleted."
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `200` | Success | Request completed successfully |
| `400` | Bad Request | Invalid parameters, missing required fields |
| `401` | Unauthorized | Missing or invalid authentication |
| `404` | Not Found | Resource doesn't exist |
| `500` | Internal Server Error | Server error, database issue, external API failure |

### Common Error Scenarios

**Invalid Partner ID:**
```json
{
  "error": "Partner not found"
}
```

**Missing Required Field:**
```json
{
  "error": "prospect_ids array is required"
}
```

**Invalid Coordinates:**
```json
{
  "error": "lat must be between -90 and 90"
}
```

**Dropbox Authentication:**
```json
{
  "error": "Dropbox authentication failed: ... Please re-authenticate."
}
```

---

## Integration Examples

### JavaScript/TypeScript (Frontend)

```typescript
// List partners with filters
const getPartners = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page);
  if (filters.status) params.append('status', filters.status);
  if (filters.country) params.append('country_code', filters.country);
  
  const response = await fetch(`/api/partners?${params}`, {
    credentials: 'include'
  });
  return response.json();
};

// Get partner with photos
const getPartnerWithPhotos = async (partnerId: string) => {
  const [partner, photos] = await Promise.all([
    fetch(`/api/partners/${partnerId}`, { credentials: 'include' }),
    fetch(`/api/partners/${partnerId}/photos`, { credentials: 'include' })
  ]);
  
  return {
    partner: await partner.json(),
    photos: await photos.json()
  };
};

// Update partner
const updatePartner = async (partnerId: string, updates: any) => {
  const response = await fetch(`/api/partners/${partnerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Promote prospects
const promoteToPartners = async (prospectIds: number[]) => {
  const response = await fetch('/api/partners/promote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ prospect_ids: prospectIds })
  });
  return response.json();
};
```

### Python (Backend/External)

```python
import requests

BASE_URL = "https://your-domain.com"
API_KEY = "your-api-key"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# List partners
def get_partners(page=1, per_page=50, status=None, country_code=None):
    params = {"page": page, "per_page": per_page}
    if status:
        params["status"] = status
    if country_code:
        params["country_code"] = country_code
    
    response = requests.get(
        f"{BASE_URL}/api/partners",
        headers=headers,
        params=params
    )
    return response.json()

# Get partner photos
def get_partner_photos(partner_id):
    response = requests.get(
        f"{BASE_URL}/api/partners/{partner_id}/photos",
        headers=headers
    )
    return response.json()

# Update partner
def update_partner(partner_id, updates):
    response = requests.patch(
        f"{BASE_URL}/api/partners/{partner_id}",
        headers=headers,
        json=updates
    )
    return response.json()

# Promote prospects
def promote_prospects(prospect_ids):
    response = requests.post(
        f"{BASE_URL}/api/partners/promote",
        headers=headers,
        json={"prospect_ids": prospect_ids}
    )
    return response.json()
```

### cURL Examples

```bash
# List active partners in US
curl -H "X-API-Key: your-api-key" \
     "https://your-domain.com/api/partners?status=active&country_code=US"

# Get partner details
curl -H "X-API-Key: your-api-key" \
     "https://your-domain.com/api/partners/550e8400-e29b-41d4-a716-446655440000"

# Update partner website
curl -X PATCH \
     -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"website": "https://newwebsite.com"}' \
     "https://your-domain.com/api/partners/550e8400-e29b-41d4-a716-446655440000"

# Promote prospects
curl -X POST \
     -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"prospect_ids": [12345, 12346]}' \
     "https://your-domain.com/api/partners/promote"

# Get partner photos
curl -H "X-API-Key: your-api-key" \
     "https://your-domain.com/api/partners/550e8400-e29b-41d4-a716-446655440000/photos"
```

---

## Best Practices

### 1. Pagination
Always use pagination when listing partners to avoid loading too much data:
```javascript
const partners = await getPartners({ page: 1, per_page: 50 });
```

### 2. Error Handling
Always handle errors gracefully:
```javascript
try {
  const data = await fetch('/api/partners');
  if (!data.ok) throw new Error(data.error);
  // Process data
} catch (error) {
  console.error('Failed to fetch partners:', error);
  // Show user-friendly error message
}
```

### 3. Coordinate Validation
When updating coordinates, ensure they're within valid ranges:
- Latitude: -90 to 90
- Longitude: -180 to 180

### 4. Photo URLs
Photo URLs from Dropbox are temporary (4-hour validity). Cache them appropriately or refresh when needed.

### 5. Idempotent Operations
The promote endpoint is idempotent - safe to call multiple times with the same prospect IDs.

### 6. Rate Limiting
Be mindful of rate limits when making multiple requests. Consider batching operations when possible.

---

## Rate Limits

Currently, there are no explicit rate limits, but:
- Dropbox API has rate limits (check Dropbox documentation)
- Reverse geocoding (for country codes) is rate-limited to 1 request/second
- Database queries should be optimized with pagination

---

## Support

For issues or questions:
- Check error messages for specific guidance
- Review this documentation for endpoint details
- Check server logs for detailed error information

---

## Changelog

### 2024-01-21
- Added photo fetching endpoint (`GET /api/partners/<id>/photos`)
- Added automatic country code backfill from coordinates
- Improved error messages for Dropbox operations

### 2024-01-15
- Initial Partners API release
- Partner promotion endpoint
- Dropbox folder assignment
- Partner CRUD operations

---

**Last Updated:** January 21, 2024

