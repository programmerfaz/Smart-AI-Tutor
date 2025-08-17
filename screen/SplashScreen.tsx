import "../global.css";
import React,{useEffect} from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "react-native";
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  splash: undefined;
  login: undefined;
  signin: undefined;
  dashboard: undefined;
};

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'splash'>;
import * as AuthSession from 'expo-auth-session';

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'myexpoapp',
});


const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('login'); // navigates to login.tsx
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#615fff', '#00a6f4', '#00bc7d']}
      className="flex-1 items-center justify-center"
    >
      <View className="flex-1 items-center justify-center align-items-space-between flex-col">

        <View className="mb-10">
          <LinearGradient
            colors={['#ffdf20', '#e17100', '#ffb86a']}
            style={{ borderRadius: 70 }}
          >
            <View className="w-40 h-40 rounded-full items-center justify-center ">
              <Image
                source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcST2P_xIt9g9c-wyEGSsYFIEo-JhbM_r07qaQ&s' }}
                className="w-28 h-28 rounded-full"
              />
            </View>
          </LinearGradient>
        </View>

        <View>
          <Text className="text-white text-4xl font-extrabold mb-4">Smart AI Tutor</Text>
        </View>
        <View>
          <Text className="text-yellow-300 text-xl m-4 text-center font-bold">-Track your Performance  - Personalised Learning - Smart Insights </Text>
        </View>
        <View>
          <Text className="text-white font-bold text-2xl mb-4">Intelligent Learning assistant </Text>
        </View>

        <View className="mb-10 mt-20">
          <Text className="text-white text-xl font-extrabold mb-4 text-center">Loading ...</Text>
          <ActivityIndicator size="large" color="#f4ad08ff" className="mb-4" />
          <Text className="text-white">Please wait a moment</Text>

        </View>

        <View className="align-self-bottom">
          <Text className="text-white text-3xl font-extrabold">Powered by Faz</Text>
        </View>

      </View>
    </LinearGradient>

    // 
  );
};

export default SplashScreen;