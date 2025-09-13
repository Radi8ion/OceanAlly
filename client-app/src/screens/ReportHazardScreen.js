import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Provider as PaperProvider,
  DefaultTheme,
  TextInput,
  Button,
  Checkbox,
  Appbar,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

// --- THEME (Consistent with other screens) ---
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#005A9C',
    accent: '#00BFFF',
    background: '#F6F8FA', // A light grey for the form background
    surface: '#FFFFFF',
    text: '#212121',
    placeholder: '#8A8A8A',
    error: '#B00020',
  },
};

// Moved inside the component to use the 't' function for translation
const HAZARD_TYPES = (t) => [
  { key: 'tsunami', label: t('tsunami_warning'), icon: 'tsunami' },
  { key: 'cyclone', label: t('cyclone_storm'), icon: 'weather-hurricane' },
  { key: 'oil', label: t('oil_spill_pollution'), icon: 'oil' },
  { key: 'algal', label: t('harmful_algal_bloom'), icon: 'flower-tulip' },
  { key: 'debris', label: t('marine_debris'), icon: 'anchor' },
  { key: 'lightning', label: t('lightning_activity'), icon: 'weather-lightning' },
  { key: 'other', label: t('other_hazard'), icon: 'alert-circle-outline' },
];

const ReportHazardScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [selectedHazards, setSelectedHazards] = useState([]);

  const toggleHazardSelection = (key) => {
    setSelectedHazards((prev) =>
      prev.includes(key) ? prev.filter((h) => h !== key) : [...prev, key]
    );
  };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="OceanAlly" subtitle={t('report_hazard')} />
          <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
        </Appbar.Header>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* --- Hazard Details Section --- */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Icon name="clock-time-three-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>{t('hazard_report_details')}</Text>
            </View>
            <Text style={styles.sectionDescription}>{t('hazard_report_details_desc')}</Text>

            {/* Hazard Type */}
            <Text style={styles.label}>{t('hazard_type')} *</Text>
            <View style={styles.hazardGrid}>
              {HAZARD_TYPES(t).map((hazard) => (
                <TouchableOpacity
                  key={hazard.key}
                  style={[
                    styles.hazardButton,
                    selectedHazards.includes(hazard.key) && styles.hazardButtonSelected,
                  ]}
                  onPress={() => toggleHazardSelection(hazard.key)}
                >
                  <Icon
                    name={hazard.icon}
                    size={20}
                    color={selectedHazards.includes(hazard.key) ? '#FFFFFF' : theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.hazardButtonText,
                      selectedHazards.includes(hazard.key) && styles.hazardButtonTextSelected,
                    ]}
                  >
                    {hazard.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Other Form Fields */}
            <TextInput mode="outlined" label={`${t('severity_level')} *`} style={styles.input} />
            <View style={styles.row}>
              <TextInput mode="outlined" label={`${t('latitude')} *`} style={[styles.input, styles.halfInput]} keyboardType="numeric" />
              <TextInput mode="outlined" label={`${t('longitude')} *`} style={[styles.input, styles.halfInput]} keyboardType="numeric" />
            </View>
            <TextInput mode="outlined" label={`${t('location_description')} *`} style={styles.input} />
            <TextInput mode="outlined" label={`${t('hazard_description')} *`} multiline numberOfLines={4} style={styles.input} />

            {/* Upload Media */}
            <Text style={styles.label}>{t('upload_media')}</Text>
            <TouchableOpacity style={styles.uploadBox}>
              <Icon name="upload" size={40} color={theme.colors.placeholder} />
              <Text style={styles.uploadText}>{t('upload_click')}</Text>
              <Text style={styles.uploadSubtext}>{t('upload_size_limit')}</Text>
            </TouchableOpacity>

            {/* Contact Info */}
            <View style={styles.row}>
              <TextInput mode="outlined" label={t('your_name')} style={[styles.input, styles.halfInput]} />
              <TextInput mode="outlined" label={t('contact_number')} style={[styles.input, styles.halfInput]} keyboardType="phone-pad" />
            </View>

            {/* Immediate Danger Checkbox */}
            <Checkbox.Item
              label={t('immediate_danger_check')}
              status={'unchecked'}
              onPress={() => {}}
              position="leading"
              labelStyle={styles.checkboxLabel}
              style={styles.checkboxContainer}
            />

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <Button mode="outlined" style={styles.draftButton} onPress={() => {}}>
                {t('save_as_draft')}
              </Button>
              <Button mode="contained" style={styles.submitButton} onPress={() => {}}>
                {t('submit_report')}
              </Button>
            </View>
          </View>

          {/* --- Emergency Situations Box --- */}
          <View style={styles.emergencyBox}>
            <Icon name="information" size={24} color={theme.colors.primary} />
            <View style={styles.emergencyTextContainer}>
              <Text style={styles.emergencyTitle}>{t('emergency_situations')}</Text>
              <Text style={styles.emergencyText}>{t('emergency_situations_desc')}</Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  contentContainer: { padding: 16 },
  formSection: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8, color: theme.colors.text },
  sectionDescription: { fontSize: 14, color: theme.colors.placeholder, marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '500', color: theme.colors.text, marginBottom: 8, marginTop: 8 },
  input: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 1, marginHorizontal: 4 },
  hazardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  hazardButton: { width: '48%', flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 8, marginBottom: 10 },
  hazardButtonSelected: { backgroundColor: theme.colors.primary },
  hazardButtonText: { color: theme.colors.primary, marginLeft: 8, fontSize: 12, flexShrink: 1 },
  hazardButtonTextSelected: { color: '#FFFFFF' },
  uploadBox: { borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed', borderRadius: 8, padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9F9F9', marginBottom: 16 },
  uploadText: { fontSize: 16, color: theme.colors.placeholder, marginTop: 8 },
  uploadSubtext: { fontSize: 12, color: '#A0A0A0' },
  checkboxContainer: { backgroundColor: '#FFF7E6', borderRadius: 8, marginVertical: 8 },
  checkboxLabel: { fontSize: 12, color: '#594A2B', flexShrink: 1, textAlign: 'left' },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  draftButton: { marginRight: 8, borderColor: theme.colors.primary },
  submitButton: { backgroundColor: theme.colors.primary },
  emergencyBox: { flexDirection: 'row', padding: 16, backgroundColor: '#E3F2FD', borderRadius: 8, borderLeftWidth: 5, borderLeftColor: theme.colors.primary },
  emergencyTextContainer: { marginLeft: 12, flex: 1 },
  emergencyTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.primary },
  emergencyText: { fontSize: 14, color: theme.colors.text, marginTop: 4, lineHeight: 20 },
});

