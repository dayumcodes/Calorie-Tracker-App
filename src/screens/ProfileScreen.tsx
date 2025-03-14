import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  TextInput, 
  Divider,
  List,
  Avatar,
  Switch,
  useTheme
} from 'react-native-paper';
import * as SQLite from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';

// Open database connection
const db = SQLite.openDatabaseSync('indiancalorietracker.db');

// Define user profile interface
interface UserProfile {
  id: number;
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  activity_level: string;
  goal: string;
  daily_calorie_target: number;
  profile_image?: string;
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

const ProfileScreen = () => {
  const theme = useTheme();
  const [profile, setProfile] = useState<UserProfile>({
    id: 1,
    name: '',
    age: 0,
    gender: 'Male',
    height: 0,
    weight: 0,
    activity_level: 'Moderate',
    goal: 'Maintain',
    daily_calorie_target: 2000,
    profile_image: undefined
  });
  
  const [editMode, setEditMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Load user profile from database
  const loadUserProfile = () => {
    db.transaction((tx: SQLiteTransaction) => {
      tx.executeSql(
        'SELECT * FROM users WHERE id = 1;',
        [],
        (_, { rows }) => {
          if (rows.length > 0) {
            setProfile(rows.item(0));
          } else {
            // Create default profile if none exists
            createDefaultProfile();
          }
        },
        (_, error) => {
          console.error('Error loading user profile:', error);
          return false;
        }
      );
    });
  };

  // Create default profile
  const createDefaultProfile = () => {
    const defaultProfile: UserProfile = {
      id: 1,
      name: 'User',
      age: 30,
      gender: 'Male',
      height: 170,
      weight: 70,
      activity_level: 'Moderate',
      goal: 'Maintain',
      daily_calorie_target: 2000,
      profile_image: undefined
    };

    db.transaction((tx: SQLiteTransaction) => {
      tx.executeSql(
        'INSERT INTO users (id, name, age, gender, height, weight, activity_level, goal, daily_calorie_target) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
        [
          defaultProfile.id,
          defaultProfile.name,
          defaultProfile.age,
          defaultProfile.gender,
          defaultProfile.height,
          defaultProfile.weight,
          defaultProfile.activity_level,
          defaultProfile.goal,
          defaultProfile.daily_calorie_target
        ],
        (_, result) => {
          setProfile(defaultProfile);
        },
        (_, error) => {
          console.error('Error creating default profile:', error);
          return false;
        }
      );
    });
  };

  // Save profile changes
  const saveProfile = () => {
    db.transaction((tx: SQLiteTransaction) => {
      tx.executeSql(
        'UPDATE users SET name = ?, age = ?, gender = ?, height = ?, weight = ?, activity_level = ?, goal = ?, daily_calorie_target = ?, profile_image = ? WHERE id = 1;',
        [
          profile.name,
          profile.age,
          profile.gender,
          profile.height,
          profile.weight,
          profile.activity_level,
          profile.goal,
          profile.daily_calorie_target,
          profile.profile_image
        ],
        (_, result) => {
          setEditMode(false);
          Alert.alert('Success', 'Profile updated successfully');
        },
        (_, error) => {
          console.error('Error updating profile:', error);
          return false;
        }
      );
    });
  };

  // Calculate BMI
  const calculateBMI = (): number => {
    if (profile.height <= 0 || profile.weight <= 0) return 0;
    const heightInMeters = profile.height / 100;
    return parseFloat((profile.weight / (heightInMeters * heightInMeters)).toFixed(1));
  };

  // Get BMI category
  const getBMICategory = (bmi: number): string => {
    if (bmi <= 0) return 'Not available';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  // Pick image from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfile({
        ...profile,
        profile_image: result.assets[0].uri
      });
    }
  };

  // Calculate daily calorie needs based on profile
  const calculateCalorieNeeds = () => {
    // Harris-Benedict Equation
    let bmr = 0;
    
    if (profile.gender === 'Male') {
      bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
    } else {
      bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
    }
    
    // Activity multiplier
    let activityMultiplier = 1.2; // Sedentary
    switch (profile.activity_level) {
      case 'Light': activityMultiplier = 1.375; break;
      case 'Moderate': activityMultiplier = 1.55; break;
      case 'Active': activityMultiplier = 1.725; break;
      case 'Very Active': activityMultiplier = 1.9; break;
    }
    
    let tdee = bmr * activityMultiplier;
    
    // Goal adjustment
    switch (profile.goal) {
      case 'Lose Weight': tdee -= 500; break;
      case 'Gain Weight': tdee += 500; break;
    }
    
    return Math.round(tdee);
  };

  // Update calorie target
  const updateCalorieTarget = () => {
    const calculatedTarget = calculateCalorieNeeds();
    setProfile({
      ...profile,
      daily_calorie_target: calculatedTarget
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileHeader}>
          {profile.profile_image ? (
            <Avatar.Image 
              size={100} 
              source={{ uri: profile.profile_image }} 
              style={styles.avatar}
            />
          ) : (
            <Avatar.Icon 
              size={100} 
              icon="account" 
              style={styles.avatar}
            />
          )}
          
          {editMode ? (
            <View style={styles.profileEditHeader}>
              <TextInput
                label="Name"
                value={profile.name}
                onChangeText={(text: string) => setProfile({...profile, name: text})}
                style={styles.input}
              />
              <Button mode="contained" onPress={pickImage} style={styles.imageButton}>
                Change Photo
              </Button>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Title style={styles.profileName}>{profile.name}</Title>
              <Paragraph style={styles.profileGoal}>Goal: {profile.goal}</Paragraph>
              <Paragraph style={styles.profileTarget}>
                Daily Target: {profile.daily_calorie_target} kcal
              </Paragraph>
            </View>
          )}
        </Card.Content>
        
        <Card.Actions style={styles.cardActions}>
          {editMode ? (
            <>
              <Button onPress={() => setEditMode(false)}>Cancel</Button>
              <Button mode="contained" onPress={saveProfile}>Save</Button>
            </>
          ) : (
            <Button mode="contained" onPress={() => setEditMode(true)}>
              Edit Profile
            </Button>
          )}
        </Card.Actions>
      </Card>

      {/* Health Metrics */}
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Title>Health Metrics</Title>
          
          {editMode ? (
            <View style={styles.editMetrics}>
              <View style={styles.row}>
                <TextInput
                  label="Age"
                  value={profile.age.toString()}
                  onChangeText={(text: string) => setProfile({...profile, age: parseInt(text) || 0})}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                />
                <TextInput
                  label="Gender"
                  value={profile.gender}
                  onChangeText={(text: string) => setProfile({...profile, gender: text})}
                  style={[styles.input, styles.halfInput]}
                />
              </View>
              
              <View style={styles.row}>
                <TextInput
                  label="Height (cm)"
                  value={profile.height.toString()}
                  onChangeText={(text: string) => setProfile({...profile, height: parseInt(text) || 0})}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                />
                <TextInput
                  label="Weight (kg)"
                  value={profile.weight.toString()}
                  onChangeText={(text: string) => setProfile({...profile, weight: parseInt(text) || 0})}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                />
              </View>
              
              <TextInput
                label="Activity Level"
                value={profile.activity_level}
                onChangeText={(text: string) => setProfile({...profile, activity_level: text})}
                style={styles.input}
              />
              
              <TextInput
                label="Goal"
                value={profile.goal}
                onChangeText={(text: string) => setProfile({...profile, goal: text})}
                style={styles.input}
              />
              
              <View style={styles.row}>
                <TextInput
                  label="Daily Calorie Target"
                  value={profile.daily_calorie_target.toString()}
                  onChangeText={(text: string) => setProfile({...profile, daily_calorie_target: parseInt(text) || 0})}
                  keyboardType="numeric"
                  style={[styles.input, { flex: 2 }]}
                />
                <Button 
                  mode="contained" 
                  onPress={updateCalorieTarget}
                  style={[styles.calculateButton, { flex: 1 }]}
                >
                  Calculate
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.metricsContainer}>
              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Age</Text>
                  <Text style={styles.metricValue}>{profile.age} years</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Gender</Text>
                  <Text style={styles.metricValue}>{profile.gender}</Text>
                </View>
              </View>
              
              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Height</Text>
                  <Text style={styles.metricValue}>{profile.height} cm</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Weight</Text>
                  <Text style={styles.metricValue}>{profile.weight} kg</Text>
                </View>
              </View>
              
              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>BMI</Text>
                  <Text style={styles.metricValue}>{calculateBMI()}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>BMI Category</Text>
                  <Text style={styles.metricValue}>{getBMICategory(calculateBMI())}</Text>
                </View>
              </View>
              
              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Activity Level</Text>
                  <Text style={styles.metricValue}>{profile.activity_level}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Goal</Text>
                  <Text style={styles.metricValue}>{profile.goal}</Text>
                </View>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Title>Settings</Title>
          
          <List.Item
            title="Dark Mode"
            left={(props: IconProps) => <List.Icon {...props} icon="theme-light-dark" />}
            right={(props: IconProps) => <Switch value={darkMode} onValueChange={setDarkMode} />}
          />
          
          <Divider />
          
          <List.Item
            title="Notifications"
            left={(props: IconProps) => <List.Icon {...props} icon="bell" />}
            right={(props: IconProps) => <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />}
          />
          
          <Divider />
          
          <List.Item
            title="Export Data"
            left={(props: IconProps) => <List.Icon {...props} icon="export" />}
            right={(props: IconProps) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Export', 'Data export feature coming soon!')}
          />
          
          <Divider />
          
          <List.Item
            title="About"
            left={(props: IconProps) => <List.Icon {...props} icon="information" />}
            right={(props: IconProps) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('About', 'Indian Calorie Tracker v1.0\nTrack your nutrition with focus on Indian cuisine.')}
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
  profileCard: {
    margin: 10,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileEditHeader: {
    flex: 1,
    marginLeft: 15,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  profileName: {
    fontSize: 24,
  },
  profileGoal: {
    marginTop: 5,
  },
  profileTarget: {
    marginTop: 5,
    fontWeight: 'bold',
  },
  avatar: {
    backgroundColor: '#FFA000',
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingTop: 0,
  },
  metricsCard: {
    margin: 10,
    elevation: 2,
  },
  settingsCard: {
    margin: 10,
    marginBottom: 20,
    elevation: 2,
  },
  input: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  calculateButton: {
    justifyContent: 'center',
    marginLeft: 10,
    marginBottom: 10,
  },
  imageButton: {
    marginTop: 10,
  },
  metricsContainer: {
    marginTop: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metric: {
    width: '48%',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  metricLabel: {
    color: '#666',
    fontSize: 12,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  editMetrics: {
    marginTop: 10,
  },
});

export default ProfileScreen; 