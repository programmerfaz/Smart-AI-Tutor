import React, { useContext } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { UserContext } from "../context/UserContext";
import "../global.css";

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';


type RootStackParamList = {
  splash: undefined;
  login: undefined;
  signin: undefined;
  dashboard: {
    userInfo: any;  // your user info type here
  };
  main: { screen?: string; params?: any };
};

const Profile = () => {
  const { user, setUser } = useContext(UserContext);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogout = () => {
    // Clear user context
    setUser(null);

    // Navigate to login screen
    navigation.navigate("login"); // navigate to Login screen
  };

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-lg text-gray-700">Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="items-center bg-indigo-500 rounded-b-2xl p-6">
        <Image source={{ uri: user.profile_image }} className="w-20 h-20 rounded-full bg-white mb-3" />
        <Text className="text-xl font-bold text-white">{user.user_name}</Text>
        <Text className="text-sm text-gray-200">{user.user_email}</Text>
        <Text className="text-sm text-gray-300 mt-1">Computer Science Student</Text>
      </View>

      {/* Stats */}
      <View className="flex-row justify-around py-4 bg-white mx-4 mt-4 rounded-2xl shadow">
        <View className="items-center">
          <Text className="text-lg font-bold text-gray-800">127</Text>
          <Text className="text-xs text-gray-500">Sessions</Text>
        </View>
        <View className="items-center">
          <Text className="text-lg font-bold text-gray-800">23</Text>
          <Text className="text-xs text-gray-500">Quizzes</Text>
        </View>
        <View className="items-center">
          <Text className="text-lg font-bold text-gray-800">87%</Text>
          <Text className="text-xs text-gray-500">Avg Score</Text>
        </View>
        <View className="items-center">
          <Text className="text-lg font-bold text-gray-800">47</Text>
          <Text className="text-xs text-gray-500">Study Days</Text>
        </View>
      </View>

      {/* Achievements */}
      <Text className="text-base font-bold mt-6 ml-5">Recent Achievements</Text>
      <View className="bg-white p-4 m-3 rounded-2xl shadow">
        <Text className="text-sm font-bold">🏆 Quiz Master</Text>
        <Text className="text-xs text-gray-500">Completed 20+ quizzes</Text>
      </View>
      <View className="bg-white p-4 m-3 rounded-2xl shadow">
        <Text className="text-sm font-bold">👑 Group Leader</Text>
        <Text className="text-xs text-gray-500">Led 5+ study groups</Text>
      </View>
      <View className="bg-white p-4 m-3 rounded-2xl shadow">
        <Text className="text-sm font-bold">🎯 Consistent Learner</Text>
        <Text className="text-xs text-gray-500">30-day study streak</Text>
      </View>

      {/* Settings */}
      <Text className="text-base font-bold mt-6 ml-5">Settings</Text>
      <View className="bg-white p-4 mx-3 mt-3 rounded-2xl shadow flex-row justify-between items-center">
        <Text className="text-sm font-medium text-gray-800">Account Settings</Text>
      </View>
      <View className="bg-white p-4 mx-3 mt-2 rounded-2xl shadow flex-row justify-between items-center">
        <Text className="text-sm font-medium text-gray-800">Notifications</Text>
        <Switch value={true} />
      </View>
      <View className="bg-white p-4 mx-3 mt-2 rounded-2xl shadow flex-row justify-between items-center">
        <Text className="text-sm font-medium text-gray-800">Privacy & Security</Text>
      </View>
      <View className="bg-white p-4 mx-3 mt-2 rounded-2xl shadow flex-row justify-between items-center">
        <Text className="text-sm font-medium text-gray-800">Help & Support</Text>
      </View>
      <View className="bg-white p-4 mx-3 mt-2 rounded-2xl shadow flex-row justify-between items-center">
        <Text className="text-sm font-medium text-gray-800">Study Reminders</Text>
        <Switch value={true} />
      </View>


      {/* Logout */}
      <TouchableOpacity
        onPress={handleLogout}
        className="bg-red-500 mx-10 my-6 py-3 rounded-2xl items-center shadow"
      >
        <Text className="text-white font-bold">Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Profile;
