import React, {useEffect, useState} from 'react';
import {StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import AdminLoginScreen from './screens/AdminLoginScreen';
import HomeScreen from '../scoringapp/screens/HomeScreen';
import HomeScreen1 from '../scoringapp/screens/HomeScreen1';
import ManageScreen from './screens/ManageScreen';

import SplashScreen from './screens/SplashScreenContent';
import LandingScreen from './screens/LandingScreen';
import Dashboard from './screens/Dashboard';
import UserLoginScreen from './screens/UserLoginScreen';
import ResultScreen1 from './screens/ResultScreen1';
import OverallResultScreen1 from './screens/OverallResultScreen1';
import ResultScreen2 from './screens/ResultScreen2';
import OverallResultScreen2 from './screens/OverallResultScreen2';
import ResultScreen3 from './screens/ResultScreen3';
import OverallResultScreen3 from './screens/OverallResultScreen3';
import ResultScreen4 from './screens/ResultScreen4';
import OverallResultScreen4 from './screens/OverallResultScreen4';
import CriteriaResultScreen1 from './screens/CriteriaResultScreen1';
import CriteriaResultScreen2 from './screens/CriteriaResultScreen2';
import CriteriaResultScreen3 from './screens/CriteriaResultScreen3';
import CriteriaResultScreen4 from './screens/CriteriaResultScreen4';
import ManageScreenTrussEvent from './screens/ManageScreenTrussEvent';



const Stack = createStackNavigator();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setShowSplash(false);
    }, 2000);
  }, []);

  return (
    <NavigationContainer>
      {showSplash ? (
        <SplashScreen />
      ) : (
        <Stack.Navigator initialRouteName="Landing">
          <Stack.Screen
            name="Landing"
            component={LandingScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="AdminLogin"
            component={AdminLoginScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="UserLogin"
            component={UserLoginScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{headerShown: false}}
          />
             <Stack.Screen
            name="Home1"
            component={HomeScreen1}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Dashboard"
            component={Dashboard}
            options={{headerShown: false}}
          />
       
          <Stack.Screen
            name="Manage"
            component={ManageScreen}
            options={{headerShown: false}}
          />
            <Stack.Screen
            name="ManageTrussEvent"
            component={ManageScreenTrussEvent}
            options={{headerShown: false}}
          />
              <Stack.Screen
            name="Result1"
            component={ResultScreen1}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="OverallResult1"
            component={OverallResultScreen1}
            options={{headerShown: false}}
          />
              <Stack.Screen
            name="Result2"
            component={ResultScreen2}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="OverallResult2"
            component={OverallResultScreen2}
            options={{headerShown: false}}
          />
              <Stack.Screen
            name="Result3"
            component={ResultScreen3}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="OverallResult3"
            component={OverallResultScreen3}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Result4"
            component={ResultScreen4}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="OverallResult4"
            component={OverallResultScreen4}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="CriteriaResult1"
            component={CriteriaResultScreen1}
            options={{headerShown: false}}
          />
            <Stack.Screen
            name="CriteriaResult2"
            component={CriteriaResultScreen2}
            options={{headerShown: false}}
          />
            <Stack.Screen
            name="CriteriaResult3"
            component={CriteriaResultScreen3}
            options={{headerShown: false}}
          />
            <Stack.Screen
            name="CriteriaResult4"
            component={CriteriaResultScreen4}
            options={{headerShown: false}}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 1000,
  },
});

export default App;
