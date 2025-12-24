import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  PanResponder,
  Animated,
} from 'react-native';
import Icon from '../ui/Icon';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Photo {
  url: string;
  id: string;
  order: number;
}

interface PhotoManagerProps {
  visible: boolean;
  onClose: () => void;
  hotelId: string;
  hotelName: string;
  photos: Photo[];
  onSave: (updatedPhotos: Photo[]) => void;
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({
  visible,
  onClose,
  hotelId,
  hotelName,
  photos: initialPhotos,
  onSave,
}) => {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<Set<string>>(new Set());

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        // Start dragging
      },
      onPanResponderMove: (evt, gestureState) => {
        // Handle drag movement
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Handle drop
        setDraggedIndex(null);
      },
    })
  ).current;

  const removePhoto = (photoId: string) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setRemovedPhotoIds(prev => new Set(prev).add(photoId));
            setHasChanges(true);
          },
        },
      ]
    );
  };

  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const updatedPhotos = [...photos];
    const [movedPhoto] = updatedPhotos.splice(fromIndex, 1);
    updatedPhotos.splice(toIndex, 0, movedPhoto);

    // Update order numbers
    const reorderedPhotos = updatedPhotos.map((photo, index) => ({
      ...photo,
      order: index,
    }));

    setPhotos(reorderedPhotos);
    setHasChanges(true);
  };

  const openZoom = (photo: Photo) => {
    setSelectedPhoto(photo);
    setZoomVisible(true);
  };

  const saveChanges = async () => {
    try {
      // Only save non-removed photos in the correct order
      const activePhotos = photos.filter(photo => 
        !removedPhotoIds.has(photo.id)
      ).map((photo, index) => ({
        ...photo,
        order: index,
      }));
      
      await onSave(activePhotos);
      setHasChanges(false);
      Alert.alert('Success', 'Photo changes saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    }
  };

  const resetChanges = () => {
    Alert.alert(
      'Reset Changes',
      'Are you sure you want to discard all changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setPhotos(initialPhotos);
            setHasChanges(false);
          },
        },
      ]
    );
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} variant="navy" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Photo Manager</Text>
              <Text style={styles.headerSubtitle}>{hotelName}</Text>
            </View>
            <View style={styles.headerRight}>
              {hasChanges && (
                <TouchableOpacity onPress={resetChanges} style={styles.resetButton}>
                  <Icon name="refresh" size={20} variant="accent" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Photo Grid */}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.photoGrid}>
            <Text style={styles.instructionText}>
              Tap to zoom • Long press and drag to reorder • Tap X to remove
            </Text>
            
            {photos
              .filter(photo => !removedPhotoIds.has(photo.id))
              .map((photo, index) => (
              <View key={photo.id} style={styles.photoContainer}>
                <TouchableOpacity
                  onPress={() => openZoom(photo)}
                  onLongPress={() => setDraggedIndex(index)}
                  style={[
                    styles.photoWrapper,
                    draggedIndex === index && styles.draggedPhoto,
                  ]}
                >
                  <Image source={{ uri: photo.url }} style={styles.photo} />
                  
                  {/* Order indicator */}
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderText}>{index + 1}</Text>
                  </View>

                  {/* Remove button */}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePhoto(photo.id)}
                  >
                    <Icon name="close-circle" size={24} variant="accent" />
                  </TouchableOpacity>

                  {/* Drag handle */}
                  <View style={styles.dragHandle}>
                    <Icon name="menu" size={20} variant="navy" />
                  </View>
                </TouchableOpacity>

                {/* Reorder buttons */}
                <View style={styles.reorderButtons}>
                  <TouchableOpacity
                    onPress={() => movePhoto(index, Math.max(0, index - 1))}
                    disabled={index === 0}
                    style={[styles.reorderButton, index === 0 && styles.disabledButton]}
                  >
                    <Icon name="chevron-up" size={16} color={index === 0 ? "#ccc" : undefined} variant={index === 0 ? "default" : "navy"} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => movePhoto(index, Math.min(photos.length - 1, index + 1))}
                    disabled={index === photos.length - 1}
                    style={[styles.reorderButton, index === photos.length - 1 && styles.disabledButton]}
                  >
                    <Icon name="chevron-down" size={16} color={index === photos.length - 1 ? "#ccc" : undefined} variant={index === photos.length - 1 ? "default" : "navy"} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.photoCount}>
              <Text style={styles.photoCountText}>
                {photos.filter(p => !removedPhotoIds.has(p.id)).length} photo{photos.filter(p => !removedPhotoIds.has(p.id)).length !== 1 ? 's' : ''}
                {removedPhotoIds.size > 0 && (
                  <Text style={styles.removedCountText}> ({removedPhotoIds.size} removed)</Text>
                )}
              </Text>
            </View>
            
            {hasChanges && (
              <TouchableOpacity onPress={saveChanges} style={styles.saveButton}>
                <Icon name="checkmark" size={20} variant="white" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Zoom Modal */}
      <Modal visible={zoomVisible} transparent animationType="fade">
        <View style={styles.zoomContainer}>
          <TouchableOpacity
            style={styles.zoomOverlay}
            onPress={() => setZoomVisible(false)}
          >
            <View style={styles.zoomContent}>
              {selectedPhoto && (
                <>
                  <Image
                    source={{ uri: selectedPhoto.url }}
                    style={styles.zoomedImage}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={styles.zoomCloseButton}
                    onPress={() => setZoomVisible(false)}
                  >
                    <Icon name="close" size={30} variant="white" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  closeButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  resetButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  photoGrid: {
    padding: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  photoContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoWrapper: {
    flex: 1,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  draggedPhoto: {
    opacity: 0.7,
    transform: [{ scale: 1.05 }],
  },
  photo: {
    width: '100%',
    height: 120,
  },
  orderBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  dragHandle: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    padding: 4,
  },
  reorderButtons: {
    marginLeft: 12,
    alignItems: 'center',
  },
  reorderButton: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 8,
    marginVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  photoCount: {
    flex: 1,
  },
  photoCountText: {
    fontSize: 14,
    color: '#666',
  },
  removedCountText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontStyle: 'italic',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  zoomContainer: {
    flex: 1,
    backgroundColor: '#000', // Changed from rgba(0, 0, 0, 0.9) to solid black for true full-screen
  },
  zoomOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomContent: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomedImage: {
    width: screenWidth, // Changed from screenWidth - 40 to full width
    height: screenHeight, // Changed from screenHeight - 100 to full height
  },
  zoomCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
}); 