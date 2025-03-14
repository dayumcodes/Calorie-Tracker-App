import * as SQLite from 'expo-sqlite';

// Define SQLite types for the new API
interface SQLiteDatabase {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (sql: string, ...params: any[]) => Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync: (sql: string, ...params: any[]) => Promise<any[]>;
  getFirstAsync: (sql: string, ...params: any[]) => Promise<any>;
  closeAsync: () => Promise<void>;
}

// Initialize database
let db: SQLiteDatabase;

export const initDatabase = async () => {
  try {
    // Open database with the new API
    db = await SQLite.openDatabaseAsync('indiancalorietracker.db');
    
    // Create tables
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT,
        age INTEGER,
        gender TEXT,
        height INTEGER,
        weight INTEGER,
        activity_level TEXT,
        goal TEXT,
        daily_calorie_target INTEGER,
        profile_image TEXT
      );
      
      CREATE TABLE IF NOT EXISTS food_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        calories INTEGER NOT NULL,
        protein REAL,
        carbs REAL,
        fat REAL,
        fiber REAL,
        serving_size TEXT,
        region TEXT,
        category TEXT
      );
      
      CREATE TABLE IF NOT EXISTS food_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        food_id INTEGER,
        quantity REAL,
        meal_type TEXT,
        date TEXT,
        timestamp TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (food_id) REFERENCES food_items (id)
      );
      
      CREATE TABLE IF NOT EXISTS water_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount_ml INTEGER,
        timestamp TEXT,
        date TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
      
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        instructions TEXT,
        total_calories INTEGER,
        servings INTEGER,
        image TEXT
      );
      
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER,
        food_id INTEGER,
        quantity REAL,
        FOREIGN KEY (recipe_id) REFERENCES recipes (id),
        FOREIGN KEY (food_id) REFERENCES food_items (id)
      );
    `);
    
    // Check if food_items table has data
    const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM food_items');
    
    if (result.count === 0) {
      await populateInitialFoodData();
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Populate initial food data
const populateInitialFoodData = async () => {
  try {
    console.log('Populating initial food data...');
    
    // Sample Indian food items
    const foodItems = [
      { name: 'Rice (Cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, serving_size: '100g', region: 'All India', category: 'Staples' },
      { name: 'Chapati', calories: 120, protein: 3, carbs: 20, fat: 3.5, fiber: 1.2, serving_size: '1 piece', region: 'North India', category: 'Staples' },
      { name: 'Dal (Toor)', calories: 116, protein: 7, carbs: 20, fat: 0.4, fiber: 2, serving_size: '100g', region: 'All India', category: 'Lentils' },
      { name: 'Paneer', calories: 265, protein: 18, carbs: 3.6, fat: 21, fiber: 0, serving_size: '100g', region: 'North India', category: 'Dairy' },
      { name: 'Chicken Curry', calories: 243, protein: 15, carbs: 6, fat: 18, fiber: 1.5, serving_size: '100g', region: 'All India', category: 'Non-Veg' },
      { name: 'Palak Paneer', calories: 180, protein: 8, carbs: 10, fat: 13, fiber: 3, serving_size: '100g', region: 'North India', category: 'Vegetarian' },
      { name: 'Samosa', calories: 262, protein: 3.5, carbs: 24, fat: 17, fiber: 1.5, serving_size: '1 piece', region: 'North India', category: 'Snacks' },
      { name: 'Dosa', calories: 168, protein: 3.4, carbs: 29, fat: 4.5, fiber: 1.2, serving_size: '1 piece', region: 'South India', category: 'Breakfast' },
      { name: 'Idli', calories: 78, protein: 2.1, carbs: 16.5, fat: 0.1, fiber: 0.9, serving_size: '1 piece', region: 'South India', category: 'Breakfast' },
      { name: 'Butter Chicken', calories: 290, protein: 18, carbs: 8, fat: 22, fiber: 1, serving_size: '100g', region: 'North India', category: 'Non-Veg' }
    ];
    
    // Insert food items
    for (const item of foodItems) {
      await db.runAsync(
        'INSERT INTO food_items (name, calories, protein, carbs, fat, fiber, serving_size, region, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        item.name, item.calories, item.protein, item.carbs, item.fat, item.fiber, item.serving_size, item.region, item.category
      );
    }
    
    console.log('Initial food data populated successfully');
  } catch (error) {
    console.error('Error populating initial food data:', error);
  }
};

// Get all food items
export const getAllFoodItems = async () => {
  try {
    return await db.getAllAsync('SELECT * FROM food_items ORDER BY name');
  } catch (error) {
    console.error('Error getting food items:', error);
    return [];
  }
};

// Add food log
export const addFoodLog = async (userId: number, foodId: number, quantity: number, mealType: string, date: string) => {
  try {
    const timestamp = new Date().toISOString();
    const result = await db.runAsync(
      'INSERT INTO food_logs (user_id, food_id, quantity, meal_type, date, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      userId, foodId, quantity, mealType, date, timestamp
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding food log:', error);
    return -1;
  }
};

// Get food logs by date
export const getFoodLogsByDate = async (userId: number, date: string) => {
  try {
    return await db.getAllAsync(
      `SELECT fl.id, fl.quantity, fl.meal_type, fl.timestamp, 
              fi.id as food_id, fi.name, fi.calories, fi.protein, fi.carbs, fi.fat, fi.fiber, fi.serving_size
       FROM food_logs fl
       JOIN food_items fi ON fl.food_id = fi.id
       WHERE fl.user_id = ? AND fl.date = ?
       ORDER BY fl.timestamp DESC`,
      userId, date
    );
  } catch (error) {
    console.error('Error getting food logs:', error);
    return [];
  }
};

// Delete food log
export const deleteFoodLog = async (logId: number) => {
  try {
    await db.runAsync('DELETE FROM food_logs WHERE id = ?', logId);
    return true;
  } catch (error) {
    console.error('Error deleting food log:', error);
    return false;
  }
};

// Get food item by ID
export const getFoodItemById = async (foodId: number) => {
  try {
    return await db.getFirstAsync('SELECT * FROM food_items WHERE id = ?', foodId);
  } catch (error) {
    console.error('Error getting food item:', error);
    return null;
  }
};

// Search food items
export const searchFoodItems = async (query: string) => {
  try {
    return await db.getAllAsync('SELECT * FROM food_items WHERE name LIKE ? ORDER BY name LIMIT 20', `%${query}%`);
  } catch (error) {
    console.error('Error searching food items:', error);
    return [];
  }
};

// Get user profile
export const getUserProfile = async (userId: number) => {
  try {
    return await db.getFirstAsync('SELECT * FROM users WHERE id = ?', userId);
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (profile: any) => {
  try {
    await db.runAsync(
      'UPDATE users SET name = ?, age = ?, gender = ?, height = ?, weight = ?, activity_level = ?, goal = ?, daily_calorie_target = ?, profile_image = ? WHERE id = ?',
      profile.name, profile.age, profile.gender, profile.height, profile.weight, profile.activity_level, profile.goal, profile.daily_calorie_target, profile.profile_image, profile.id
    );
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

// Create default user profile
export const createDefaultUserProfile = async () => {
  try {
    const result = await db.runAsync(
      'INSERT INTO users (id, name, age, gender, height, weight, activity_level, goal, daily_calorie_target) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      1, 'User', 30, 'Male', 170, 70, 'Moderate', 'Maintain', 2000
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error creating default user profile:', error);
    return -1;
  }
};

// Add water log
export const addWaterLog = async (userId: number, amountMl: number, date: string) => {
  try {
    const timestamp = new Date().toISOString();
    const result = await db.runAsync(
      'INSERT INTO water_logs (user_id, amount_ml, timestamp, date) VALUES (?, ?, ?, ?)',
      userId, amountMl, timestamp, date
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding water log:', error);
    return -1;
  }
};

// Get water logs by date
export const getWaterLogsByDate = async (userId: number, date: string) => {
  try {
    return await db.getAllAsync(
      'SELECT * FROM water_logs WHERE user_id = ? AND date = ? ORDER BY timestamp DESC',
      userId, date
    );
  } catch (error) {
    console.error('Error getting water logs:', error);
    return [];
  }
};

// Delete water log
export const deleteWaterLog = async (logId: number) => {
  try {
    await db.runAsync('DELETE FROM water_logs WHERE id = ?', logId);
    return true;
  } catch (error) {
    console.error('Error deleting water log:', error);
    return false;
  }
};

// Get weekly water data
export const getWeeklyWaterData = async (userId: number, dates: string[]) => {
  try {
    const data: number[] = Array(dates.length).fill(0);
    
    for (let i = 0; i < dates.length; i++) {
      const result = await db.getFirstAsync(
        'SELECT SUM(amount_ml) as total FROM water_logs WHERE user_id = ? AND date = ?',
        userId, dates[i]
      );
      
      if (result && result.total) {
        data[i] = result.total;
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error getting weekly water data:', error);
    return Array(dates.length).fill(0);
  }
};

// Add recipe
export const addRecipe = async (name: string, description: string, instructions: string, totalCalories: number, servings: number) => {
  try {
    const result = await db.runAsync(
      'INSERT INTO recipes (name, description, instructions, total_calories, servings) VALUES (?, ?, ?, ?, ?)',
      name, description, instructions, totalCalories, servings
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding recipe:', error);
    return -1;
  }
};

// Add recipe ingredient
export const addRecipeIngredient = async (recipeId: number, foodId: number, quantity: number) => {
  try {
    const result = await db.runAsync(
      'INSERT INTO recipe_ingredients (recipe_id, food_id, quantity) VALUES (?, ?, ?)',
      recipeId, foodId, quantity
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding recipe ingredient:', error);
    return -1;
  }
};

// Get all recipes
export const getAllRecipes = async () => {
  try {
    return await db.getAllAsync('SELECT * FROM recipes ORDER BY name');
  } catch (error) {
    console.error('Error getting recipes:', error);
    return [];
  }
};

// Get recipe by ID
export const getRecipeById = async (recipeId: number) => {
  try {
    return await db.getFirstAsync('SELECT * FROM recipes WHERE id = ?', recipeId);
  } catch (error) {
    console.error('Error getting recipe:', error);
    return null;
  }
};

// Get recipe ingredients
export const getRecipeIngredients = async (recipeId: number) => {
  try {
    return await db.getAllAsync(
      `SELECT ri.id, ri.quantity, 
              fi.id as food_id, fi.name, fi.calories, fi.protein, fi.carbs, fi.fat, fi.fiber, fi.serving_size
       FROM recipe_ingredients ri
       JOIN food_items fi ON ri.food_id = fi.id
       WHERE ri.recipe_id = ?`,
      recipeId
    );
  } catch (error) {
    console.error('Error getting recipe ingredients:', error);
    return [];
  }
};

// Delete recipe
export const deleteRecipe = async (recipeId: number) => {
  try {
    // Delete recipe ingredients first
    await db.runAsync('DELETE FROM recipe_ingredients WHERE recipe_id = ?', recipeId);
    // Then delete the recipe
    await db.runAsync('DELETE FROM recipes WHERE id = ?', recipeId);
    return true;
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return false;
  }
}; 