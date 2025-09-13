import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// The 'props' are passed by the Drawer Navigator in App.tsx
const DrawerContent = (props) => {
  // We destructure onLogout from props to use it for the logout button
  const { state, onLogout } = props;
  // Get user data from the initial params of the first route (which is the Main Stack containing HomeScreen)
  const user = state.routes[0]?.params?.user;

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        {/* Themed Header */}
        <View style={styles.header}>
          <Icon name="waves" size={40} color="#FFFFFF" />
          <Text style={styles.title}>OceanAlly</Text>
          {/* Display user's email if available */}
          {user && <Text style={styles.email}>{user.email}</Text>}
        </View>
        {/* This renders the standard list of screens defined in App.tsx */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Themed Logout Button at the bottom */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Icon name="logout" size={22} color="#B00020" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: '#005A9C', // Matches the app's primary theme color
    marginBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  email: {
    color: '#E0F7FA', // A lighter text color for the email
    fontSize: 14,
  },
  footer: {
    borderTopColor: '#f4f4f4',
    borderTopWidth: 1,
    padding: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#B00020', // A distinct red color for logout
  },
});

export default DrawerContent;

