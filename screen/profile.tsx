import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Switch, LayoutAnimation, Platform, UIManager, TextInput } from 'react-native';
import { UserContext } from "../context/UserContext";
import "../global.css";
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../supabaseClient';

type RootStackParamList = {
  splash: undefined;
  login: undefined;
  signin: undefined;
  dashboard: { userInfo: any };
  main: { screen?: string; params?: any };
};

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Profile = () => {

  const { user, setUser } = useContext(UserContext);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // States
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);


  const [accountOpen, setAccountOpen] = useState(false);
  const [name, setName] = useState(user?.user_name || "");
  const [age, setAge] = useState(user?.user_age?.toString() || "");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [major, setMajor] = useState("");
  const [loadingAccount, setLoadingAccount] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user) return;

      setLoadingAccount(true);
      try {
        // Get userID from tblUsers
        const { data: userRecord, error: userError } = await supabase
          .from("tblUsers")
          .select("userID")
          .eq("user_email", user.user_email)
          .maybeSingle();

        if (userError || !userRecord) {
          console.error("User ID fetch error:", userError);
          return;
        }

        const userIdFetch = typeof userRecord.userID === "string"
          ? parseInt(userRecord.userID, 10)
          : userRecord.userID;

        // const userIdFetch = userRecord.userID; // no parseInt

        // Fetch details from tblUserDetails
        const { data: details, error: detailsError } = await supabase
          .from("tblUserDetails")
          .select("phone, gender, major")
          .eq("user_id", userIdFetch)
          .maybeSingle();

        // console.log("User details fetched:", details);

        if (detailsError) {
          console.error("Details fetch error:", detailsError);
          return;
        }

        if (details) {
          setPhone(details.phone?.toString() || "");
          setGender(details.gender || "");
          setMajor(details.major || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAccount(false);
      }
    };

    fetchUserDetails();
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    navigation.navigate("login");
  };

  const togglePrivacy = () => {
    LayoutAnimation.easeInEaseOut();
    setPrivacyOpen(!privacyOpen);
  };

  const toggleHelp = () => {
    LayoutAnimation.easeInEaseOut();
    setHelpOpen(!helpOpen);
  };

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-lg text-gray-700">Loading profile...</Text>
      </View>
    );
  }




  const toggleAccount = async () => {
    LayoutAnimation.easeInEaseOut();
    setAccountOpen(!accountOpen);
  };

  const handleSaveAccount = async () => {
    setLoadingAccount(true);

    try {
      // 1. Validate inputs
      if (!name || !age || isNaN(Number(age))) {
        alert("Please enter a valid name and age.");
        setLoadingAccount(false);
        return;
      }

      if (phone && !/^\+?\d{7,15}$/.test(phone)) {
        alert("Please enter a valid phone number.");
        setLoadingAccount(false);
        return;
      }

      // 2. Get userID from tblUsers
      const { data: userRecord, error: userError } = await supabase
        .from("tblUsers")
        .select("userID")
        .eq("user_email", user.user_email)
        .maybeSingle();

      if (userError) {
        console.error("Error fetching user ID:", userError);
        setLoadingAccount(false);
        return;
      }

      if (!userRecord) {
        alert("User not found.");
        setLoadingAccount(false);
        return;
      }

      const userId = typeof userRecord.userID === "string"
        ? parseInt(userRecord.userID, 10)
        : userRecord.userID;

      // 3. Upsert details into tblUserDetails
      const { error: detailsError } = await supabase
        .from("tblUserDetails")
        .upsert(
          {
            user_id: userId,
            phone: phone || null,
            gender: gender || null,
            major: major || null,
          },
          { onConflict: "user_id" }
        );

      if (detailsError) {
        console.error("Error saving user details:", detailsError);
        setLoadingAccount(false);
        return;
      }

      // 4. Update name & age in tblUsers
      const { error: updateError } = await supabase
        .from("tblUsers")
        .update({
          user_name: name,
          user_age: Number(age),
        })
        .eq("userID", userId);

      if (updateError) {
        console.error("Error updating user info:", updateError);
        setLoadingAccount(false);
        return;
      }

      // 5. Update global context
      setUser({
        ...user,
        user_name: name,
        user_age: Number(age),
      });

      alert("Account details saved!");
      setLoadingAccount(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      setLoadingAccount(false);
      alert("An unexpected error occurred. Please try again.");
    }
  };





  return (
    <ScrollView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-indigo-600 rounded-b-3xl p-6 shadow-md items-center">
        {/* Profile Image with border */}
        <View className="border-4 border-white rounded-full p-1">
          <Image
            source={{ uri: user.profile_image }}
            className="w-24 h-24 rounded-full bg-white"
          />
        </View>

        {/* Name */}
        <Text className="text-2xl font-bold text-white mt-4 text-center">{name || user.user_name}</Text>

        {/* Email */}
        <Text className="text-sm text-gray-200 mt-1 text-center">{user.user_email}</Text>

        {/* Divider */}
        <View className="w-20 h-0.5 bg-white opacity-40 mt-3 mb-3 rounded-full" />

        {/* Details badges (without major) */}
        <View className="flex-row justify-center flex-wrap gap-3">
          {gender ? (
            <View className="bg-indigo-500/70 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-semibold text-center">Gender: {gender}</Text>
            </View>
          ) : null}
          {phone ? (
            <View className="bg-indigo-500/70 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-semibold text-center">Phone: {phone}</Text>
            </View>
          ) : null}
        </View>

        {/* Dynamic tagline based on major */}
        {major ? (
          <Text className="text-sm text-indigo-100 mt-3 text-center">
            {major.toUpperCase()} Student
          </Text>
        ) : (
          <Text className="text-sm text-indigo-100 mt-3 text-center">
            Student
          </Text>
        )}
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

      {/* Account Settings */}
      <TouchableOpacity onPress={toggleAccount}>
        <View className="bg-white p-4 mx-3 mt-3 rounded-2xl shadow flex-row justify-between items-center">
          <Text className="text-sm font-medium text-gray-800">Account Settings</Text>
        </View>
      </TouchableOpacity>

      {accountOpen && (
        <View className="bg-gray-50 mx-3 mb-2 px-4 py-3 rounded-2xl">
          {loadingAccount ? (
            <Text className="text-xs text-gray-600">Loading...</Text>
          ) : (
            <>
              <Text className="text-xs text-gray-600 mt-1">Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                className="border border-gray-300 rounded p-2 mb-2"
              />
              <Text className="text-xs text-gray-600 mt-1">Age</Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                className="border border-gray-300 rounded p-2 mb-2"
              />
              <Text className="text-xs text-gray-600 mt-1">Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="numeric"
                className="border border-gray-300 rounded p-2 mb-2"
              />
              <Text className="text-xs text-gray-600 mt-1">Gender</Text>
              <TextInput
                value={gender}
                onChangeText={setGender}
                className="border border-gray-300 rounded p-2 mb-2"
              />
              <Text className="text-xs text-gray-600 mt-1">Major</Text>
              <TextInput
                value={major}
                onChangeText={setMajor}
                className="border border-gray-300 rounded p-2 mb-2"
              />

              <TouchableOpacity
                onPress={handleSaveAccount}
                className="bg-indigo-500 mt-3 py-2 rounded items-center"
              >
                <Text className="text-white font-bold">Save</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}


      {/* Notifications */}
      <View className="bg-white p-4 mx-3 mt-2 rounded-2xl shadow flex-row justify-between items-center">
        <Text className="text-sm font-medium text-gray-800">Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />
      </View>

      {/* Privacy & Security */}
      <TouchableOpacity onPress={togglePrivacy}>
        <View className="bg-white p-4 mx-3 mt-2 rounded-2xl shadow flex-row justify-between items-center">
          <Text className="text-sm font-medium text-gray-800">Privacy & Security</Text>
        </View>
      </TouchableOpacity>
      {privacyOpen && (
        <View className="bg-gray-50 mx-3 mb-2 px-4 py-3 rounded-2xl">
          <Text className="text-xs text-gray-600">
            Your data is securely stored and never shared with third parties.
            Manage permissions and app access from here.
          </Text>
        </View>
      )}

      {/* Help & Support */}
      <TouchableOpacity onPress={toggleHelp}>
        <View className="bg-white p-4 mx-3 mt-2 rounded-2xl shadow flex-row justify-between items-center">
          <Text className="text-sm font-medium text-gray-800">Help & Support</Text>
        </View>
      </TouchableOpacity>
      {helpOpen && (
        <View className="bg-gray-50 mx-3 mb-2 px-4 py-3 rounded-2xl">
          <Text className="text-xs text-gray-600 mb-2">
            Need help? Check our FAQ section or contact support at support@example.com.
          </Text>
          <Text className="text-xs text-gray-600 font-semibold mb-1">
            Developer Contact:
          </Text>
          <Text className="text-xs text-gray-600">Name: Fazil Shahbaz</Text>
          <Text className="text-xs text-gray-600">Email: fazilmohd456@gmail.com</Text>
        </View>
      )}


      {/* Study Reminders */}
      <View className="bg-white p-4 mx-3 mt-2 rounded-2xl shadow flex-row justify-between items-center">
        <Text className="text-sm font-medium text-gray-800">Study Reminders</Text>
        <Switch
          value={remindersEnabled}
          onValueChange={setRemindersEnabled}
        />
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
