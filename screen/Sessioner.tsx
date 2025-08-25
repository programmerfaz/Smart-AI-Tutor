import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import "../global.css";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { AVPlaybackStatus, AVPlaybackStatusSuccess } from "expo-av";
import Ionicons from 'react-native-vector-icons/Ionicons'


const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;

const Sessioner = () => {
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  // Audio playback state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);


  useEffect(() => {
    let soundObj: Audio.Sound | null = null;

    const loadSound = async () => {
      if (audioUri) {
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
        soundObj = sound;
        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
          if ("didJustFinish" in status && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    };

    loadSound();

    // cleanup when audioUri changes or component unmounts
    return () => {
      if (soundObj) {
        soundObj.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [audioUri]);

  // ---------- TEXT → SUMMARY ----------
  const handleGenerate = async (customText?: string) => {
    const textToProcess = customText || inputText;
    if (!textToProcess.trim()) return;

    setLoading(true);
    setTranscript(textToProcess);
    setSummary("");
    setNotes("");

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an assistant that processes lecture text. Generate:\n1. A concise summary.\n2. Extract key announcements. Format:\nSummary: <summary>\nKey Announcements:\n- <item>. Avoid any additional commentary. Donot answer if text is irrelevant.",
            },
            { role: "user", content: textToProcess },
          ],
        }),
      });

      const data = await response.json();
      if (data?.choices?.[0]?.message?.content) {
        const output = data.choices[0].message.content;
        const [genSummary, genNotes] = output.split("Key Announcements:");
        setSummary(genSummary?.replace("Summary:", "").trim() || "No summary found.");
        setNotes(genNotes?.trim() || "No announcements found.");
      } else {
        setSummary("Error: No response from AI.");
        setNotes("Error: No response from AI.");
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
      setSummary("Failed to fetch AI summary.");
      setNotes("Failed to fetch key announcements.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- AUDIO → TEXT ----------
  const handleAudioToText = async (uri: string) => {
    if (!uri) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: "audio.mp3",
        type: "audio/mpeg",
      } as any);
      formData.append("model", "whisper-1");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data?.text) {
        setTranscript(data.text); // reuse NLP pipeline
      } else {
        setTranscript("Error transcribing audio.");
      }
    } catch (err) {
      console.error("Audio upload error:", err);
      setTranscript("Failed to process audio.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- FILE PICKER ----------
  const pickAudioFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
    });

    if (result.canceled) {
      console.log("User cancelled picking audio");
      return;
    }

    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0]?.uri;
      if (uri) {
        setAudioUri(uri);
        await handleAudioToText(uri);
      }
    }
  };

  // ---------- LIVE RECORDING ----------
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.warn("Recording permission not granted");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      if (recording) {
        setRecording(recording);
      }
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        setAudioUri(uri);
        await handleAudioToText(uri);
      }
    } catch (err) {
      console.error("Stop recording error:", err);
    }
  };

  // ---------- AUDIO PREVIEW ----------
  const playPauseAudio = async () => {
    if (!soundRef.current) return;

    const status: AVPlaybackStatus = await soundRef.current.getStatusAsync();

    if ("isLoaded" in status && status.isLoaded) {
      if (isPlaying) {
        // Pause
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        // If audio finished, restart from beginning
        if (
          status.positionMillis !== undefined &&
          status.durationMillis !== undefined &&
          status.positionMillis >= status.durationMillis
        ) {
          await soundRef.current.setPositionAsync(0);
        }
        // Play or resume
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } else {
      console.warn("Audio not loaded or error in status");
    }
  };



  // ---------- DOWNLOAD AUDIO ----------
  const downloadAudio = async () => {
    if (!audioUri) return;

    try {
      const fileName = `session_audio_${Date.now()}.mp3`;
      const destPath = FileSystem.documentDirectory + fileName;

      // Copy audio file into app's document directory
      await FileSystem.copyAsync({
        from: audioUri,
        to: destPath,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(destPath); // open native share/download sheet
      } else {
        alert(`Audio saved at: ${destPath}`);
      }
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 px-5">
      {/* Header */}
      <View className="items-center mt-6 mb-6">
        <Text className="text-3xl font-extrabold text-gray-900">
          AI Sessions
        </Text>
        <Text className="text-sm text-gray-500 mt-1">
          Enter text, upload audio, or record live
        </Text>
      </View>

      {/* Text Input */}
      <View className="bg-white p-6 rounded-2xl shadow-sm mb-6">
        <Text className="text-lg font-semibold text-center text-blue-600 mb-3">
          Paste notes for a quick AI summary
        </Text>
        <TextInput
          multiline
          placeholder="Paste your lecture notes here..."
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={setInputText}
          className="border border-gray-300 rounded-xl p-4 bg-gray-50 h-32 text-gray-800"
          textAlignVertical="top"
        />
        <TouchableOpacity
          onPress={() => handleGenerate()}
          className={`p-3 rounded-xl mt-5 ${loading ? "bg-blue-300" : "bg-blue-600"
            }`}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold text-base">
            {loading ? "Generating..." : "Generate"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Audio Upload + Recording */}
      <View className="bg-white p-6 rounded-2xl shadow-sm mb-6">
        <Text className="text-lg font-semibold text-center text-yellow-600 mb-3">
          Audio Options
        </Text>

        {/* Upload Audio */}
        <TouchableOpacity
          onPress={pickAudioFile}
          className="bg-yellow-500 p-3 rounded-xl mb-3"
        >
          <Text className="text-white text-center font-semibold">
            Upload Audio File
          </Text>
        </TouchableOpacity>

        {/* Recording */}
        {recording ? (
          <TouchableOpacity
            onPress={stopRecording}
            className="bg-red-500 p-3 rounded-xl mb-3"
          >
            <Text className="text-white text-center font-semibold">
              Stop Recording
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={startRecording}
            className="bg-green-500 p-3 rounded-xl mb-3"
          >
            <Text className="text-white text-center font-semibold">
              Start Recording
            </Text>
          </TouchableOpacity>
        )}

        {/* Audio Preview + Control Buttons */}
        {audioUri && (
          <View className="mt-6">
            {/* Control Buttons */}
            <View className="flex-row justify-between items-center px-6">
              {/* Play / Pause */}
              <TouchableOpacity
                onPress={playPauseAudio}
                className={`flex-1 mx-2 p-4 rounded-2xl items-center ${isPlaying ? "bg-gray-500" : "bg-indigo-600"
                  }`}
              >
                <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="white" />
              </TouchableOpacity>

              {/* Generate */}
              <TouchableOpacity
                onPress={() => {
                  if (transcript) handleGenerate(transcript);
                }}
                className="flex-1 mx-2 p-4 rounded-2xl bg-green-500 items-center"
              >
                <Ionicons name="sparkles" size={28} color="white" />
              </TouchableOpacity>

              {/* Delete */}
              <TouchableOpacity
                onPress={() => {
                  setAudioUri(null);
                  setTranscript("");
                  setSummary("");
                  setNotes("");
                  if (soundRef.current) {
                    soundRef.current.unloadAsync();
                    soundRef.current = null;
                  }
                }}
                className="flex-1 mx-2 p-4 rounded-2xl bg-red-500 items-center"
              >
                <Ionicons name="trash" size={28} color="white" />
              </TouchableOpacity>
            </View>

            {/* Helper Label */}
            <Text className="text-center text-sm text-gray-600 mt-4">
              File uploaded Successfully — Tap{" "}
              <Text className="font-semibold text-green-600">Generate</Text> to get AI summary & announcements.
            </Text>
          </View>
        )}

      </View>



      {/* Transcript */}
      <View className="bg-white p-5 rounded-2xl shadow-sm mb-5">
        <Text className="text-blue-600 font-semibold mb-2 text-lg">
          Smart Transcript
        </Text>
        <Text className="text-gray-700 leading-relaxed">
          {transcript || "Transcript will appear here..."}
        </Text>
      </View>

      {/* Summary */}
      <View className="bg-white p-5 rounded-2xl shadow-sm mb-5">
        <Text className="text-purple-600 font-semibold mb-2 text-lg">
          AI Summary
        </Text>
        {loading ? (
          <ActivityIndicator color="purple" />
        ) : (
          <Text className="text-gray-700 leading-relaxed">
            {summary || "Summary will appear here..."}
          </Text>
        )}
      </View>

      {/* Notes */}
      <View className="bg-white p-5 rounded-2xl shadow-sm mb-8">
        <Text className="text-green-600 font-semibold mb-3 text-lg">
          Key Announcements
        </Text>
        {loading ? (
          <ActivityIndicator color="green" />
        ) : (
          <Text className="text-gray-700 leading-relaxed">
            {notes || "Important notes will appear here..."}
          </Text>
        )}
      </View>
    </ScrollView>
  );

};

export default Sessioner;
