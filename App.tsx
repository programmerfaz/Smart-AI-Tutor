// App.tsx
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { UserProvider } from './context/UserContext';

// Screens
import SplashScreen from './screen/SplashScreen';
import Login from './screen/login';
import Signin from './screen/signin';
import Dashboard from './screen/Dashboard';
import Sessioner from './screen/Sessioner';
import AiNotes from 'screen/AINotes';
import StudyGroups from './screen/StudyGroups';
import Profile from './screen/profile';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 👇 Bottom Tabs
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = '';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Sessioner') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'AiNote') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'StudyGroups') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#615fff',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Sessioner" component={Sessioner} />
      <Tab.Screen name="AiNote" component={AiNotes} />
      <Tab.Screen name="StudyGroups" component={StudyGroups} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

// 👇 App Navigation (Stack + Tabs)
export default function App() {
  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="splash" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="splash" component={SplashScreen} />
          <Stack.Screen name="login" component={Login} />
          <Stack.Screen name="signin" component={Signin} />
          {/* When user logs in, move them into MainTabs */}
          <Stack.Screen name="main" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
