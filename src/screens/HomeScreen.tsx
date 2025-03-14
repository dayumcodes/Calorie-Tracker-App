import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, ProgressBar, Divider, List, FAB, useTheme } from 'react-native-paper';
import { getFoodLogsByDate } from '../database/database';

// Define food log type
interface FoodLog {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  quantity: number;
  meal_type: string;
  serving_size: string;
  log_id: number;
}

// Define props type for List.Icon
interface ListIconProps {
  color: string;
  style: any;
  [key: string]: any;
}

// Temporary user ID until we implement authentication
const TEMP_USER_ID = 1;

const HomeScreen = () => {
  const theme = useTheme();
  const [date, setDate] = useState(new Date());
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [dailySummary, setDailySummary] = useState({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    totalFiber: 0,
    calorieGoal: 2000, // Default goal
    waterIntake: 0,
    waterGoal: 8 // Default 8 glasses
  });

  // Format date as YYYY-MM-DD
  const formattedDate = date.toISOString().split('T')[0];

  // Load food logs for the current date
  useEffect(() => {
    const loadFoodLogs = async () => {
      try {
        const logs = await getFoodLogsByDate(TEMP_USER_ID, formattedDate);
        setFoodLogs(logs);
        
        // Calculate daily summary
        let calories = 0;
        let protein = 0;
        let carbs = 0;
        let fat = 0;
        let fiber = 0;
        
        logs.forEach((log: FoodLog) => {
          calories += log.calories * log.quantity;
          protein += log.protein * log.quantity;
          carbs += log.carbs * log.quantity;
          fat += log.fat * log.quantity;
          fiber += log.fiber * log.quantity;
        });
        
        setDailySummary(prev => ({
          ...prev,
          totalCalories: calories,
          totalProtein: protein,
          totalCarbs: carbs,
          totalFat: fat,
          totalFiber: fiber
        }));
      } catch (error) {
        console.error('Error loading food logs:', error);
      }
    };
    
    loadFoodLogs();
  }, [formattedDate]);

  // Navigate to previous day
  const goToPreviousDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    setDate(newDate);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    setDate(newDate);
  };

  // Add a glass of water
  const addWater = () => {
    setDailySummary(prev => ({
      ...prev,
      waterIntake: Math.min(prev.waterIntake + 1, prev.waterGoal)
    }));
  };

  // Format date for display
  const formatDateForDisplay = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Group food logs by meal type
  const groupedFoodLogs = foodLogs.reduce((acc: Record<string, FoodLog[]>, log: FoodLog) => {
    if (!acc[log.meal_type]) {
      acc[log.meal_type] = [];
    }
    acc[log.meal_type].push(log);
    return acc;
  }, {} as Record<string, FoodLog[]>);

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Date Navigation */}
        <View style={styles.dateNavigation}>
          <Button onPress={goToPreviousDay} icon="chevron-left">
            Previous
          </Button>
          <Text style={styles.dateText}>{formatDateForDisplay(date)}</Text>
          <Button onPress={goToNextDay} icon="chevron-right" contentStyle={{ flexDirection: 'row-reverse' }}>
            Next
          </Button>
        </View>

        {/* Daily Summary Card */}
        <Card style={styles.card}>
          <Card.Title title="Daily Summary" />
          <Card.Content>
            <Text style={styles.summaryText}>
              Calories: {dailySummary.totalCalories} / {dailySummary.calorieGoal} kcal
            </Text>
            <ProgressBar
              progress={dailySummary.totalCalories / dailySummary.calorieGoal}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            
            <View style={styles.macroContainer}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{dailySummary.totalProtein.toFixed(1)}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>{dailySummary.totalCarbs.toFixed(1)}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroValue}>{dailySummary.totalFat.toFixed(1)}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Fiber</Text>
                <Text style={styles.macroValue}>{dailySummary.totalFiber.toFixed(1)}g</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Water Intake Card */}
        <Card style={styles.card}>
          <Card.Title title="Water Intake" />
          <Card.Content>
            <View style={styles.waterContainer}>
              {Array.from({ length: dailySummary.waterGoal }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.waterGlass,
                    index < dailySummary.waterIntake ? styles.waterGlassFilled : {}
                  ]}
                />
              ))}
            </View>
            <Text style={styles.waterText}>
              {dailySummary.waterIntake} / {dailySummary.waterGoal} glasses
            </Text>
            <Button
              mode="contained"
              onPress={addWater}
              style={styles.waterButton}
              icon="water"
            >
              Add Water
            </Button>
          </Card.Content>
        </Card>

        {/* Food Logs */}
        <Card style={styles.card}>
          <Card.Title title="Today's Food Log" />
          <Card.Content>
            {Object.keys(groupedFoodLogs).length > 0 ? (
              Object.entries(groupedFoodLogs).map(([mealType, logs]) => (
                <View key={mealType}>
                  <List.Subheader>{mealType}</List.Subheader>
                  {logs.map(log => (
                    <List.Item
                      key={log.log_id}
                      title={log.name}
                      description={`${(log.calories * log.quantity).toFixed(0)} kcal | ${log.serving_size} x ${log.quantity}`}
                      left={(props: ListIconProps) => <List.Icon {...props} icon="food" />}
                    />
                  ))}
                  <Divider />
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No food logged for today. Add your meals!</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FAB for adding food */}
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => {}}
        label="Add Food"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    margin: 10,
    elevation: 4,
  },
  summaryText: {
    fontSize: 18,
    marginBottom: 5,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroLabel: {
    fontSize: 14,
    color: '#666',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  waterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  waterGlass: {
    width: 30,
    height: 40,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 5,
    margin: 5,
  },
  waterGlassFilled: {
    backgroundColor: '#2196F3',
  },
  waterText: {
    textAlign: 'center',
    marginBottom: 10,
  },
  waterButton: {
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default HomeScreen; 