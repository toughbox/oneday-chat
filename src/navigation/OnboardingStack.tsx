import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import NicknameScreen from '../screens/onboarding/NicknameScreen';
import TutorialScreen from '../screens/onboarding/TutorialScreen';
import TermsScreen from '../screens/onboarding/TermsScreen';
import PermissionsScreen from '../screens/onboarding/PermissionsScreen';

export type OnboardingStackParamList = {
  Welcome: undefined;
  Nickname: undefined;
  Tutorial: undefined;
  Terms: undefined;
  Permissions: undefined;
};

const Stack = createStackNavigator<OnboardingStackParamList>();

const OnboardingStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Nickname" component={NicknameScreen} />
      <Stack.Screen name="Tutorial" component={TutorialScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingStack;
