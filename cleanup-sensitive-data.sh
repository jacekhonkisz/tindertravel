#!/bin/bash

# Security Cleanup Script for Glintz Repository
# Removes hardcoded API keys and replaces with environment variables

echo "🔒 Starting security cleanup..."

# Define the sensitive patterns
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs"
GOOGLE_KEY="AIzaSyB7zSml4J0qcISSIZUpsSigli1J9Ifx7wU"

# Count files that need cleaning
echo "📊 Scanning for sensitive data..."

SUPABASE_FILES=$(grep -r "$SUPABASE_KEY" /Users/ala/tindertravel/api --include="*.js" | wc -l)
GOOGLE_FILES=$(grep -r "$GOOGLE_KEY" /Users/ala/tindertravel --include="*.js" --include="*.json" | wc -l)

echo "Found $SUPABASE_FILES files with hardcoded Supabase keys"
echo "Found $GOOGLE_FILES files with hardcoded Google API keys"

if [ "$SUPABASE_FILES" -gt 0 ] || [ "$GOOGLE_FILES" -gt 0 ]; then
    echo "⚠️  Sensitive data found! Starting cleanup..."
    
    # Clean Supabase keys
    echo "🧹 Cleaning Supabase keys..."
    find /Users/ala/tindertravel/api -name "*.js" -type f -exec sed -i '' "s|'$SUPABASE_KEY'|process.env.SUPABASE_ANON_KEY \|\| 'YOUR_SUPABASE_ANON_KEY_HERE'|g" {} \;
    find /Users/ala/tindertravel/api -name "*.js" -type f -exec sed -i '' "s|\"$SUPABASE_KEY\"|process.env.SUPABASE_ANON_KEY \|\| \"YOUR_SUPABASE_ANON_KEY_HERE\"|g" {} \;
    
    # Clean Google API keys
    echo "🧹 Cleaning Google API keys..."
    find /Users/ala/tindertravel -name "*.js" -type f -exec sed -i '' "s|$GOOGLE_KEY|process.env.GOOGLE_PLACES_API_KEY \|\| 'YOUR_GOOGLE_PLACES_API_KEY_HERE'|g" {} \;
    find /Users/ala/tindertravel -name "*.json" -type f -exec sed -i '' "s|$GOOGLE_KEY|YOUR_GOOGLE_PLACES_API_KEY_HERE|g" {} \;
    
    echo "✅ Cleanup completed!"
else
    echo "✅ No sensitive data found - repository is clean!"
fi

# Update .gitignore
echo "📝 Updating .gitignore..."
cat >> /Users/ala/tindertravel/.gitignore << 'EOF'

# Environment variables
.env
.env.local
.env.production
.env.staging
*.env

# API Keys and Secrets
*secret*
*key*
*password*
*token*

# Sensitive data
config/secrets.js
secrets.json
api-keys.json
EOF

echo "✅ .gitignore updated!"

# Create environment template
echo "📄 Creating environment template..."
cat > /Users/ala/tindertravel/.env.example << 'EOF'
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Google APIs
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Amadeus API
AMADEUS_API_KEY=your_amadeus_api_key_here
AMADEUS_API_SECRET=your_amadeus_api_secret_here

# Other APIs
HOTELLOOK_TOKEN=your_hotellook_token_here
SERPAPI_KEY=your_serpapi_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
EOF

echo "✅ Environment template created!"

echo ""
echo "🎉 Security cleanup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy .env.example to .env and fill in your actual keys"
echo "2. Test the application to ensure it works with environment variables"
echo "3. Commit and push to GitHub"
echo ""
echo "⚠️  Remember: Never commit .env files to version control!"
