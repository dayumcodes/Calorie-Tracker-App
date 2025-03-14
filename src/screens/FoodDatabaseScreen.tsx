import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Searchbar, Chip, Card, Title, Paragraph, Divider, useTheme, Text } from 'react-native-paper';
import { getAllFoodItems, getFoodItemsByRegion } from '../database/database';

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

// Define navigation props
interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
}

const FoodDatabaseScreen = ({ navigation }: { navigation: NavigationProps }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Define regions and categories
  const regions = ['North Indian', 'South Indian', 'East Indian', 'West Indian', 'Common'];
  const categories = ['Breakfast', 'Main Course', 'Side Dish', 'Snack', 'Dessert', 'Beverage', 'Bread', 'Staple', 'Appetizer', 'Condiment', 'Soup'];

  // Load all food items on component mount
  useEffect(() => {
    const loadFoodItems = async () => {
      try {
        const items = await getAllFoodItems();
        setFoodItems(items);
        setFilteredItems(items);
      } catch (error) {
        console.error('Error loading food items:', error);
      }
    };

    loadFoodItems();
  }, []);

  // Filter food items based on search query, region, and category
  useEffect(() => {
    let filtered = [...foodItems];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by region
    if (selectedRegion) {
      filtered = filtered.filter(item => item.region === selectedRegion);
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  }, [searchQuery, selectedRegion, selectedCategory, foodItems]);

  // Handle region selection
  const handleRegionSelect = (region: string) => {
    setSelectedRegion(selectedRegion === region ? null : region);
  };

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  // Render food item card
  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <Card style={styles.card} onPress={() => navigation.navigate('AddFood', { foodItem: item })}>
      <Card.Content>
        <Title>{item.name}</Title>
        <View style={styles.detailsRow}>
          <Paragraph style={styles.calories}>{item.calories} kcal</Paragraph>
          <Paragraph>({item.serving_size})</Paragraph>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.macrosContainer}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{item.protein.toFixed(1)}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{item.carbs.toFixed(1)}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{item.fat.toFixed(1)}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{item.fiber.toFixed(1)}g</Text>
            <Text style={styles.macroLabel}>Fiber</Text>
          </View>
        </View>
        <View style={styles.tagsContainer}>
          <Chip style={styles.tag} textStyle={styles.tagText}>{item.region}</Chip>
          <Chip style={styles.tag} textStyle={styles.tagText}>{item.category}</Chip>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search Indian foods..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Region Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Region:</Text>
        <FlatList
          horizontal
          data={regions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Chip
              selected={selectedRegion === item}
              onPress={() => handleRegionSelect(item)}
              style={[
                styles.filterChip,
                selectedRegion === item && { backgroundColor: theme.colors.primary }
              ]}
              textStyle={selectedRegion === item ? { color: 'white' } : {}}
            >
              {item}
            </Chip>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        />
      </View>

      {/* Category Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Category:</Text>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Chip
              selected={selectedCategory === item}
              onPress={() => handleCategorySelect(item)}
              style={[
                styles.filterChip,
                selectedCategory === item && { backgroundColor: theme.colors.primary }
              ]}
              textStyle={selectedCategory === item ? { color: 'white' } : {}}
            >
              {item}
            </Chip>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        />
      </View>

      {/* Food Items List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFoodItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No food items found.</Text>
            <Text style={styles.emptySubText}>Try adjusting your filters or search query.</Text>
          </View>
        }
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
  filtersContainer: {
    marginHorizontal: 10,
    marginBottom: 5,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  chipContainer: {
    paddingRight: 10,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  listContainer: {
    padding: 10,
  },
  card: {
    marginBottom: 10,
    elevation: 2,
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
    marginVertical: 10,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  tag: {
    marginRight: 5,
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
  },
  tagText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default FoodDatabaseScreen; 