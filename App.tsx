// App.tsx
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './screen/SplashScreen';
// import Home from './screens/home'; // Assuming you have a Home screen
import 'react-native-gesture-handler';

//Importing all the screens in the app
import Login from './screen/login';
import Signin from './screen/signin';
import Dashboard from './screen/Dashboard';

// import AsyncStorage from '@react-native-async-storage/async-storage';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" component={SplashScreen} />
        <Stack.Screen name="login" component={Login} />
        <Stack.Screen name="signin" component={Signin} />
        <Stack.Screen name="dashboard" component={Dashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
