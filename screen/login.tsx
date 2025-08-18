
import React from 'react';
import "../global.css"; // Ensure global styles are imported
import { View, Text, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, TextInput, TouchableOpacity, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
  isErrorWithCode
} from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Import your Firebase config
import { supabase } from '../supabaseClient';

import { useContext } from "react";
import { UserContext } from "../context/UserContext";

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const webClientId = process.env.WEB_CLIENT_ID;

GoogleSignin.configure({
  webClientId: webClientId,
});

type RootStackParamList = {
  splash: undefined;
  login: undefined;
  signin: undefined;
  dashboard: {
    userInfo: any;  // your user info type here
  };
  main: { screen?: string; params?: any };
};


type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'login'>;

const Login = () => {

  const navigation = useNavigation<SplashScreenNavigationProp>(); // define navigation type

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const { setUser } = useContext(UserContext);

  //The code below is used to restore user info from AsyncStorage when the component mounts
  // // Load user info from AsyncStorage on mount
  // useEffect(() => {
  //   async function loadUser() {
  //     try {
  //       const savedUser = await AsyncStorage.getItem('userInfo');
  //       if (savedUser) {
  //         setUserInfo(JSON.parse(savedUser));
  //       }
  //     } catch (e) {
  //       console.log('Failed to load user info:', e);
  //     }
  //   }
  //   loadUser();
  // }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      // 1. Sign in with Firebase
      await signInWithEmailAndPassword(auth, email, password);

      // 2. Fetch user info from Supabase
      const { data: userInfo, error: fetchError } = await supabase
        .from("tblUsers")
        .select("user_name, user_email, user_age, profile_image")
        .eq("user_email", email)
        .maybeSingle(); // returns null if no match

      if (fetchError) {
        console.error("Error fetching user info:", fetchError);
        setError("Could not fetch user info. Try again.");
        return;
      }

      if (!userInfo) {
        setError("User not found in database. Please sign up first.");
        return;
      }

      // Save user to global context
      setUser(userInfo);

      // 3. Redirect to MainTabs with Dashboard tab active
      navigation.replace("main", {
        screen: "Dashboard", //  tell MainTabs to open Dashboard tab
        params: { userInfo }, // pass the fetched user info
      });

    } catch (error: any) {
      setError(error.message || "An unexpected error occurred.");
    }
  };


  // Function to handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut(); // Force account chooser
      setLoading(true);

      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const userData = response.data;

        // Avatar list
        const avatars = [
          "https://robohash.org/user1.png",
          "https://robohash.org/user2.png",
          "https://robohash.org/user3.png",
          "https://api.dicebear.com/6.x/bottts/png?seed=avatar1",
          "https://api.dicebear.com/6.x/bottts/png?seed=avatar2",
          "https://api.dicebear.com/6.x/shapes/png?seed=avatar3",
          "https://api.dicebear.com/6.x/icons/png?seed=avatar4",
          "https://api.dicebear.com/6.x/fun-emoji/png?seed=avatar5"
        ];

        const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

        // Check if user already exists in Supabase
        const { data: existingUser, error: fetchError } = await supabase
          .from("tblUsers")
          .select("*")
          .eq("user_email", userData.user?.email)
          .maybeSingle();

        if (fetchError) {
          console.error("Error checking existing user:", fetchError);
          Alert.alert("An error occurred. Try again.");
          return;
        }

        let userToStore;

        if (!existingUser) {
          // User does not exist — insert
          const supabaseUserData = {
            user_name: userData.user?.name || "unknown",
            user_email: userData.user?.email || "unknown@example.com",
            user_age: 18, // default age
            profile_image: randomAvatar,
          };

          const { error: supabaseError, data: insertedUser } = await supabase
            .from("tblUsers")
            .insert([supabaseUserData])
            .select()
            .maybeSingle();

          if (supabaseError) {
            console.error("Supabase Insert Error:", supabaseError);
            Alert.alert("Could not save user details. Try again.");
            return;
          }

          userToStore = insertedUser;
        } else {
          userToStore = existingUser;
        }

        // ✅ Save verified user globally
        setUser(userToStore);

        // Redirect to Dashboard tab
        Alert.alert(
          "Login Successful",
          "You have successfully signed in.",
          [
            {
              text: "OK",
              onPress: () =>
                navigation.replace("main", {
                  screen: "Dashboard", // MainTabs dashboard tab
                }),
            },
          ],
          { cancelable: false }
        );
      } else {
        console.log("Login cancelled or failed:", response);
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            Alert.alert("Sign in is in progress");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert("Play services are not available");
            break;
          default:
            Alert.alert("An unknown error occurred");
        }
      } else {
        Alert.alert("An error occurred during sign in");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <LinearGradient
      colors={['#615fff', '#00a6f4', '#00bc7d']}
      className="flex-1 items-center justify-center"
      style={{ padding: 20 }}
    >
      {/* Logo */}
      <View className="w-32 h-32 rounded-full items-center justify-center mb-8 bg-white/20 shadow-lg">
        <Image source={require('../assets/Login.png')} className="w-24 h-24 rounded-full" />
      </View>

      {/* Form Container */}
      <View className="w-full max-w-md p-8 bg-white/90 rounded-2xl shadow-2xl">
        <Text className="text-4xl font-extrabold text-center mb-6" style={{ color: '#ffb86a' }}>
          Welcome Back</Text>
        {error ? <Text className="text-red-500 text-center mb-4">{error}</Text> : null}
        <View className="w-full mb-4">
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            className="border border-gray-300 p-4 mb-4 rounded-xl bg-white shadow-sm"
            placeholderTextColor="#A0AEC0"
          />

          <View className="flex-row items-center border border-gray-300 rounded-xl mb-4 px-2 bg-white shadow-sm">
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              className="flex-1 p-4"
              placeholderTextColor="#A0AEC0"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
            </TouchableOpacity>
          </View>

          <Pressable
            onPress={handleLogin}
            className="bg-blue-500 px-4 py-2 mt-4 rounded-lg shadow-lg"
            disabled={loading}
          >
            <Text className="text-white text-center text-lg font-large font-bold">
              {loading ? 'Loading...' : 'Login'}
            </Text>
          </Pressable>


          <TouchableOpacity
            style={{
              backgroundColor: '#4285F4', // Google blue
              paddingVertical: 8,
              borderRadius: 6,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 2, // Android shadow
              marginTop: 10
            }}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Image
              source={require('../assets/google.png')}
              className="w-8 h-8 rounded-full mr-2"
            />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              Sign in with Google
            </Text>
          </TouchableOpacity>



        </View>

        <View className="mt-4 flex-row justify-center">
          <Text className="text-gray-500">Don't have an account? </Text>
          <Pressable onPress={() => navigation.navigate('signin')}>
            <Text className="text-blue-500 font-semibold">Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
};

export default Login;
