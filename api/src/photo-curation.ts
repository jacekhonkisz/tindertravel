import { supabase } from './supabase';

export interface PhotoCuration {
  id: string;
  hotel_id: string;
  original_photos: string[];
  curated_photos: string[];
  removed_photos: string[];
  photo_order: number[];
  created_at: string;
  updated_at: string;
}

export interface CuratedPhoto {
  url: string;
  order: number;
  is_removed: boolean;
}

export class PhotoCurationService {
  /**
   * Save photo curation changes for a hotel
   */
  async savePhotoCuration(
    hotelId: string,
    originalPhotos: string[],
    curatedPhotos: CuratedPhoto[]
  ): Promise<void> {
    try {
      // Separate active and removed photos
      const activePhotos = curatedPhotos
        .filter(photo => !photo.is_removed)
        .sort((a, b) => a.order - b.order)
        .map(photo => photo.url);

      const removedPhotos = curatedPhotos
        .filter(photo => photo.is_removed)
        .map(photo => photo.url);

      const photoOrder = curatedPhotos
        .filter(photo => !photo.is_removed)
        .sort((a, b) => a.order - b.order)
        .map((_, index) => index);

      // Check if curation already exists
      const { data: existing } = await supabase
        .from('photo_curations')
        .select('id')
        .eq('hotel_id', hotelId)
        .single();

      const curationData = {
        hotel_id: hotelId,
        original_photos: originalPhotos,
        curated_photos: activePhotos,
        removed_photos: removedPhotos,
        photo_order: photoOrder,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        // Update existing curation
        const { error } = await supabase
          .from('photo_curations')
          .update(curationData)
          .eq('hotel_id', hotelId);

        if (error) {
          throw new Error(`Failed to update photo curation: ${error.message}`);
        }
      } else {
        // Create new curation
        const { error } = await supabase
          .from('photo_curations')
          .insert({
            ...curationData,
            created_at: new Date().toISOString(),
          });

        if (error) {
          throw new Error(`Failed to create photo curation: ${error.message}`);
        }
      }

      // Update the hotel's photos array with curated photos
      await this.updateHotelPhotos(hotelId, activePhotos);

    } catch (error) {
      console.error('Error saving photo curation:', error);
      throw error;
    }
  }

