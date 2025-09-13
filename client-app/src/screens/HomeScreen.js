import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Provider as PaperProvider,
  DefaultTheme,
  Appbar, // Added Appbar for the header
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Path } from 'react-native-svg';

// --- THEME (Consistent with other screens) ---
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#005A9C',
    accent: '#00BFFF',
    background: '#F0F8FF',
    surface: '#FFFFFF',
    text: '#212121',
  },
};

// --- WAVY BACKGROUND ---
const WaveBackground = () => (
  <View style={styles.waveContainer}>
    <Svg height="100%" width="100%" viewBox="0 0 1440 320" style={styles.wave}>
      <Path fill={theme.colors.primary} fillOpacity="0.1" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,186.7C960,213,1056,235,1152,218.7C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
      <Path fill={theme.colors.primary} fillOpacity="0.2" d="M0,224L48,208C96,192,192,160,288,170.7C384,181,480,235,576,250.7C672,267,768,245,864,213.3C960,181,1056,139,1152,128C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
    </Svg>
  </View>
);

// The 'navigation' and 'route' props are passed by the navigators
const HomeScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  // Get user data passed from App.tsx after login
  const user = route.params?.user || { userType: 'citizen' };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
        {/* This App Bar provides the header and the hamburger menu icon */}
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
          <Appbar.Content title="OceanAlly" subtitle="Home" />
        </Appbar.Header>

        <WaveBackground />

        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('welcome_user', { userType: t(user.userType) })}</Text>
            <Text style={styles.subtitle}>{t('what_to_do')}</Text>
          </View>

          {/* --- View Map Button (Flashy & Attractive) --- */}
          <TouchableOpacity
            style={styles.flashyCardContainer}
            onPress={() => navigation.navigate('Map')}
          >
            <LinearGradient
              colors={['#00BFFF', '#1E90FF', '#005A9C']}
              style={styles.flashyGradient}
            >
              <View style={styles.flashyContent}>
                <Icon name="map-search" size={60} color="#FFFFFF" />
                <Text style={styles.flashyTitle}>{t('view_map')}</Text>
                <Text style={styles.flashyDescription}>{t('view_map_desc')}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* --- Report Hazard Button --- */}
          <TouchableOpacity
            style={styles.standardCard}
            onPress={() => navigation.navigate('ReportHazard')}
          >
            <Icon name="alert-circle-outline" size={40} color={theme.colors.primary} />
            <Text style={styles.standardTitle}>{t('report_hazard')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  waveContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', width: '100%' },
  wave: { width: '100%', height: '100%' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: theme.colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 18, color: theme.colors.text, marginTop: 8, textAlign: 'center' },
  flashyCardContainer: {
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  flashyGradient: {
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  flashyContent: {
    alignItems: 'center',
  },
  flashyTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  flashyDescription: {
    fontSize: 16,
    color: '#E0F7FA',
    marginTop: 10,
    textAlign: 'center',
  },
  standardCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  standardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 15,
  },
});

export default HomeScreen;

