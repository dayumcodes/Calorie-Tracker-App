import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  TextInput, 
  Button, 
  List,
  Divider,
  IconButton,
  Searchbar,
  useTheme
} from 'react-native-paper';
import * as SQLite from 'expo-sqlite';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Open database connection
const db = SQLite.openDatabaseSync('indiancalorietracker.db');

// Define recipe type
interface Recipe {
  id: number;
  name: string;
  description: string;
  instructions: string;
  total_calories: number;
  servings: number;
  image_url?: string;
}

// Define food item type
interface FoodItem {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_size: string;
  region?: string;
  category?: string;
}

// Define ingredient type
interface Ingredient {
  id: number;
  recipe_id: number;
  food_id: number;
  name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// Define SQLite types
interface SQLiteTransaction {
  executeSql: (
    sqlStatement: string,
    args?: any[],
    success?: (tx: SQLiteTransaction, resultSet: SQLiteResultSet) => void,
    error?: (tx: SQLiteTransaction, error: Error) => boolean
  ) => void;
}

interface SQLiteResultSet {
  rows: {
    length: number;
    item: (idx: number) => any;
    _array: any[];
  };
}

// Define props type for List.Icon
interface ListIconProps {
  color: string;
  style: any;
  [key: string]: any;
}

// Define navigation param list
type RootStackParamList = {
  RecipesList: undefined;
  RecipeDetail: { recipeId: number };
  CreateRecipe: undefined;
  EditRecipe: { recipeId: number };
};

// Define screen props
type EditRecipeScreenProps = NativeStackScreenProps<RootStackParamList, 'EditRecipe'>;

const EditRecipeScreen = ({ route, navigation }: EditRecipeScreenProps) => {
  const theme = useTheme();
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [servings, setServings] = useState('1');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('1');

  // Load recipe details on component mount
  useEffect(() => {
    loadRecipeDetails();
    loadRecipeIngredients();
  }, []);

  // Load recipe details from database
  const loadRecipeDetails = () => {
    db.transaction((tx: SQLiteTransaction) => {
      tx.executeSql(
        'SELECT * FROM recipes WHERE id = ?;',
        [recipeId],
        (_, { rows }) => {
          if (rows.length > 0) {
            const recipeData = rows.item(0);
            setRecipe(recipeData);
            setName(recipeData.name);
            setDescription(recipeData.description || '');
            setInstructions(recipeData.instructions || '');
            setServings(recipeData.servings.toString());
          } else {
            Alert.alert('Error', 'Recipe not found');
            navigation.goBack();
          }
        },
        (_, error) => {
          console.error('Error loading recipe details:', error);
          return false;
        }
      );
    });
  };

  // Load recipe ingredients from database
  const loadRecipeIngredients = () => {
    db.transaction((tx: SQLiteTransaction) => {
      tx.executeSql(
        `SELECT ri.id, ri.recipe_id, ri.food_id, f.name, ri.quantity, 
        f.calories, f.protein, f.carbs, f.fat, f.fiber
        FROM recipe_ingredients ri
        JOIN food_items f ON ri.food_id = f.id
        WHERE ri.recipe_id = ?;`,
        [recipeId],
        (_, { rows }) => {
          setIngredients(rows._array);
        },
        (_, error) => {
          console.error('Error loading recipe ingredients:', error);
          return false;
        }
      );
    });
  };

  // Search food items
  const searchFoodItems = (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    db.transaction((tx: SQLiteTransaction) => {
      tx.executeSql(
        'SELECT * FROM food_items WHERE name LIKE ? ORDER BY name LIMIT 20;',
        [`%${query}%`],
        (_, { rows }) => {
          setSearchResults(rows._array);
        },
        (_, error) => {
          console.error('Error searching food items:', error);
          return false;
        }
      );
    });
  };

  // Select food item
  const selectFoodItem = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantity('1');
    setShowSearch(false);
  };

  // Add ingredient to recipe
  const addIngredient = () => {
    if (!selectedFood) {
      Alert.alert('Error', 'Please select a food item');
      return;
    }
    
    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    
    const newIngredient: Ingredient = {
      id: Date.now(), // Temporary ID for UI purposes
      recipe_id: recipeId,
      food_id: selectedFood.id,
      name: selectedFood.name,
      quantity: quantityNum,
      calories: selectedFood.calories,
      protein: selectedFood.protein,
      carbs: selectedFood.carbs,
      fat: selectedFood.fat,
      fiber: selectedFood.fiber,
    };
    
    setIngredients([...ingredients, newIngredient]);
    setSelectedFood(null);
    setQuantity('1');
  };

  // Remove ingredient from recipe
  const removeIngredient = (id: number) => {
    setIngredients(ingredients.filter(item => item.id !== id));
  };

  // Calculate total calories
  const calculateTotalCalories = (): number => {
    return ingredients.reduce((sum: number, item: Ingredient) => sum + (item.calories * item.quantity), 0);
  };

  // Update recipe
  const updateRecipe = () => {
    // Validate inputs
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a recipe name');
      return;
    }
    
    if (ingredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }
    
    const servingsNum = parseInt(servings);
    if (isNaN(servingsNum) || servingsNum <= 0) {
      Alert.alert('Error', 'Please enter a valid number of servings');
      return;
    }
    
