import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import ReportScreen from "./src/screens/ReportScreen";
import MyReportsScreen from "./src/screens/MyReportsScreen";
import MapScreen from "./src/screens/MapScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Report" component={ReportScreen} />
        <Tab.Screen name="My Reports" component={MyReportsScreen} />
        <Tab.Screen name="Map" component={MapScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