export default ReportHazardScreen;
```

### **Important Next Step: Update Translation Files**

For the text on this screen to appear correctly in all languages, you need to add the new translation keys to your `.json` files.

Here is the list of new keys you need to add to `en.json`, `hi.json`, and all your other language files.

```json
    "hazard_report_details": "Hazard Report Details",
    "hazard_report_details_desc": "Please provide as much detail as possible to help our response teams.",
    "hazard_type": "Hazard Type",
    "tsunami_warning": "Tsunami Warning",
    "cyclone_storm": "Cyclone/Storm",
    "oil_spill_pollution": "Oil Spill/Pollution",
    "harmful_algal_bloom": "Harmful Algal Bloom",
    "marine_debris": "Marine Debris",
    "lightning_activity": "Lightning Activity",
    "other_hazard": "Other Hazard",
    "severity_level": "Severity Level",
    "latitude": "Latitude",
    "longitude": "Longitude",
    "location_description": "Location Description",
    "hazard_description": "Hazard Description",
    "upload_media": "Upload Media (Photos/Videos)",
    "upload_click": "Click to upload photos or videos",
    "upload_size_limit": "Maximum file size: 50MB per file",
    "your_name": "Your Name",
    "contact_number": "Contact Number",
    "immediate_danger_check": "Check if this hazard poses immediate danger to life or property",
    "save_as_draft": "Save as Draft",
    "submit_report": "Submit Report",
    "emergency_situations": "Emergency Situations",
    "emergency_situations_desc": "For immediate life-threatening emergencies, please call the Coast Guard at 1554 or local emergency services at 112 before submitting this report."