    const totalCalories = calculateTotalCalories();
    
    // Update recipe in database
    db.transaction((tx: SQLiteTransaction) => {
      tx.executeSql(
        'UPDATE recipes SET name = ?, description = ?, instructions = ?, total_calories = ?, servings = ? WHERE id = ?;',
        [name, description, instructions, totalCalories, servingsNum, recipeId],
        (_, result) => {
          // Delete existing ingredients
          tx.executeSql(
            'DELETE FROM recipe_ingredients WHERE recipe_id = ?;',
            [recipeId],
            (_, result) => {
              // Add new ingredients
              ingredients.forEach((ingredient: Ingredient) => {
                tx.executeSql(
                  'INSERT INTO recipe_ingredients (recipe_id, food_id, quantity) VALUES (?, ?, ?);',
                  [recipeId, ingredient.food_id, ingredient.quantity],
                  (_, result) => {},
                  (_, error) => {
                    console.error('Error saving recipe ingredient:', error);
                    return false;
                  }
                );
              });
              
              Alert.alert('Success', 'Recipe updated successfully');
              navigation.goBack();
            },
            (_, error) => {
              console.error('Error deleting recipe ingredients:', error);
              return false;
            }
          );
        },
        (_, error) => {
          console.error('Error updating recipe:', error);
          return false;
        }
      );
    });
  };

  if (!recipe) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading recipe details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Recipe Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Recipe Details</Title>
            <TextInput
              label="Recipe Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
              style={styles.input}
            />
            <TextInput
              label="Instructions"
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={4}
              style={styles.input}
            />
            <TextInput
              label="Number of Servings"
              value={servings}
              onChangeText={setServings}
              keyboardType="numeric"
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Ingredients */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Title style={styles.title}>Ingredients</Title>
              <Button 
                mode="contained" 
                onPress={() => setShowSearch(true)}
                style={styles.addButton}
              >
                Add Ingredient
              </Button>
            </View>
            
            {ingredients.length > 0 ? (
              ingredients.map((ingredient: Ingredient) => (
                <View key={ingredient.id}>
                  <List.Item
                    title={ingredient.name}
                    description={`${ingredient.quantity} serving(s) - ${ingredient.calories * ingredient.quantity} kcal`}
                    left={(props: ListIconProps) => <List.Icon {...props} icon="food-apple" />}
                    right={(props: ListIconProps) => (
                      <IconButton
                        {...props}
                        icon="delete"
                        onPress={() => removeIngredient(ingredient.id)}
                      />
                    )}
                  />
                  <Divider />
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No ingredients added yet.</Text>
            )}
            
            {ingredients.length > 0 && (
              <View style={styles.totalCalories}>
                <Text style={styles.totalCaloriesText}>
                  Total Calories: {calculateTotalCalories()} kcal
                </Text>
                <Text style={styles.perServingText}>
                  ({Math.round(calculateTotalCalories() / parseInt(servings || '1'))} kcal per serving)
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Search Panel */}
        {showSearch && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.title}>Add Ingredient</Title>
              <Searchbar
                placeholder="Search food items..."
                onChangeText={searchFoodItems}
                value={searchQuery}
                style={styles.searchBar}
              />
              
              {searchResults.length > 0 && (
                <FlatList
                  data={searchResults}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }: { item: FoodItem }) => (
                    <List.Item
                      title={item.name}
                      description={`${item.calories} kcal per serving`}
                      onPress={() => selectFoodItem(item)}
                      left={(props: ListIconProps) => <List.Icon {...props} icon="food-apple" />}
                    />
                  )}
                  style={styles.searchResults}
                  ItemSeparatorComponent={() => <Divider />}
                />
              )}
              
              {selectedFood && (
                <View style={styles.selectedFood}>
                  <Text style={styles.selectedFoodTitle}>Selected: {selectedFood.name}</Text>
                  <View style={styles.quantityRow}>
                    <TextInput
                      label="Quantity (servings)"
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                      style={styles.quantityInput}
                    />
                    <Button 
                      mode="contained" 
                      onPress={addIngredient}
                      style={styles.addIngredientButton}
                    >
                      Add
                    </Button>
                  </View>
                </View>
              )}
              
              <Button 
                mode="outlined" 
                onPress={() => setShowSearch(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Update Button */}
        <Button 
          mode="contained" 
          onPress={updateRecipe}
          style={styles.updateButton}
        >
          Update Recipe
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  title: {
    marginBottom: 10,
  },
  input: {
    marginBottom: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addButton: {
    marginLeft: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
    color: '#666',
  },
  totalCalories: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  totalCaloriesText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  perServingText: {
    color: '#666',
    fontStyle: 'italic',
  },
  searchBar: {
    marginBottom: 10,
  },
  searchResults: {
    maxHeight: 200,
    marginBottom: 10,
  },
  selectedFood: {
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  selectedFoodTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityInput: {
    flex: 1,
    marginRight: 10,
  },
  addIngredientButton: {
    marginLeft: 10,
  },
  cancelButton: {
    marginTop: 10,
  },
  updateButton: {
    margin: 10,
    marginBottom: 20,
    padding: 5,
  },
});

export default EditRecipeScreen; 