  /**
   * Get photo curation for a hotel
   */
  async getPhotoCuration(hotelId: string): Promise<PhotoCuration | null> {
    try {
      const { data, error } = await supabase
        .from('photo_curations')
        .select('*')
        .eq('hotel_id', hotelId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Failed to get photo curation: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting photo curation:', error);
      return null;
    }
  }

  /**
   * Update hotel's photos array in the main hotels table
   */
  private async updateHotelPhotos(hotelId: string, curatedPhotos: string[]): Promise<void> {
    try {
      const updateData: any = {
        photos: curatedPhotos,
        updated_at: new Date().toISOString(),
      };

      // Set hero photo to first curated photo if available
      if (curatedPhotos.length > 0) {
        updateData.hero_photo = curatedPhotos[0];
      }

      const { error } = await supabase
        .from('hotels')
        .update(updateData)
        .eq('id', hotelId);

      if (error) {
        throw new Error(`Failed to update hotel photos: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating hotel photos:', error);
      throw error;
    }
  }

  /**
   * Get all curated hotels (hotels with photo curations)
   */
  async getCuratedHotels(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select(`
          *,
          photo_curations (
            curated_photos,
            removed_photos,
            photo_order,
            updated_at
          )
        `)
        .not('photo_curations', 'is', null);

      if (error) {
        throw new Error(`Failed to get curated hotels: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting curated hotels:', error);
      return [];
    }
  }

  /**
   * Reset photo curation for a hotel (restore original photos)
   */
  async resetPhotoCuration(hotelId: string): Promise<void> {
    try {
      // Get original photos from curation
      const curation = await this.getPhotoCuration(hotelId);
      if (!curation) {
        throw new Error('No photo curation found for this hotel');
      }

      // Restore original photos to hotel
      await this.updateHotelPhotos(hotelId, curation.original_photos);

      // Delete curation record
      const { error } = await supabase
        .from('photo_curations')
        .delete()
        .eq('hotel_id', hotelId);

      if (error) {
        throw new Error(`Failed to delete photo curation: ${error.message}`);
      }
    } catch (error) {
      console.error('Error resetting photo curation:', error);
      throw error;
    }
  }

  /**
   * Get photo quality statistics
   */
  async getPhotoQualityStats(): Promise<{
    totalHotels: number;
    curatedHotels: number;
    averagePhotosPerHotel: number;
    averageRemovedPhotos: number;
  }> {
    try {
      // Get total hotels count
      const { count: totalHotels } = await supabase
        .from('hotels')
        .select('*', { count: 'exact', head: true });

      // Get curated hotels count
      const { count: curatedHotels } = await supabase
        .from('photo_curations')
        .select('*', { count: 'exact', head: true });

      // Get average photos per hotel
      const { data: hotelPhotos } = await supabase
        .from('hotels')
        .select('photos');

      const totalPhotos = hotelPhotos?.reduce((sum, hotel) => {
        return sum + (hotel.photos?.length || 0);
      }, 0) || 0;

      // Get average removed photos
      const { data: curations } = await supabase
        .from('photo_curations')
        .select('removed_photos');

      const totalRemovedPhotos = curations?.reduce((sum, curation) => {
        return sum + (curation.removed_photos?.length || 0);
      }, 0) || 0;

      return {
        totalHotels: totalHotels || 0,
        curatedHotels: curatedHotels || 0,
        averagePhotosPerHotel: totalHotels ? totalPhotos / totalHotels : 0,
        averageRemovedPhotos: curatedHotels ? totalRemovedPhotos / curatedHotels : 0,
      };
    } catch (error) {
      console.error('Error getting photo quality stats:', error);
      return {
        totalHotels: 0,
        curatedHotels: 0,
        averagePhotosPerHotel: 0,
        averageRemovedPhotos: 0,
      };
    }
  }

  /**
   * Directly remove a photo from a hotel by index (dev mode only)
   */
  async removePhotoDirectly(hotelId: string, photoIndex: number): Promise<void> {
    try {
      // Get current hotel data
      const { data: hotel, error: hotelError } = await supabase
        .from('hotels')
        .select('photos')
        .eq('id', hotelId)
        .single();

      if (hotelError || !hotel) {
        throw new Error(`Hotel not found: ${hotelError?.message || 'Unknown error'}`);
      }

      const currentPhotos = hotel.photos || [];
      
      if (photoIndex >= currentPhotos.length) {
        throw new Error(`Photo index ${photoIndex} is out of range. Hotel has ${currentPhotos.length} photos.`);
      }

      // Remove the photo at the specified index
      const updatedPhotos = currentPhotos.filter((_: string, index: number) => index !== photoIndex);
      const removedPhotoUrl = currentPhotos[photoIndex];

      // Update hotel photos
      await this.updateHotelPhotos(hotelId, updatedPhotos);

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
            photo_order: updatedPhotos.map((_: string, index: number) => index),
            updated_at: new Date().toISOString(),
          })
          .eq('hotel_id', hotelId);

        if (error) {
          throw new Error(`Failed to update photo curation: ${error.message}`);
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
            photo_order: updatedPhotos.map((_: string, index: number) => index),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) {
          throw new Error(`Failed to create photo curation: ${error.message}`);
        }
      }

      console.log(`✅ Photo removed directly from hotel ${hotelId} at index ${photoIndex}`);
    } catch (error) {
      console.error('Error removing photo directly:', error);
      throw error;
    }
  }
}

export const photoCurationService = new PhotoCurationService(); 