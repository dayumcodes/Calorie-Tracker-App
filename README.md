# Indian Calorie Tracker App

A React Native application for tracking calories with a focus on Indian cuisine. The app allows users to log their food intake, track nutritional information, and monitor their daily calorie consumption.

## Features

- Food database with nutritional information for common Indian and international foods
- Daily calorie tracking and summary
- Food logging with meal categorization
- Recipe database with nutritional information
- Camera-based food recognition for easy logging
- User profile management

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Android Studio or Xcode (for emulators)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the Expo development server:
   ```
   npx expo start
   ```

## Camera Functionality

The app includes a camera feature for food recognition. For the best experience:

1. Use a physical device (not an emulator) for testing the camera functionality
2. Make sure you've granted camera permissions to the app
3. Ensure you have the latest version of expo-camera installed:
   ```
   npx expo install expo-camera
   ```

### Using the Real Camera

To use the real camera instead of the mock implementation:

1. Open `src/components/FoodCamera.tsx`
2. Import the Camera component from expo-camera:
   ```javascript
   import { Camera } from 'expo-camera';
   ```
3. Replace the MockCamera component with the real Camera component:
   ```javascript
   <Camera
     ref={cameraRef}
     style={styles.camera}
     type={type === CameraType.back ? Camera.Constants.Type.back : Camera.Constants.Type.front}
     onCameraReady={onCameraReady}
     ratio="16:9"
   >
   ```
4. Update the camera permissions request:
   ```javascript
   const { status } = await Camera.requestCameraPermissionsAsync();
   ```

### Troubleshooting Camera Issues

If the camera shows a black screen:

1. Check the expo-camera version compatibility with your Expo SDK version
2. Try rebuilding the app with `npx expo start --clear`
3. On Android, make sure the camera permission is granted in the device settings
4. On iOS, verify the camera permission in the device settings under Privacy
5. If issues persist, the app will use the mock implementation that demonstrates the food recognition workflow

## API Keys Setup

This app uses two external APIs for food recognition and nutrition data:

### 1. LogMeal API (Food Recognition)

The app uses LogMeal API for real food recognition from images:

1. Sign up for an account at [LogMeal API](https://logmeal.com/api)
2. Get your API key from the dashboard
3. Replace the placeholder in `src/services/FoodDetectionService.ts`:
   ```javascript
   const LOGMEAL_API_KEY = 'YOUR_LOGMEAL_API_KEY';
   ```

### 2. API Ninjas (Nutrition Data)

The app uses API Ninjas for nutrition data:

1. Sign up for an account at [API Ninjas](https://api-ninjas.com/)
2. Get your API key from the dashboard
3. Replace the placeholder in both files:
   - `src/services/FoodDetectionService.ts`
   - `src/components/FoodCamera.tsx`
   ```javascript
   const API_NINJAS_KEY = 'YOUR_API_NINJAS_KEY';
   ```

## How Food Recognition Works

1. The app captures an image using the device camera
2. The image is sent to LogMeal API for food recognition
3. The recognized food items are then sent to API Ninjas to get nutritional information
4. If either API fails, the app falls back to a local database of common foods

## Development

### Project Structure

- `/src/components` - Reusable UI components
- `/src/screens` - App screens
- `/src/services` - API and business logic
- `/src/database` - SQLite database operations
- `/src/navigation` - Navigation configuration

### Adding New Features

To add new features:

1. Create necessary components in `/src/components`
2. Add screens in `/src/screens`
3. Update navigation in `/src/navigation`
4. Add any required services in `/src/services`

## License

MIT 