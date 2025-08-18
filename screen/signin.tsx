import { View, Text, Button } from 'react-native';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'react-native';
import { TouchableOpacity, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Import your Firebase config
import "../global.css"; // Ensure global styles are imported
import { Alert } from 'react-native';
import { supabase } from '../supabaseClient';
import { GoogleSignin, statusCodes, isSuccessResponse, isErrorWithCode } from '@react-native-google-signin/google-signin';
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

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



const Signin = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const { setUser } = useContext(UserContext);


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

  const handleLogin = async () => {
    if (!email || !password || !name) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      // 1. Create Firebase auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Check if user already exists in Supabase
      const { data: existingUser, error: fetchError } = await supabase
        .from("tblUsers")
        .select("*")
        .eq("user_email", email)
        .maybeSingle(); // returns null if no match

      if (fetchError) {
        console.error("Error checking existing user:", fetchError);
        setError("An error occurred. Try again.");
        return;
      }

      if (existingUser) {
        Alert.alert("User already exists. Please log in.");
        return;
      }

      // 3. Avatar list
      const avatars = [
        "https://robohash.org/user1.png",
        "https://robohash.org/user2.png",
        "https://robohash.org/user3.png",
        "https://api.dicebear.com/6.x/bottts/png?seed=avatar1",  // 👈 PNG not SVG
        "https://api.dicebear.com/6.x/bottts/png?seed=avatar2",
        "https://api.dicebear.com/6.x/shapes/png?seed=avatar3",
        "https://api.dicebear.com/6.x/icons/png?seed=avatar4",
        "https://api.dicebear.com/6.x/fun-emoji/png?seed=avatar5"
      ];

      const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

      // 4. Prepare user data for Supabase
      const userData = {
        user_name: name,
        user_age: age && age.trim() !== "" ? parseInt(age, 10) : 18,
        user_email: email,
        profile_image: randomAvatar,
      };

      // 5. Insert into Supabase
      const { error: supabaseError } = await supabase
        .from("tblUsers")
        .insert([userData]);

      if (supabaseError) {
        console.error("Supabase Insert Error:", supabaseError);
        setError("Could not save user details. Try again.");
        return;
      }

      // 6. Redirect after success
      Alert.alert("Sign up successful! Please log in.");
      navigation.replace("login");

    } catch (error) {
      if (typeof error === 'object' && error !== null && 'message' in error) {
        setError((error as { message: string }).message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };



  const handleEmailChange = (text: string) => {
    setEmail(text);

    // Basic email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (text === '' || emailRegex.test(text)) {
      setError(''); // valid email or empty
    } else {
      setError('Invalid email address');
    }
  };

  const matchConfirmPassword = (text: string) => {
    setConfirmPassword(text);
    if (text !== password) {
      setError('Confirm Passwords does not match with Password');
    } else {
      setError('');
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
        <Text className="text-3xl font-extrabold text-center mb-6" style={{ color: '#ffb86a' }}>
          Sign in for best AI Tutor</Text>
        {error ? <Text className="text-red-500 text-center mb-4">{error}</Text> : null}
        <View className="w-full mb-4">
          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            keyboardType="default"
            autoCapitalize="none"
            maxLength={20}
            className="border border-gray-300 p-4 mb-4 rounded-xl bg-white shadow-sm"
            placeholderTextColor="#A0AEC0"
          />

          <TextInput
            placeholder="Age"
            value={age}
            onChangeText={(text) => {
              // Only allow numbers
              const numericText = text.replace(/[^0-9]/g, '');
              setAge(numericText);
            }}
            keyboardType="numeric"
            autoCapitalize="none"
            maxLength={2}
            className="border border-gray-300 p-4 mb-4 rounded-xl bg-white shadow-sm"
            placeholderTextColor="#A0AEC0"
          />

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={handleEmailChange}
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

          <View className="flex-row items-center border border-gray-300 rounded-xl mb-4 px-2 bg-white shadow-sm">
            <TextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={matchConfirmPassword}
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
            className={`px-4 py-2 mt-4 rounded-lg shadow-lg ${error || email === '' || password === '' || confirmPassword === '' ? 'bg-gray-400' : 'bg-blue-500'
              }`}
            disabled={!!error || email === '' || password === '' || confirmPassword === '' || loading}
          >
            <Text className="text-white text-center text-lg font-bold">
              {loading ? 'Loading...' : 'Sign In'}
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
          <Text className="text-gray-500">Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate('login')}>
            <Text className="text-blue-500 font-semibold">Log In</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient >
  );
};

export default Signin;