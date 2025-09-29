const fs = require('fs');

// Read the unified server file
let content = fs.readFileSync('unified-server.js', 'utf8');

// Add the photo removal endpoint before the server starts
const photoEndpoint = `
// Direct photo removal endpoint (dev mode only)
app.delete('/api/photos/remove/:hotelId/:photoIndex', async (req, res) => {
  try {
    const { hotelId, photoIndex } = req.params;
    const index = parseInt(photoIndex);

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        error: 'Invalid photo index',
        message: 'Photo index must be a non-negative number'
      });
    }

    // Get current hotel data
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('photos')
      .eq('id', hotelId)
      .single();

    if (hotelError || !hotel) {
      return res.status(404).json({
        error: 'Hotel not found',
        message: hotelError?.message || 'Hotel not found'
      });
    }

    const currentPhotos = hotel.photos || [];
    
    if (index >= currentPhotos.length) {
      return res.status(400).json({
        error: 'Photo index out of range',
        message: \`Photo index \${index} is out of range. Hotel has \${currentPhotos.length} photos.\`
      });
    }

    // Remove the photo at the specified index
    const updatedPhotos = currentPhotos.filter((_, idx) => idx !== index);
    const removedPhotoUrl = currentPhotos[index];

    // Update hotel photos
    const { error: updateError } = await supabase
      .from('hotels')
      .update({ photos: updatedPhotos })
      .eq('id', hotelId);

    if (updateError) {
      throw new Error(\`Failed to update hotel photos: \${updateError.message}\`);
    }

    // Update or create photo curation record
    const { data: existingCuration } = await supabase
      .from('photo_curations')
      .select('*')
      .eq('hotel_id', hotelId)
      .single();

    if (existingCuration) {
      // Update existing curation
      const updatedRemovedPhotos = [...(existingCuration.removed_photos || []), removedPhotoUrl];
      
      const { error } = await supabase
        .from('photo_curations')
        .update({
          curated_photos: updatedPhotos,
          removed_photos: updatedRemovedPhotos,
          photo_order: updatedPhotos.map((_, idx) => idx),
          updated_at: new Date().toISOString(),
        })
        .eq('hotel_id', hotelId);

      if (error) {
        console.warn('Failed to update photo curation:', error.message);
      }
    } else {
      // Create new curation record
      const { error } = await supabase
        .from('photo_curations')
        .insert({
          hotel_id: hotelId,
          original_photos: currentPhotos,
          curated_photos: updatedPhotos,
          removed_photos: [removedPhotoUrl],
          photo_order: updatedPhotos.map((_, idx) => idx),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('Failed to create photo curation:', error.message);
      }
    }

    console.log(\`✅ Photo removed directly from hotel \${hotelId} at index \${index}\`);

    res.json({
      success: true,
      message: 'Photo removed successfully',
      hotelId,
      photoIndex: index,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to remove photo directly:', error);
    res.status(500).json({
      error: 'Failed to remove photo',
      message: error.message
    });
  }
});

`;

// Insert the endpoint before the server starts
const insertPoint = '// Start server on all interfaces';
const newContent = content.replace(insertPoint, photoEndpoint + insertPoint);

// Write the updated content
fs.writeFileSync('unified-server.js', newContent);

console.log('✅ Added photo removal endpoint to unified server');
