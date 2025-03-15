import React, { useState, useEffect, useContext } from 'react';
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
import { initDatabase } from '../database/database';
import { ThemeContext } from '../../App';

// Define SQLiteDatabase type
interface SQLiteDatabase {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (sql: string, ...params: any[]) => Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync: (sql: string, ...params: any[]) => Promise<any[]>;
  getFirstAsync: (sql: string, ...params: any[]) => Promise<any>;
  closeAsync: () => Promise<void>;
}

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

// Define prop types
interface IconProps {
  color?: string;
  size?: number;
  style?: any;
}

const ProfileScreen = () => {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
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

  // Load user profile when database is ready
  useEffect(() => {
    if (db) {
      loadUserProfile();
    }
  }, [db]);

  // Load user profile from database
  const loadUserProfile = async () => {
    try {
      if (!db) return;
      
      const result = await db.getAllAsync('SELECT * FROM users LIMIT 1');
      
      if (result.length > 0) {
        const userProfile = result[0];
        setProfile(userProfile);
        setName(userProfile.name || '');
        setAge(userProfile.age ? userProfile.age.toString() : '');
        setGender(userProfile.gender || '');
        setHeight(userProfile.height ? userProfile.height.toString() : '');
        setWeight(userProfile.weight ? userProfile.weight.toString() : '');
        setActivityLevel(userProfile.activity_level || '');
        setGoal(userProfile.goal || '');
        setCalorieTarget(userProfile.daily_calorie_target ? userProfile.daily_calorie_target.toString() : '');
        setProfileImage(userProfile.profile_image || null);
      } else {
        // No profile exists, create a default one
        createDefaultProfile();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    }
  };

  // Create default profile
  const createDefaultProfile = async () => {
    try {
      if (!db) return;
      
      const defaultProfile = {
        name: 'User',
        age: 30,
        gender: 'Male',
        height: 170,
        weight: 70,
        activity_level: 'Moderate',
        goal: 'Maintain',
        daily_calorie_target: 2000
      };
      
      const result = await db.runAsync(
        'INSERT INTO users (name, age, gender, height, weight, activity_level, goal, daily_calorie_target) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        defaultProfile.name,
        defaultProfile.age,
        defaultProfile.gender,
        defaultProfile.height,
        defaultProfile.weight,
        defaultProfile.activity_level,
        defaultProfile.goal,
        defaultProfile.daily_calorie_target
      );
      
      if (result.lastInsertRowId) {
        // Load the newly created profile
        loadUserProfile();
      }
    } catch (error) {
      console.error('Error creating default profile:', error);
      Alert.alert('Error', 'Failed to create default profile');
    }
  };

  // Save profile changes
  const saveProfile = async () => {
    try {
      if (!db || !profile) return;
      
      const updatedProfile = {
        name: name,
        age: parseInt(age) || 0,
        gender: gender,
        height: parseInt(height) || 0,
        weight: parseInt(weight) || 0,
        activity_level: activityLevel,
        goal: goal,
        daily_calorie_target: parseInt(calorieTarget) || 0,
        profile_image: profileImage
      };
      
      await db.runAsync(
        'UPDATE users SET name = ?, age = ?, gender = ?, height = ?, weight = ?, activity_level = ?, goal = ?, daily_calorie_target = ?, profile_image = ? WHERE id = ?',
        updatedProfile.name,
        updatedProfile.age,
        updatedProfile.gender,
        updatedProfile.height,
        updatedProfile.weight,
        updatedProfile.activity_level,
        updatedProfile.goal,
        updatedProfile.daily_calorie_target,
        updatedProfile.profile_image,
        profile.id
      );
      
      // Reload profile
      loadUserProfile();
      setEditMode(false);
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile changes');
    }
  };

  // Calculate BMI
  const calculateBMI = (): number => {
    if (!profile || profile.height <= 0 || profile.weight <= 0) return 0;
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
      setProfileImage(result.assets[0].uri);
    }
  };

  // Update calorie target
  const updateCalorieTarget = () => {
    if (!profile) return;
    
    const newTarget = calculateCalorieNeeds();
    if (newTarget) {
      saveProfile();
    }
  };

  // Calculate calorie needs
  const calculateCalorieNeeds = (): number => {
    if (!profile) return 0;
    
    // Calculate BMR using Mifflin-St Jeor Equation
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
    
    // Calculate TDEE (Total Daily Energy Expenditure)
    let tdee = Math.round(bmr * activityMultiplier);
    
    // Goal adjustment
    switch (profile.goal) {
      case 'Lose Weight': tdee -= 500; break;
      case 'Gain Weight': tdee += 500; break;
      // Maintain weight - no adjustment needed
    }
    
    // Update the state
    setCalorieTarget(tdee.toString());
    
    return tdee;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileHeader}>
          {profile?.profile_image ? (
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
                value={name}
                onChangeText={(text: string) => setName(text)}
                style={styles.input}
              />
              <Button mode="contained" onPress={pickImage} style={styles.imageButton} buttonColor="#00e6ac">
                Change Photo
              </Button>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Title style={styles.profileName}>{profile?.name}</Title>
              <Paragraph style={styles.profileGoal}>Goal: {profile?.goal}</Paragraph>
              <Paragraph style={styles.profileTarget}>
                Daily Target: {profile?.daily_calorie_target} kcal
              </Paragraph>
            </View>
          )}
        </Card.Content>
        
        <Card.Actions style={styles.cardActions}>
          {editMode ? (
            <>
              <Button onPress={() => setEditMode(false)} textColor="#00e6ac">Cancel</Button>
              <Button mode="contained" onPress={saveProfile} buttonColor="#00e6ac">Save</Button>
            </>
          ) : (
            <Button mode="contained" onPress={() => setEditMode(true)} buttonColor="#00e6ac">
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
                  value={age}
                  onChangeText={(text: string) => setAge(text)}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                />
                <TextInput
                  label="Gender"
                  value={gender}
                  onChangeText={(text: string) => setGender(text)}
                  style={[styles.input, styles.halfInput]}
                />
              </View>
              
              <View style={styles.row}>
                <TextInput
                  label="Height (cm)"
                  value={height}
                  onChangeText={(text: string) => setHeight(text)}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                />
                <TextInput
                  label="Weight (kg)"
                  value={weight}
                  onChangeText={(text: string) => setWeight(text)}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                />
              </View>
              
              <TextInput
                label="Activity Level"
                value={activityLevel}
                onChangeText={(text: string) => setActivityLevel(text)}
                style={styles.input}
              />
              
              <TextInput
                label="Goal"
                value={goal}
                onChangeText={(text: string) => setGoal(text)}
                style={styles.input}
              />
              
              <View style={styles.row}>
                <TextInput
                  label="Daily Calorie Target"
                  value={calorieTarget}
                  onChangeText={(text: string) => setCalorieTarget(text)}
                  keyboardType="numeric"
                  style={[styles.input, { flex: 2 }]}
                />
                <Button 
                  mode="contained" 
                  onPress={updateCalorieTarget}
                  style={[styles.calculateButton, { flex: 1 }]}
                  buttonColor="#00e6ac"
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
                  <Text style={styles.metricValue}>{profile?.age} years</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Gender</Text>
                  <Text style={styles.metricValue}>{profile?.gender}</Text>
                </View>
              </View>
              
              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Height</Text>
                  <Text style={styles.metricValue}>{profile?.height} cm</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Weight</Text>
                  <Text style={styles.metricValue}>{profile?.weight} kg</Text>
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
                  <Text style={styles.metricValue}>{profile?.activity_level}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Goal</Text>
                  <Text style={styles.metricValue}>{profile?.goal}</Text>
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
            left={(props: IconProps) => <List.Icon {...props} icon="theme-light-dark" color="#00e6ac" />}
            right={(props: IconProps) => <Switch value={isDarkMode} onValueChange={toggleTheme} color="#00e6ac" />}
          />
          
          <Divider />
          
          <List.Item
            title="Notifications"
            left={(props: IconProps) => <List.Icon {...props} icon="bell" color="#00e6ac" />}
            right={(props: IconProps) => <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} color="#00e6ac" />}
          />
          
          <Divider />
          
          <List.Item
            title="Export Data"
            left={(props: IconProps) => <List.Icon {...props} icon="export" color="#00e6ac" />}
            right={(props: IconProps) => <List.Icon {...props} icon="chevron-right" color="#00e6ac" />}
            onPress={() => Alert.alert('Export', 'Data export feature coming soon!')}
          />
          
          <Divider />
          
          <List.Item
            title="About"
            left={(props: IconProps) => <List.Icon {...props} icon="information" color="#00e6ac" />}
            right={(props: IconProps) => <List.Icon {...props} icon="chevron-right" color="#00e6ac" />}
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