import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Import all your screens and components
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ReportHazardScreen from './src/screens/ReportHazardScreen';
import ViewMapScreen from './src/screens/ViewMapScreen';
import MyReportsScreen from './src/screens/MyReportsScreen';
import MyProfileScreen from './src/screens/MyProfileScreen';
import AboutUsScreen from './src/screens/AboutUsScreen';
import ContactUsScreen from './src/screens/ContactUsScreen';
import DrawerContent from './src/components/DrawerContent';
import './src/translations/i18n';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// This Stack Navigator manages the screens that you can navigate to from the HomeScreen,
// allowing for a natural back-and-forth flow.
const MainStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="ReportHazard" component={ReportHazardScreen} />
    <Stack.Screen name="ViewMap" component={ViewMapScreen} />
  </Stack.Navigator>
);

// This is the main Drawer Navigator that contains all the screens accessible after login.
const AppDrawerNavigator = ({ user, onLogout }) => (
  <Drawer.Navigator
    initialRouteName="Main"
    screenOptions={{ headerShown: false }}
    drawerContent={props => <DrawerContent {...props} onLogout={onLogout} />}
  >
    {/* The 'Main' item in the drawer is our Stack Navigator */}
    <Drawer.Screen
      name="Main"
      component={MainStackNavigator}
      options={{ title: 'Home' }}
      initialParams={{ user: user }}
    />
    {/* The rest of the items are your individual screens */}
    <Drawer.Screen
      name="MyReports"
      component={MyReportsScreen}
      options={{ title: 'My Reports' }}
    />
     <Drawer.Screen
      name="ViewMapDrawer" // Renamed to avoid conflicts with the stack screen
      component={ViewMapScreen}
      options={{ title: 'View Map' }}
    />
    <Drawer.Screen
      name="MyProfile"
      component={MyProfileScreen}
      options={{ title: 'My Profile' }}
    />
    <Drawer.Screen
      name="AboutUs"
      component={AboutUsScreen}
      options={{ title: 'About Us' }}
    />
    <Drawer.Screen
      name="ContactUs"
      component={ContactUsScreen}
      options={{ title: 'Contact Us' }}
    />
  </Drawer.Navigator>
);

// This is the root component of your app
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleLoginSuccess = (user) => {
    setUserData(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUserData(null);
    setIsLoggedIn(false);
  };

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        // If logged in, show the full drawer navigator
        <AppDrawerNavigator user={userData} onLogout={handleLogout} />
      ) : (
        // If not logged in, only show the authentication screen
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </NavigationContainer>
  );
};

export default App;

