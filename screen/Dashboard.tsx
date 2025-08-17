import { Text, View, Image } from 'react-native';
import React, { useState } from 'react';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, RouteProp } from '@react-navigation/native';
import "../global.css"; // Ensure global styles are imported
import { supabase } from '../supabaseClient';
import { User } from '@react-native-google-signin/google-signin';
import { ScrollView } from 'react-native-gesture-handler';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


type RootStackParamList = {
  dashboard: {
    userInfo: any; // Can be Supabase row OR Google response
  };
};

type SupabaseUser = {
  user_email: string;
  user_name: string;
  user_age?: number;
  profile_image?: string;
};

const Dashboard = () => {

  const [dbUser, setDbUser] = useState<SupabaseUser | null>(null);
  const route = useRoute<RouteProp<RootStackParamList, 'dashboard'>>();
  const { userInfo } = route.params;

  useEffect(() => {
    const resolveUser = async () => {

      // Case 1: userInfo already contains a Supabase row (email/password login)
      if (userInfo?.user_email) {
        setDbUser(userInfo);
        return;
      }

      // Case 2: userInfo is Google response → fetch from Supabase
      const email = userInfo?.user?.email;
      if (!email) return;

      try {
        const { data, error } = await supabase
          .from("tblUsers")
          .select("*")
          .eq("user_email", email)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user:", error);
        } else {
          setDbUser(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    resolveUser();
  }, [userInfo]); // runs whenever userInfo changes


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#615fff', '#00a6f4', '#00bc7d']}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <ScrollView contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
          <View className="p-4 bg-white rounded-xl shadow" style={{ width: '90%' }}>
            {dbUser ? (
              <>
                <Text className="text-lg font-bold">
                  Welcome, {dbUser.user_name}
                </Text>
                <Text>Email: {dbUser.user_email}</Text>
                <Text>Name: {dbUser.user_name}</Text>
                <Text>Age: {dbUser.user_age ?? 'N/A'}</Text>
                {dbUser.profile_image && (
                  <Image
                    source={{ uri: dbUser.profile_image }}
                    style={{ width: 100, height: 100, borderRadius: 50, marginTop: 10 }}
                  />
                )}
              </>
            ) : (
              <Text>Loading user data</Text>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </GestureHandlerRootView>
  );

};

export default Dashboard;
