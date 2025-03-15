import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text, Alert, Platform } from 'react-native';
import { Modal, Button, Card, Title, ActivityIndicator, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { FoodData, detectFoodFromImage } from '../services/FoodDetectionService';

// Food database for fallback and supplementary information
const foodCalorieDatabase: Record<string, { 
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_size: string;
}> = {
  "pancake": { calories: 595, protein: 11, carbs: 93, fat: 21, fiber: 3, serving_size: "3 pancakes" },
  "blueberry": { calories: 8, protein: 0.1, carbs: 2, fat: 0, fiber: 0.4, serving_size: "10 berries" },
  "syrup": { calories: 12, protein: 0, carbs: 3, fat: 0, fiber: 0, serving_size: "1 tbsp" },
  "apple": { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, serving_size: "1 medium" },
  "banana": { calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, serving_size: "1 medium" },
  "orange": { calories: 62, protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1, serving_size: "1 medium" },
  "rice": { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, serving_size: "100g" },
  "bread": { calories: 75, protein: 3, carbs: 13, fat: 1, fiber: 1.1, serving_size: "1 slice" },
  "egg": { calories: 72, protein: 6.3, carbs: 0.4, fat: 5, fiber: 0, serving_size: "1 large" },
  "chicken": { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, serving_size: "100g" },
  "beef": { calories: 250, protein: 26, carbs: 0, fat: 17, fiber: 0, serving_size: "100g" },
  "fish": { calories: 136, protein: 20, carbs: 0, fat: 5, fiber: 0, serving_size: "100g" },
  "carrot": { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, serving_size: "1 medium" },
  "broccoli": { calories: 55, protein: 3.7, carbs: 11, fat: 0.6, fiber: 5.1, serving_size: "100g" },
  "tomato": { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, serving_size: "1 medium" },
  "potato": { calories: 163, protein: 4.3, carbs: 37, fat: 0.2, fiber: 3.8, serving_size: "1 medium" },
  "chapati": { calories: 120, protein: 3, carbs: 20, fat: 3.5, fiber: 1.2, serving_size: "1 piece" },
  "dal": { calories: 116, protein: 7, carbs: 20, fat: 0.4, fiber: 2, serving_size: "100g" },
  "paneer": { calories: 265, protein: 18, carbs: 3.6, fat: 21, fiber: 0, serving_size: "100g" }
};

// API Ninjas key - Replace with your actual API key
// Note: CalorieNinjas is migrating to API Ninjas
const API_NINJAS_KEY = '6H4B5MUFXSQKYkdwFPiu0w==uHs8zVhStrikeZEf';

interface FoodCameraProps {
  visible: boolean;
  onClose: () => void;
  onFoodDetected: (foodData: FoodData[]) => void;
}

interface DetectedObject {
  id: number;
  name: string;
  x: number;
  y: number;
  confidence: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_size: string;
}

const FoodCamera: React.FC<FoodCameraProps> = ({ visible, onClose, onFoodDetected }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [captureMode, setCaptureMode] = useState<'select' | 'captured'>('select');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [recognizedFoodText, setRecognizedFoodText] = useState<string>('');

  // Request camera permissions
  useEffect(() => {
    if (visible) {
      (async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      })();
    }
  }, [visible]);

  // Reset camera to select mode
  const resetCamera = () => {
    setCaptureMode('select');
    setCapturedImage(null);
    setDetectedObjects([]);
    setRecognizedFoodText('');
  };

  // Take a picture using camera
  const takePicture = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaType: [ImagePicker.MediaType.Images],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled) {
        const photo = result.assets[0];
        setCapturedImage(photo.uri);
        setCaptureMode('captured');
        
        // Process the image
        await processImage(photo.base64 || '');
      } else {
        // User canceled
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
      setIsProcessing(false);
    }
  };

  // Select image from gallery
  const selectImage = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaType: [ImagePicker.MediaType.Images],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled) {
        const photo = result.assets[0];
        setCapturedImage(photo.uri);
        setCaptureMode('captured');
        
        // Process the image
        await processImage(photo.base64 || '');
      } else {
        // User canceled
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
      setIsProcessing(false);
    }
  };

  // Process the image using food detection API
  const processImage = async (base64Image: string) => {
    try {
      const detectedFoodItems = await detectFoodFromImage(base64Image);
      
      if (detectedFoodItems && detectedFoodItems.length > 0) {
        // Create detected objects from the API response
        const objects: DetectedObject[] = detectedFoodItems.map((item, index) => {
          return {
            id: index,
            name: item.name,
            x: 0.2 + (index * 0.2) % 0.8, // Random position for display
            y: 0.3 + (index * 0.15) % 0.4,
            confidence: 0.9,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            fiber: item.fiber,
            serving_size: item.serving_size
          };
        });
        
        setDetectedObjects(objects);
        setRecognizedFoodText(detectedFoodItems.map(item => item.name).join(', '));
      } else {
        // If no foods detected, show an error
        Alert.alert('No Food Detected', 'Could not recognize any food items in the image. Please try again.');
        resetCamera();
      }
    } catch (error) {
      console.error('Error detecting food:', error);
      Alert.alert('Error', 'Failed to detect food. Please try again.');
      resetCamera();
    } finally {
      setIsProcessing(false);
    }
  };

  // Add detected food to log
  const addToFoodLog = () => {
    if (detectedObjects.length > 0) {
      const foodItems: FoodData[] = detectedObjects.map(obj => ({
        name: obj.name,
        calories: obj.calories,
        protein: obj.protein,
        carbs: obj.carbs,
        fat: obj.fat,
        fiber: obj.fiber,
        serving_size: obj.serving_size
      }));
      
      onFoodDetected(foodItems);
      onClose();
    }
  };

  // Render the camera screen
  return (
    <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalContainer}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="close"
            size={24}
            onPress={onClose}
            style={styles.closeButton}
            iconColor="#00e6ac"
          />
          <Text style={styles.headerTitle}>Food Camera</Text>
          <View style={{ width: 40 }} />
        </View>
        
        {/* Main content */}
        <View style={styles.content}>
          {hasPermission === null ? (
            <View style={styles.messageContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.messageText}>Requesting camera permission...</Text>
            </View>
          ) : hasPermission === false ? (
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>No access to camera</Text>
              <Button mode="contained" onPress={() => ImagePicker.requestCameraPermissionsAsync()}>
                Grant Permission
              </Button>
            </View>
          ) : captureMode === 'select' ? (
            <View style={styles.cameraContainer}>
              <View style={styles.previewPlaceholder}>
                <Text style={styles.guideText}>Take a photo of your food or select from gallery</Text>
              </View>
              
              <View style={styles.cameraControls}>
                <Button 
                  mode="contained" 
                  icon="camera" 
                  onPress={takePicture}
                  style={styles.cameraButton}
                  disabled={isProcessing}
                  buttonColor="#00e6ac"
                >
                  Take Photo
                </Button>
                <Button 
                  mode="outlined" 
                  icon="image" 
                  onPress={selectImage}
                  style={styles.galleryButton}
                  disabled={isProcessing}
                  textColor="#00e6ac"
                  buttonColor="transparent"
                >
                  Gallery
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.resultContainer}>
              {/* Image preview */}
              {capturedImage && (
                <Image source={{ uri: capturedImage }} style={styles.previewImage} />
              )}
              
              {/* Processing indicator */}
              {isProcessing ? (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.processingText}>Analyzing food...</Text>
                </View>
              ) : (
                <>
                  {/* Detected objects */}
                  {detectedObjects.map((obj) => (
                    <View
                      key={obj.id}
                      style={[
                        styles.detectionBox,
                        {
                          left: `${obj.x * 100}%`,
                          top: `${obj.y * 100}%`,
                        },
                      ]}
                    >
                      <Text style={styles.detectionLabel}>{obj.name}</Text>
                    </View>
                  ))}
                  
                  {/* Results panel */}
                  <View style={styles.resultsPanel}>
                    <Card style={styles.resultsCard}>
                      <Card.Content>
                        <Title>Detected Food</Title>
                        <Text style={styles.detectedFoodText}>{recognizedFoodText}</Text>
                        
                        {detectedObjects.length > 0 && (
                          <View style={styles.nutritionInfo}>
                            <Text style={styles.nutritionTitle}>Nutrition Information:</Text>
                            {detectedObjects.map((obj) => (
                              <View key={obj.id} style={styles.foodItem}>
                                <Text style={styles.foodName}>{obj.name}</Text>
                                <Text>Calories: {obj.calories} kcal</Text>
                                <Text>Protein: {obj.protein}g</Text>
                                <Text>Carbs: {obj.carbs}g</Text>
                                <Text>Fat: {obj.fat}g</Text>
                                <Text>Fiber: {obj.fiber}g</Text>
                                <Text>Serving: {obj.serving_size}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </Card.Content>
                      <Card.Actions style={styles.cardActions}>
                        <Button 
                          onPress={resetCamera}
                          textColor="#00e6ac"
                        >
                          Retake
                        </Button>
                        <Button 
                          mode="contained" 
                          onPress={addToFoodLog}
                          disabled={detectedObjects.length === 0}
                          buttonColor="#00e6ac"
                        >
                          Add to Log
                        </Button>
                      </Card.Actions>
                    </Card>
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    margin: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  content: {
    flex: 1,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  previewPlaceholder: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    borderRadius: 10,
  },
  guideText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  cameraButton: {
    flex: 1,
    marginRight: 10,
  },
  galleryButton: {
    flex: 1,
    marginLeft: 10,
  },
  resultContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  detectionBox: {
    position: 'absolute',
    width: 100,
    height: 40,
    borderWidth: 2,
    borderColor: '#00ff00',
    backgroundColor: 'rgba(0,255,0,0.2)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  detectionLabel: {
    backgroundColor: '#00ff00',
    color: '#000',
    fontSize: 12,
    padding: 2,
    width: '100%',
    textAlign: 'center',
  },
  resultsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '50%',
  },
  resultsCard: {
    margin: 10,
    maxHeight: '100%',
  },
  detectedFoodText: {
    fontSize: 16,
    marginVertical: 10,
  },
  nutritionInfo: {
    marginTop: 10,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  foodItem: {
    marginVertical: 5,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
});

export default FoodCamera; 