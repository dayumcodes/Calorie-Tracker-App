import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  List,
  Divider,
  useTheme
} from 'react-native-paper';
import * as SQLite from 'expo-sqlite';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
  RecipeDetail: { recipeId: number };
  EditRecipe: { recipeId: number };
  Recipes: undefined;
};

// Define screen props
type RecipeDetailScreenProps = {
  route: RouteProp<RootStackParamList, 'RecipeDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

// Define route param types
type RouteParams = {
  RecipeDetail: { recipeId: number };
  EditRecipe: { recipeId: number };
};

const RecipeDetailScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProp<RootStackParamList, 'RecipeDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const { recipeId } = route.params;

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
            setRecipe(rows.item(0));
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

  // Calculate nutrition per serving
  const calculatePerServing = (total: number): number => {
    if (!recipe || recipe.servings <= 0) return 0;
    return Math.round(total / recipe.servings);
  };

  // Calculate total nutrition values
  const calculateTotalNutrition = () => {
    const totals = {
      protein: ingredients.reduce((sum: number, item: Ingredient) => sum + (item.protein * item.quantity), 0),
      carbs: ingredients.reduce((sum: number, item: Ingredient) => sum + (item.carbs * item.quantity), 0),
      fat: ingredients.reduce((sum: number, item: Ingredient) => sum + (item.fat * item.quantity), 0),
      fiber: ingredients.reduce((sum: number, item: Ingredient) => sum + (item.fiber * item.quantity), 0),
    };
    
    return totals;
  };

  // Log recipe as a meal
  const logRecipeAsMeal = () => {
    if (!recipe) return;
    
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];
    
    db.transaction((tx: SQLiteTransaction) => {
      tx.executeSql(
        `INSERT INTO food_logs 
        (user_id, food_id, name, calories, protein, carbs, fat, fiber, quantity, meal_type, serving_size, timestamp, date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          1, // user_id
          -1, // food_id (negative to indicate it's a recipe)
          recipe.name,
          calculatePerServing(recipe.total_calories),
          calculatePerServing(calculateTotalNutrition().protein),
          calculatePerServing(calculateTotalNutrition().carbs),
          calculatePerServing(calculateTotalNutrition().fat),
          calculatePerServing(calculateTotalNutrition().fiber),
          1, // quantity
          'Meal', // meal_type
          '1 serving', // serving_size
          timestamp,
          date
        ],
        (_, result) => {
          Alert.alert('Success', 'Recipe logged as a meal');
        },
        (_, error) => {
          console.error('Error logging recipe as meal:', error);
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

  const totalNutrition = calculateTotalNutrition();

  return (
    <ScrollView style={styles.container}>
      {/* Recipe Header */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>{recipe.name}</Title>
          <Paragraph style={styles.description}>{recipe.description}</Paragraph>
          
          <View style={styles.nutritionContainer}>
            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Calories</Text>
                <Text style={styles.nutritionValue}>{recipe.total_calories} kcal</Text>
                <Text style={styles.perServing}>({calculatePerServing(recipe.total_calories)} per serving)</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Servings</Text>
                <Text style={styles.nutritionValue}>{recipe.servings}</Text>
              </View>
            </View>
            
            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Protein</Text>
                <Text style={styles.nutritionValue}>{totalNutrition.protein.toFixed(1)}g</Text>
                <Text style={styles.perServing}>({calculatePerServing(totalNutrition.protein)}g per serving)</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Carbs</Text>
                <Text style={styles.nutritionValue}>{totalNutrition.carbs.toFixed(1)}g</Text>
                <Text style={styles.perServing}>({calculatePerServing(totalNutrition.carbs)}g per serving)</Text>
              </View>
            </View>
            
            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Fat</Text>
                <Text style={styles.nutritionValue}>{totalNutrition.fat.toFixed(1)}g</Text>
                <Text style={styles.perServing}>({calculatePerServing(totalNutrition.fat)}g per serving)</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Fiber</Text>
                <Text style={styles.nutritionValue}>{totalNutrition.fiber.toFixed(1)}g</Text>
                <Text style={styles.perServing}>({calculatePerServing(totalNutrition.fiber)}g per serving)</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              onPress={logRecipeAsMeal}
              style={styles.button}
            >
              Log as Meal
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('EditRecipe', { recipeId: recipe.id })}
              style={styles.button}
            >
              Edit Recipe
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Ingredients */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Ingredients</Title>
          {ingredients.length > 0 ? (
            ingredients.map((ingredient) => (
              <View key={ingredient.id}>
                <List.Item
                  title={ingredient.name}
                  description={`${ingredient.quantity} serving(s) - ${ingredient.calories * ingredient.quantity} kcal`}
                  left={(props: ListIconProps) => <List.Icon {...props} icon="food-apple" />}
                />
                <Divider />
              </View>
            ))
          ) : (
            <Paragraph style={styles.emptyText}>No ingredients found for this recipe.</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Instructions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Instructions</Title>
          <Paragraph style={styles.instructions}>{recipe.instructions}</Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
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
  card: {
    margin: 10,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    marginBottom: 5,
  },
  description: {
    marginBottom: 15,
    fontStyle: 'italic',
    color: '#666',
  },
  sectionTitle: {
    marginBottom: 10,
  },
  nutritionContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nutritionItem: {
    width: '48%',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  perServing: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    width: '48%',
  },
  instructions: {
    lineHeight: 22,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
});

export default RecipeDetailScreen; 