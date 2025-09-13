import React from 'react';
import { SafeAreaView, StyleSheet, View, StatusBar, Platform } from 'react-native';
import { Provider as PaperProvider, DefaultTheme, Appbar } from 'react-native-paper';
import MapView, { UrlTile } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import LanguagePicker from '../components/LanguagePicker';

// --- THEME (Consistent with other screens) ---
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#005A9C',
    accent: '#00BFFF',
    background: '#F6F8FA',
    surface: '#FFFFFF',
    text: '#212121',
  },
};

const ViewMapScreen = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
          <Appbar.Content title="OceanAlly" subtitle={t('view_map')} />
        </Appbar.Header>

        <View style={styles.container}>
          <MapView
            style={styles.map}
            // Initial region is centered to show India and its ocean areas
            initialRegion={{
              latitude: 20.5937,  // Center of India
              longitude: 78.9629,
              latitudeDelta: 30, // Zoom level for latitude
              longitudeDelta: 30, // Zoom level for longitude
            }}
          >
            {/* This component fetches map tiles from the free OpenStreetMap service */}
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
            />
          </MapView>
          {/* We place the language picker in an overlay view on top of the map */}
          <View style={styles.languagePickerOverlay}>
            <LanguagePicker />
          </View>
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.surface },
  container: { flex: 1 },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  languagePickerOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1, // Ensures it's on top of the map
  },
});

export default ViewMapScreen;
