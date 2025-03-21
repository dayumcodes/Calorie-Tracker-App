import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  FAB, 
  Searchbar, 
  Divider,
  List,
  useTheme
} from 'react-native-paper';
import * as SQLite from 'expo-sqlite';
import { initDatabase } from '../database/database';

// Import SQLiteDatabase type from database.ts
interface SQLiteDatabase {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (sql: string, ...params: any[]) => Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync: (sql: string, ...params: any[]) => Promise<any[]>;
  getFirstAsync: (sql: string, ...params: any[]) => Promise<any>;
  closeAsync: () => Promise<void>;
}

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

// Define navigation props
interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
}

const RecipesScreen = ({ navigation }: { navigation: NavigationProps }) => {
  const theme = useTheme();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  // Initialize database on component mount
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        // Initialize the database if not already initialized
        await initDatabase();
        
        // Open the database connection
        const database = await SQLite.openDatabaseAsync('indiancalorietracker.db');
        setDb(database);
      } catch (error) {
        console.error('Error setting up database:', error);
      }
    };
    
    setupDatabase();
    
    // Clean up function to close the database when component unmounts
    return () => {
      if (db) {
        db.closeAsync();
      }
    };
  }, []);

  // Load recipes when database is ready
  useEffect(() => {
    if (db) {
      loadRecipes();
    }
  }, [db]);

  // Filter recipes when search query changes
  useEffect(() => {
    if (searchQuery) {
      const filtered = recipes.filter((recipe: Recipe) => 
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRecipes(filtered);
    } else {
      setFilteredRecipes(recipes);
    }
  }, [searchQuery, recipes]);

  // Load recipes from database using the new async API
  const loadRecipes = async () => {
    try {
      if (!db) return;
      
      const result = await db.getAllAsync('SELECT * FROM recipes ORDER BY name;');
      setRecipes(result);
      setFilteredRecipes(result);
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  // Delete recipe using the new async API
  const deleteRecipe = async (recipeId: number) => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!db) return;
              
              // Delete recipe ingredients first
              await db.runAsync(
                'DELETE FROM recipe_ingredients WHERE recipe_id = ?;',
                recipeId
              );
              
              // Then delete the recipe
              await db.runAsync(
                'DELETE FROM recipes WHERE id = ?;',
                recipeId
              );
              
              // Refresh the recipes list
              loadRecipes();
              
              Alert.alert('Success', 'Recipe deleted successfully');
            } catch (error) {
              console.error('Error deleting recipe:', error);
              Alert.alert('Error', 'Failed to delete recipe');
            }
          },
        },
      ]
    );
  };

  // Render recipe card
  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.name}</Title>
        <Paragraph style={styles.description}>{item.description || 'No description available'}</Paragraph>
        <View style={styles.recipeDetails}>
          <Text style={styles.calories}>{item.total_calories} kcal total</Text>
          <Text style={styles.servings}>{item.servings} servings</Text>
          <Text style={styles.perServing}>({Math.round(item.total_calories / item.servings)} kcal/serving)</Text>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}>
          View
        </Button>
        <Button onPress={() => navigation.navigate('EditRecipe', { recipeId: item.id })}>
          Edit
        </Button>
        <Button onPress={() => deleteRecipe(item.id)}>
          Delete
        </Button>
      </Card.Actions>
    </Card>
  );

  // Sample recipes for initial display
  const sampleRecipes: Recipe[] = [
    {
      id: -1, // Temporary ID
      name: "Butter Chicken",
      description: "A classic North Indian dish with tender chicken in a creamy tomato sauce.",
      instructions: "1. Marinate chicken with yogurt and spices\n2. Grill or cook chicken pieces\n3. Prepare tomato-based gravy\n4. Add chicken to gravy and simmer",
      total_calories: 650,
      servings: 4,
    },
    {
      id: -2, // Temporary ID
      name: "Masala Dosa",
      description: "South Indian crispy crepe filled with spiced potato filling.",
      instructions: "1. Prepare dosa batter\n2. Make potato masala filling\n3. Cook thin dosas\n4. Add filling and fold",
      total_calories: 450,
      servings: 2,
    },
    {
      id: -3, // Temporary ID
      name: "Palak Paneer",
      description: "Cottage cheese cubes in a spinach gravy.",
      instructions: "1. Blanch spinach\n2. Prepare spice base\n3. Blend spinach\n4. Cook with paneer cubes",
      total_calories: 500,
      servings: 3,
    }
  ];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search recipes..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Recipe List */}
      {filteredRecipes.length > 0 ? (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRecipeCard}
          contentContainerStyle={styles.listContainer}
        />
      ) : recipes.length > 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recipes match your search.</Text>
          <Button mode="contained" onPress={() => setSearchQuery('')}>
            Clear Search
          </Button>
        </View>
      ) : (
        // Show sample recipes if no recipes in database
        <ScrollView style={styles.container}>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Title>Recipe Collection</Title>
              <Paragraph>
                Create and save your favorite Indian recipes. Calculate calories and track nutritional information.
              </Paragraph>
            </Card.Content>
          </Card>
          
          <Text style={styles.sampleTitle}>Sample Recipes</Text>
          <Text style={styles.sampleSubtitle}>
            Here are some sample recipes to get you started. Create your own by tapping the + button.
          </Text>
          
          {sampleRecipes.map(recipe => (
            <Card key={recipe.id} style={styles.card}>
              <Card.Content>
                <Title>{recipe.name}</Title>
                <Paragraph style={styles.description}>{recipe.description}</Paragraph>
                <View style={styles.recipeDetails}>
                  <Text style={styles.calories}>{recipe.total_calories} kcal total</Text>
                  <Text style={styles.servings}>{recipe.servings} servings</Text>
                  <Text style={styles.perServing}>({Math.round(recipe.total_calories / recipe.servings)} kcal/serving)</Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* FAB for adding recipe */}
      <FAB
        style={[styles.fab, { backgroundColor: "#00e6ac" }]}
        icon="plus"
        onPress={() => navigation.navigate('CreateRecipe')}
        label="Add Recipe"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 10,
    elevation: 2,
  },
  listContainer: {
    padding: 10,
  },
  card: {
    marginBottom: 15,
    elevation: 2,
  },
  infoCard: {
    margin: 10,
    backgroundColor: '#FFF3E0',
    elevation: 2,
  },
  description: {
    marginTop: 5,
    marginBottom: 10,
    color: '#666',
  },
  recipeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 5,
  },
  calories: {
    fontWeight: 'bold',
  },
  servings: {
    color: '#666',
  },
  perServing: {
    fontStyle: 'italic',
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  sampleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 5,
  },
  sampleSubtitle: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 15,
    marginBottom: 15,
  },
});

export default RecipesScreen; 