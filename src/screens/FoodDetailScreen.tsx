import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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

// Define prop types
interface IconProps {
  color?: string;
  size?: number;
  style?: any;
}

// Define route param types
type RouteParams = {
  FoodDetail: { foodId: number };
};

const FoodDetailScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProp<RouteParams, 'FoodDetail'>>();
  const navigation = useNavigation();
  const [foodItem, setFoodItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const foodId = route.params?.foodId || 1;
  
  useEffect(() => {
    const loadFoodItem = async () => {
      try {
        // This is a placeholder - in a real app, you would fetch the food item from the database
        setFoodItem({
          id: foodId,
          name: 'Sample Food Item',
          calories: 250,
          protein: 10,
          carbs: 30,
          fat: 8,
          fiber: 5,
          serving_size: '100g',
          region: 'Sample Region',
          category: 'Sample Category'
        });
        setLoading(false);
      } catch (error) {
        console.error('Error loading food item:', error);
        setLoading(false);
      }
    };
    
    loadFoodItem();
  }, [foodId]);
  
  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  if (!foodItem) {
    return (
      <View style={styles.container}>
        <Text>Food item not found</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>{foodItem.name}</Title>
          
          <View style={styles.nutritionContainer}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{foodItem.calories}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{foodItem.protein}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{foodItem.carbs}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{foodItem.fat}g</Text>
              <Text style={styles.nutritionLabel}>Fat</Text>
            </View>
            
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{foodItem.fiber}g</Text>
              <Text style={styles.nutritionLabel}>Fiber</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Details</Title>
          
          <List.Item
            title="Serving Size"
            description={foodItem.serving_size}
            left={(props: IconProps) => <List.Icon {...props} icon="food-variant" />}
          />
          
          <Divider />
          
          <List.Item
            title="Region"
            description={foodItem.region}
            left={(props: IconProps) => <List.Icon {...props} icon="map-marker" />}
          />
          
          <Divider />
          
          <List.Item
            title="Category"
            description={foodItem.category}
            left={(props: IconProps) => <List.Icon {...props} icon="tag" />}
          />
        </Card.Content>
      </Card>
      
      <Button 
        mode="contained" 
        onPress={() => navigation.goBack()}
        style={styles.button}
      >
        Back
      </Button>
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
    elevation: 2,
  },
  title: {
    marginBottom: 15,
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  nutritionItem: {
    alignItems: 'center',
    width: '18%',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  button: {
    margin: 10,
    marginBottom: 20,
  },
});

export default FoodDetailScreen; 