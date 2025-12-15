#!/bin/bash

# Quick progress checker for Google Places photo fetcher

echo "========================================"
echo "📊 Google Places Photo Fetcher Status"
echo "========================================"
echo ""

# Check if process is running
if ps aux | grep -q "[g]oogle-places-photo-fetcher.js"; then
    echo "✅ Status: RUNNING"
    echo ""
    
    # Show progress from log
    echo "📈 Current Progress:"
    tail -20 google-places-fetch-log.txt | grep "Progress:"  | tail -1
    
    # Show cost
    echo ""
    echo "💰 Current Cost:"
    tail -20 google-places-fetch-log.txt | grep "Cost so far:" | tail -1
    
    # Show current hotel
    echo ""
    echo "🏨 Current Hotel:"
    tail -30 google-places-fetch-log.txt | grep "📸 Processing:" | tail -1
    
    # Estimate completion
    echo ""
    PROGRESS=$(tail -50 google-places-fetch-log.txt | grep "Progress:" | tail -1 | grep -oP '\d+/\d+' | cut -d'/' -f1)
    if [ ! -z "$PROGRESS" ]; then
        REMAINING=$((543 - PROGRESS))
        MINUTES=$((REMAINING * 1 / 60))
        HOURS=$((MINUTES / 60))
        MINS=$((MINUTES % 60))
        echo "⏱️  Estimated time remaining: ~${HOURS}h ${MINS}m"
    fi
else
    echo "❌ Status: NOT RUNNING"
    echo ""
    
    # Check if completed
    if [ -f "google-places-fetch-report.json" ]; then
        echo "✅ COMPLETED!"
        echo ""
        echo "📊 Final Results:"
        cat google-places-fetch-report.json | grep -E "successful|failed|totalPhotos|estimatedCost" | head -10
    else
        echo "⚠️  Process may have stopped. Check google-places-fetch-log.txt for errors."
    fi
fi

echo ""
echo "========================================"
echo "To view full log: tail -f google-places-fetch-log.txt"
echo "To check again: bash check-fetch-progress.sh"
echo "========================================"

