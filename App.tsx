import React, { useState, useEffect, createContext, useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  Provider as PaperProvider, 
  MD3LightTheme, 
  MD3DarkTheme, 
  adaptNavigationTheme 
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Define custom light theme
const CustomLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#00e6ac',
    secondary: '#00b386',
    background: '#F5F5F5',
  },
};

// Define custom dark theme
const CustomDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#00e6ac',
    secondary: '#00b386',
    background: '#121212',
  },
};

// Adapt navigation themes
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDefaultTheme,
});

// Create combined themes
const CombinedLightTheme = {
  ...CustomLightTheme,
  ...LightTheme,
  colors: {
    ...CustomLightTheme.colors,
    ...LightTheme.colors,
  },
};

const CombinedDarkTheme = {
  ...CustomDarkTheme,
  ...DarkTheme,
  colors: {
    ...CustomDarkTheme.colors,
    ...DarkTheme.colors,
  },
};

// Create theme context
type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
});

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
      <Stack.Screen name="AddFood" component={AddFoodScreen} options={{ title: 'Add Food' }} />
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
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const themePreference = await AsyncStorage.getItem('isDarkMode');
        if (themePreference !== null) {
          setIsDarkMode(themePreference === 'true');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
    
    loadThemePreference();
  }, []);

  // Toggle theme function
  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('isDarkMode', newMode.toString());
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

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

  // Select theme based on mode
  const theme = isDarkMode ? CombinedDarkTheme : CombinedLightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <PaperProvider theme={theme}>
        <NavigationContainer theme={theme}>
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
              tabBarActiveTintColor: '#00e6ac',
              tabBarInactiveTintColor: 'gray',
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
        <StatusBar style={isDarkMode ? "light" : "dark"} />
      </PaperProvider>
    </ThemeContext.Provider>
  );
} 