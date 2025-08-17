import { initializeAuth, getReactNativePersistence, inMemoryPersistence } from 'firebase/auth';
import {getAuth} from "firebase/auth";
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyC59gKkfK3VEsvERjeBk2310ICY2GLMwF8",
  authDomain: "ai-tutor-818e8.firebaseapp.com",
  projectId: "ai-tutor-818e8",
  storageBucket: "ai-tutor-818e8.firebasestorage.app",
  messagingSenderId: "117568961448",
  appId: "1:117568961448:web:4176320d50614d53657b9d"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: inMemoryPersistence
});

//IOS: 804635480634-ef50hvkq9v66ckk4b46ul4lsqerqqhqg.apps.googleusercontent.com

//android: 804635480634-ls9e21346ie1bgfqrvccn6o5c7mmp7bd.apps.googleusercontent.com