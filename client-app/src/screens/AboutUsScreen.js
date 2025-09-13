import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';

const AboutUsScreen = ({ navigation }) => (
  <>
    <Appbar.Header>
      <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
      <Appbar.Content title="About Us" />
    </Appbar.Header>
    <View style={styles.container}>
      <Text>About Us Screen</Text>
    </View>
  </>
);

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' }});
export default AboutUsScreen;
