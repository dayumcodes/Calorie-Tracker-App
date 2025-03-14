import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  TextInput, 
  Button, 
  Divider, 
  SegmentedButtons, 
  List, 
  useTheme,
  HelperText
} from 'react-native-paper';
import { addFoodItem, logFood } from '../database/database';

// Temporary user ID until we implement authentication
const TEMP_USER_ID = 1;

// Define food item type
interface FoodItem {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  region: string;
  category: string;
  serving_size: string;
  image_url?: string;
}

// Define route and navigation props
interface RouteProps {
  params?: {
    foodItem?: FoodItem;
  };
}

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
}

const AddFoodScreen = ({ route, navigation }: { route: RouteProps, navigation: NavigationProps }) => {
  const theme = useTheme();
  const [mode, setMode] = useState('log'); // 'log' or 'create'
  const [quantity, setQuantity] = useState('1');
  const [mealType, setMealType] = useState('Breakfast');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Fields for creating new food item
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [region, setRegion] = useState('Common');
  const [category, setCategory] = useState('Main Course');
  const [servingSize, setServingSize] = useState('100g');

  // Get food item from route params if available
  const foodItem: FoodItem | undefined = route.params?.foodItem;

  // Set food item details if available
  useEffect(() => {
    if (foodItem) {
      setMode('log');
    }
  }, [foodItem]);

  // Handle logging food
  const handleLogFood = async () => {
    if (!foodItem) {
      Alert.alert('Error', 'No food item selected');
      return;
    }

    try {
      const quantityNum = parseFloat(quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        Alert.alert('Error', 'Please enter a valid quantity');
        return;
      }

      await logFood(TEMP_USER_ID, foodItem.id, date, mealType, quantityNum);
      Alert.alert('Success', 'Food logged successfully');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error logging food:', error);
      Alert.alert('Error', 'Failed to log food');
    }
  };

  // Handle creating new food item
  const handleCreateFood = async () => {
    try {
      // Validate inputs
      if (!name.trim()) {
        Alert.alert('Error', 'Please enter a food name');
        return;
      }

      const caloriesNum = parseInt(calories);
      const proteinNum = parseFloat(protein || '0');
      const carbsNum = parseFloat(carbs || '0');
      const fatNum = parseFloat(fat || '0');
      const fiberNum = parseFloat(fiber || '0');

      if (isNaN(caloriesNum) || caloriesNum <= 0) {
        Alert.alert('Error', 'Please enter valid calories');
        return;
      }

      // Add food item to database
      const newFoodId = await addFoodItem(
        name,
        caloriesNum,
        proteinNum,
        carbsNum,
        fatNum,
        fiberNum,
        region,
        category,
        servingSize
      );

      Alert.alert('Success', 'Food item created successfully');
      
      // Clear form
      setName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setFiber('');
      setServingSize('100g');
      
      // Navigate to food database
      navigation.navigate('Food Database');
    } catch (error) {
      console.error('Error creating food:', error);
      Alert.alert('Error', 'Failed to create food item');
    }
  };

  // Meal type options
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  // Region options
  const regions = ['North Indian', 'South Indian', 'East Indian', 'West Indian', 'Common'];

  // Category options
  const categories = ['Breakfast', 'Main Course', 'Side Dish', 'Snack', 'Dessert', 'Beverage', 'Bread', 'Staple', 'Appetizer', 'Condiment', 'Soup'];

  return (
    <ScrollView style={styles.container}>
      {/* Mode Selection */}
      <SegmentedButtons
        value={mode}
        onValueChange={setMode}
        buttons={[
          { value: 'log', label: 'Log Food' },
          { value: 'create', label: 'Create New Food' }
        ]}
        style={styles.segmentedButtons}
      />

      {mode === 'log' ? (
        // Log Food Mode
        <Card style={styles.card}>
          <Card.Title title="Log Food Intake" />
          <Card.Content>
            {foodItem ? (
              <View>
                <Text style={styles.foodName}>{foodItem.name}</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.calories}>{foodItem.calories} kcal</Text>
                  <Text>({foodItem.serving_size})</Text>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.macrosContainer}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{foodItem.protein.toFixed(1)}g</Text>
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{foodItem.carbs.toFixed(1)}g</Text>
                    <Text style={styles.macroLabel}>Carbs</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{foodItem.fat.toFixed(1)}g</Text>
                    <Text style={styles.macroLabel}>Fat</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{foodItem.fiber.toFixed(1)}g</Text>
                    <Text style={styles.macroLabel}>Fiber</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.noFoodContainer}>
                <Text style={styles.noFoodText}>No food item selected</Text>
                <Button 
                  mode="contained" 
                  onPress={() => navigation.navigate('Food Database')}
                  style={styles.browseButton}
                >
                  Browse Food Database
                </Button>
              </View>
            )}

            <Divider style={styles.divider} />

            {/* Quantity Input */}
            <TextInput
              label="Quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              style={styles.input}
              disabled={!foodItem}
            />

            {/* Meal Type Selection */}
            <Text style={styles.sectionTitle}>Meal Type:</Text>
            <SegmentedButtons
              value={mealType}
              onValueChange={setMealType}
              buttons={mealTypes.map(type => ({ value: type, label: type }))}
              style={styles.mealTypeButtons}
              disabled={!foodItem}
            />

            {/* Total Calories */}
            {foodItem && (
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Calories:</Text>
                <Text style={styles.totalValue}>
                  {(foodItem.calories * parseFloat(quantity || '0')).toFixed(0)} kcal
                </Text>
              </View>
            )}

            {/* Log Button */}
            <Button
              mode="contained"
              onPress={handleLogFood}
              style={styles.submitButton}
              disabled={!foodItem}
            >
              Log Food
            </Button>
          </Card.Content>
        </Card>
      ) : (
        // Create Food Mode
        <Card style={styles.card}>
          <Card.Title title="Create New Food Item" />
          <Card.Content>
            {/* Basic Info */}
            <TextInput
              label="Food Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <HelperText type="info">
              Include serving size in the name (e.g., "Paneer Tikka (4 pieces)")
            </HelperText>

            <TextInput
              label="Calories (kcal)"
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Serving Size"
              value={servingSize}
              onChangeText={setServingSize}
              style={styles.input}
              placeholder="e.g., 100g, 1 piece, 1 cup"
            />

            {/* Macronutrients */}
            <Text style={styles.sectionTitle}>Macronutrients (g):</Text>
            <View style={styles.macroInputRow}>
              <TextInput
                label="Protein"
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
                style={[styles.input, styles.macroInput]}
              />
              <TextInput
                label="Carbs"
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
                style={[styles.input, styles.macroInput]}
              />
            </View>
            <View style={styles.macroInputRow}>
              <TextInput
                label="Fat"
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
                style={[styles.input, styles.macroInput]}
              />
              <TextInput
                label="Fiber"
                value={fiber}
                onChangeText={setFiber}
                keyboardType="numeric"
                style={[styles.input, styles.macroInput]}
              />
            </View>

            {/* Region Selection */}
            <Text style={styles.sectionTitle}>Region:</Text>
            <SegmentedButtons
              value={region}
              onValueChange={setRegion}
              buttons={regions.map(r => ({ value: r, label: r }))}
              style={styles.segmentedButtons}
            />

            {/* Category Selection */}
            <Text style={styles.sectionTitle}>Category:</Text>
            <List.Accordion
              title={category}
              style={styles.categoryAccordion}
            >
              {categories.map(cat => (
                <List.Item
                  key={cat}
                  title={cat}
                  onPress={() => {
                    setCategory(cat);
                  }}
                />
              ))}
            </List.Accordion>

            {/* Create Button */}
            <Button
              mode="contained"
              onPress={handleCreateFood}
              style={styles.submitButton}
            >
              Create Food Item
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 10,
    elevation: 4,
  },
  segmentedButtons: {
    margin: 10,
  },
  foodName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  calories: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 15,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontWeight: 'bold',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
  },
  input: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  mealTypeButtons: {
    marginBottom: 15,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9933', // Saffron color
  },
  submitButton: {
    marginTop: 20,
  },
  noFoodContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noFoodText: {
    fontSize: 16,
    marginBottom: 15,
    color: '#666',
  },
  browseButton: {
    marginTop: 10,
  },
  macroInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  categoryAccordion: {
    backgroundColor: '#f0f0f0',
    marginBottom: 15,
  },
});

export default AddFoodScreen; 