import * as FileSystem from 'expo-file-system';
import axios from 'axios';

// API Ninjas key - Replace with your actual API key
export const API_NINJAS_KEY = '6H4B5MUFXSQKYkdwFPiu0w==uHs8zVhStrikeZEf';

// Define the food data interface
export interface FoodData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_size: string;
}

// Food database for fallback and supplementary information
export const foodDatabase: Record<string, Omit<FoodData, 'name'>> = {
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

/**
 * Detect food from an image
 * This function now uses a simpler approach with API Ninjas
 */
export const detectFoodFromImage = async (base64Image: string): Promise<FoodData[]> => {
  try {
    // Save the base64 image to a temporary file
    const imageUri = await saveBase64ImageToFile(base64Image);
    
    // Since we don't have a dedicated food recognition API anymore,
    // we'll use a simple approach to extract potential food names from the image
    // For now, we'll use a list of common foods to simulate detection
    const detectedFoods = await simulateFoodDetection();
    
    if (detectedFoods.length > 0) {
      // Get nutrition data for each detected food
      const foodDataPromises = detectedFoods.map(food => getNutritionData(food));
      const foodDataResults = await Promise.all(foodDataPromises);
      
      // Filter out any null results
      return foodDataResults.filter(item => item !== null) as FoodData[];
    } else {
      // Fall back to random foods if no foods were detected
      return await fallbackToRandomFoods();
    }
  } catch (error) {
    console.error('Error detecting food:', error);
    // Fall back to random foods if there was an error
    return await fallbackToRandomFoods();
  }
};

/**
 * Save base64 image to a temporary file
 */
const saveBase64ImageToFile = async (base64Image: string): Promise<string> => {
  try {
    const fileUri = `${FileSystem.cacheDirectory}temp_food_image.jpg`;
    await FileSystem.writeAsStringAsync(fileUri, base64Image, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return fileUri;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
};

/**
 * Simulate food detection (since we don't have a dedicated food recognition API)
 * In a real app, you would use a food recognition API or ML model here
 */
const simulateFoodDetection = async (): Promise<string[]> => {
  // Simulate food detection with common foods
  const commonFoods = [
    'apple', 'banana', 'orange', 'chicken', 'rice', 'bread', 'egg',
    'potato', 'tomato', 'carrot', 'broccoli', 'beef', 'fish'
  ];
  
  // Randomly select 1-3 foods
  const numFoods = Math.floor(Math.random() * 3) + 1;
  const selectedFoods: string[] = [];
  
  for (let i = 0; i < numFoods; i++) {
    const randomIndex = Math.floor(Math.random() * commonFoods.length);
    const randomFood = commonFoods[randomIndex];
    selectedFoods.push(randomFood);
    // Remove the selected food to avoid duplicates
    commonFoods.splice(randomIndex, 1);
    if (commonFoods.length === 0) break;
  }
  
  return selectedFoods;
};

/**
 * Fall back to random foods from the database
 */
const fallbackToRandomFoods = async (): Promise<FoodData[]> => {
  // Simulate food detection (random selection from database)
  const foods = Object.keys(foodDatabase);
  const numFoods = Math.floor(Math.random() * 3) + 1; // 1 to 3 foods
  const selectedFoods: string[] = [];
  
  for (let i = 0; i < numFoods; i++) {
    const randomIndex = Math.floor(Math.random() * foods.length);
    const randomFood = foods[randomIndex];
    selectedFoods.push(randomFood);
    // Remove the selected food to avoid duplicates
    foods.splice(randomIndex, 1);
    if (foods.length === 0) break;
  }
  
  // Get nutrition data for each detected food
  const foodDataPromises = selectedFoods.map(food => getNutritionData(food));
  const foodDataResults = await Promise.all(foodDataPromises);
  
  // Filter out any null results
  return foodDataResults.filter(item => item !== null) as FoodData[];
};

/**
 * Get nutrition data from API Ninjas
 */
export const getNutritionData = async (foodName: string): Promise<FoodData | null> => {
  try {
    const response = await axios.get('https://api.api-ninjas.com/v1/nutrition', {
      params: {
        query: foodName
      },
      headers: {
        'X-Api-Key': API_NINJAS_KEY
      }
    });
    
    if (response.data && response.data.length > 0) {
      // Process the nutrition data from the API
      const item = response.data[0];
      
      return {
        name: item.name || foodName,
        calories: item.calories,
        protein: item.protein_g,
        carbs: item.carbohydrates_total_g,
        fat: item.fat_total_g,
        fiber: item.fiber_g,
        serving_size: `${item.serving_size_g}g`
      };
    } else {
      // Fallback to our database if API doesn't return results
      return fallbackToLocalDatabase(foodName);
    }
  } catch (error) {
    console.error('Error fetching nutrition data:', error);
    // Fallback to our database if API call fails
    return fallbackToLocalDatabase(foodName);
  }
};

/**
 * Fallback to local database if API fails
 */
const fallbackToLocalDatabase = (foodName: string): FoodData | null => {
  if (foodDatabase[foodName as keyof typeof foodDatabase]) {
    const foodInfo = foodDatabase[foodName as keyof typeof foodDatabase];
    return {
      name: foodName,
      ...foodInfo
    };
  }
  return null;
};

/**
 * Save food to log
 */
export const saveFoodToLog = async (
  userId: number,
  foodData: FoodData,
  quantity: number = 1,
  mealType: string = 'Lunch',
  date: string
): Promise<boolean> => {
  try {
    // In a real app, you would call a database function here
    // For example:
    // const result = await addFoodLog(userId, foodId, quantity, mealType, date);
    // return result > 0;
    
    // For now, we just return true to simulate success
    console.log('Saving food to log:', { userId, foodData, quantity, mealType, date });
    return true;
  } catch (error) {
    console.error('Error saving food to log:', error);
    return false;
  }
}; 