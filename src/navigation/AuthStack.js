
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AudioBridgeScreen from '../screens/AudioBridgeScreen';
import TextRoomScreen from '../screens/TextRoomScreen'
import CanvasScreen from '../screens/CanvasScreen';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AudioBridge" component={AudioBridgeScreen} />
      <Stack.Screen name="TextRoom" component={TextRoomScreen} />
      <Stack.Screen name="Canvas" component={CanvasScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
