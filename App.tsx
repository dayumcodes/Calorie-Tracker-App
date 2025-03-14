import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as SQLite from 'expo-sqlite';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import FoodDatabaseScreen from './src/screens/FoodDatabaseScreen';
import RecipesScreen from './src/screens/RecipesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FoodDetailScreen from './src/screens/FoodDetailScreen';
import AddFoodScreen from './src/screens/AddFoodScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import CreateRecipeScreen from './src/screens/CreateRecipeScreen';
import WaterTrackerScreen from './src/screens/WaterTrackerScreen';

// Import database functions
import { initDatabase } from './src/database/database';

// Define theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF6F00',
    secondary: '#FFA000',
    background: '#F5F5F5',
  },
};

// Define navigation types
type RootStackParamList = {
  RecipesList: undefined;
  RecipeDetail: { recipeId: number };
  CreateRecipe: undefined;
  EditRecipe: { recipeId: number };
  FoodDatabase: undefined;
  AddFood: { foodItem?: any };
};

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home stack navigator
const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="FoodDetail" component={FoodDetailScreen} options={{ title: 'Food Details' }} />
      <Stack.Screen name="WaterTracker" component={WaterTrackerScreen} options={{ title: 'Water Tracker' }} />
    </Stack.Navigator>
  );
};

// Food database stack navigator
const FoodStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="FoodDatabase" component={FoodDatabaseScreen} options={{ title: 'Food Database' }} />
      <Stack.Screen name="FoodDetail" component={FoodDetailScreen} options={{ title: 'Food Details' }} />
      <Stack.Screen name="AddFood" component={AddFoodScreen} options={{ title: 'Add Food' }} />
    </Stack.Navigator>
  );
};

// Recipes stack navigator
const RecipesStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Recipes" component={RecipesScreen} options={{ title: 'Recipes' }} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'Recipe Details' }} />
      <Stack.Screen name="CreateRecipe" component={CreateRecipeScreen} options={{ title: 'Create Recipe' }} />
    </Stack.Navigator>
  );
};

// Set up notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize database asynchronously
    const setupDatabase = async () => {
      try {
        await initDatabase();
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };
    
    setupDatabase();
  }, []);

  // Show loading state while database is initializing
  if (!isReady) {
    return null; // Or a loading component
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              let iconName;

              if (route.name === 'HomeTab') {
                iconName = 'home';
              } else if (route.name === 'FoodTab') {
                iconName = 'food-apple';
              } else if (route.name === 'RecipesTab') {
                iconName = 'book-open';
              } else if (route.name === 'ProfileTab') {
                iconName = 'account';
              }

              return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen 
            name="HomeTab" 
            component={HomeStack} 
            options={{ 
              headerShown: false,
              title: 'Home'
            }} 
          />
          <Tab.Screen 
            name="FoodTab" 
            component={FoodStack} 
            options={{ 
              headerShown: false,
              title: 'Food'
            }} 
          />
          <Tab.Screen 
            name="RecipesTab" 
            component={RecipesStack} 
            options={{ 
              headerShown: false,
              title: 'Recipes'
            }} 
          />
          <Tab.Screen 
            name="ProfileTab" 
            component={ProfileScreen} 
            options={{ 
              title: 'Profile'
            }} 
          />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </PaperProvider>
  );
} 