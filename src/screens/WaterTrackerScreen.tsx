import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  IconButton,
  ProgressBar,
  List,
  Divider,
  useTheme
} from 'react-native-paper';
import * as SQLite from 'expo-sqlite';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

// Open database connection
const db = SQLite.openDatabaseSync('indiancalorietracker.db');

// Define water log interface
interface WaterLog {
  id: number;
  user_id: number;
  amount_ml: number;
  timestamp: string;
  date: string;
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

// Define prop types
interface IconProps {
  color?: string;
  size?: number;
  style?: any;
}

const WaterTrackerScreen = () => {
  const theme = useTheme();
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [totalWater, setTotalWater] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2500); // Default 2.5L
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [weekDays, setWeekDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

  // Load water logs on component mount
  useEffect(() => {
    loadWaterLogs();
    loadWeeklyData();
  }, []);

  // Format date to YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Get today's date
  const today = formatDate(new Date());

  // Load water logs from database
  const loadWaterLogs = () => {
    db.transaction((tx: SQLiteTransaction) => {
      tx.executeSql(
        'SELECT * FROM water_logs WHERE date = ? ORDER BY timestamp DESC;',
        [today],
        (_, { rows }) => {
          setWaterLogs(rows._array);
          calculateTotalWater(rows._array);
        },
        (_, error) => {
          console.error('Error loading water logs:', error);
          return false;
        }
      );
    });
  };

  // Calculate total water intake
  const calculateTotalWater = (logs: WaterLog[]) => {
    const total = logs.reduce((sum, log) => sum + log.amount_ml, 0);
    setTotalWater(total);
  };

  // Load weekly water data
  const loadWeeklyData = () => {
    const dates: string[] = [];
    const days: string[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Generate dates for the past 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(formatDate(date));
      days.push(dayNames[date.getDay()]);
    }
    
    setWeekDays(days);
    
    // Query database for water logs for each date
    db.transaction((tx: SQLiteTransaction) => {
      const data: number[] = Array(7).fill(0);
      
      dates.forEach((date, index) => {
        tx.executeSql(
          'SELECT SUM(amount_ml) as total FROM water_logs WHERE date = ?;',
          [date],
          (_, { rows }) => {
            if (rows.length > 0 && rows.item(0).total) {
              data[index] = rows.item(0).total;
            }
            
            // If this is the last date, update state
            if (index === dates.length - 1) {
              setWeeklyData(data);
            }
          },
          (_, error) => {
            console.error('Error loading weekly water data:', error);
            return false;
          }
        );
      });
    });
  };

  // Add water log
  const addWaterLog = (amount: number) => {
    const timestamp = new Date().toISOString();
    
    db.transaction((tx: SQLiteTransaction) => {
      tx.executeSql(
        'INSERT INTO water_logs (user_id, amount_ml, timestamp, date) VALUES (?, ?, ?, ?);',
        [1, amount, timestamp, today],
        (_, result) => {
          loadWaterLogs();
          loadWeeklyData();
        },
        (_, error) => {
          console.error('Error adding water log:', error);
          return false;
        }
      );
    });
  };

  // Delete water log
  const deleteWaterLog = (id: number) => {
    db.transaction((tx: SQLiteTransaction) => {
      tx.executeSql(
        'DELETE FROM water_logs WHERE id = ?;',
        [id],
        (_, result) => {
          loadWaterLogs();
          loadWeeklyData();
        },
        (_, error) => {
          console.error('Error deleting water log:', error);
          return false;
        }
      );
    });
  };

  // Format time from ISO string
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate progress percentage
  const calculateProgress = (): number => {
    return Math.min(totalWater / waterGoal, 1);
  };

  // Get remaining water amount
  const getRemainingWater = (): number => {
    return Math.max(waterGoal - totalWater, 0);
  };

  // Update water goal
  const updateWaterGoal = (newGoal: number) => {
    setWaterGoal(newGoal);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Water Progress Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Water Intake</Title>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {totalWater} ml / {waterGoal} ml
            </Text>
            <ProgressBar
              progress={calculateProgress()}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <Text style={styles.remainingText}>
              {getRemainingWater() > 0
                ? `${getRemainingWater()} ml remaining`
                : 'Goal reached! 🎉'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Add Buttons */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Quick Add</Title>
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => addWaterLog(200)}
              style={styles.waterButton}
              labelStyle={styles.waterButtonLabel}
            >
              200 ml
            </Button>
            <Button
              mode="contained"
              onPress={() => addWaterLog(300)}
              style={styles.waterButton}
              labelStyle={styles.waterButtonLabel}
            >
              300 ml
            </Button>
            <Button
              mode="contained"
              onPress={() => addWaterLog(500)}
              style={styles.waterButton}
              labelStyle={styles.waterButtonLabel}
            >
              500 ml
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Weekly Chart */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Weekly Overview</Title>
          <BarChart
            data={{
              labels: weekDays,
              datasets: [
                {
                  data: weeklyData,
                },
              ],
            }}
            width={Dimensions.get('window').width - 40}
            height={220}
            yAxisSuffix=" ml"
            chartConfig={{
              backgroundColor: theme.colors.surface,
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Today's Logs */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Today's Logs</Title>
          {waterLogs.length > 0 ? (
            waterLogs.map((log) => (
              <View key={log.id}>
                <List.Item
                  title={`${log.amount_ml} ml`}
                  description={formatTime(log.timestamp)}
                  left={(props: IconProps) => <List.Icon {...props} icon="water" />}
                  right={(props: IconProps) => (
                    <IconButton
                      {...props}
                      icon="delete"
                      onPress={() => deleteWaterLog(log.id)}
                    />
                  )}
                />
                <Divider />
              </View>
            ))
          ) : (
            <Paragraph style={styles.emptyText}>
              No water logs for today. Start tracking your hydration!
            </Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Water Goal Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Water Goal Settings</Title>
          <Paragraph style={styles.goalText}>
            Current goal: {waterGoal} ml
          </Paragraph>
          <View style={styles.goalButtonContainer}>
            <Button
              mode="outlined"
              onPress={() => updateWaterGoal(2000)}
              style={styles.goalButton}
            >
              2000 ml
            </Button>
            <Button
              mode="outlined"
              onPress={() => updateWaterGoal(2500)}
              style={styles.goalButton}
            >
              2500 ml
            </Button>
            <Button
              mode="outlined"
              onPress={() => updateWaterGoal(3000)}
              style={styles.goalButton}
            >
              3000 ml
            </Button>
            <Button
              mode="outlined"
              onPress={() => updateWaterGoal(3500)}
              style={styles.goalButton}
            >
              3500 ml
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Hydration Tips */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Hydration Tips</Title>
          <List.Item
            title="Stay consistent"
            description="Drink water regularly throughout the day rather than all at once."
            left={(props: IconProps) => <List.Icon {...props} icon="clock-outline" />}
          />
          <Divider />
          <List.Item
            title="Drink before meals"
            description="Having water 30 minutes before meals helps with digestion."
            left={(props: IconProps) => <List.Icon {...props} icon="food-apple" />}
          />
          <Divider />
          <List.Item
            title="Hydrate after exercise"
            description="Replace fluids lost during physical activity."
            left={(props: IconProps) => <List.Icon {...props} icon="run" />}
          />
          <Divider />
          <List.Item
            title="Include hydrating foods"
            description="Cucumber, watermelon, and oranges have high water content."
            left={(props: IconProps) => <List.Icon {...props} icon="fruit-watermelon" />}
          />
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
  card: {
    margin: 10,
    elevation: 2,
  },
  title: {
    marginBottom: 10,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  progressBar: {
    height: 15,
    width: '100%',
    borderRadius: 10,
  },
  remainingText: {
    marginTop: 5,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  waterButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  waterButtonLabel: {
    fontSize: 14,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  goalText: {
    marginBottom: 10,
  },
  goalButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalButton: {
    marginVertical: 5,
    width: '48%',
  },
});

export default WaterTrackerScreen; 