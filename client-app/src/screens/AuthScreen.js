import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import {
  TextInput,
  Button,
  Provider as PaperProvider,
  DefaultTheme,
  RadioButton,
  Checkbox,
} from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';

// --- THEME CONFIGURATION ---
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#005A9C',
    accent: '#00BFFF',
    background: '#FFFFFF',
    surface: '#F6F8FA',
    text: '#212121',
    placeholder: '#8A8A8A',
  },
};

// --- WAVY BACKGROUND COMPONENT ---
const WaveBackground = () => (
  <View style={styles.waveContainer}>
    <Svg
      height="100%"
      width="100%"
      viewBox="0 0 1440 320"
      style={styles.wave}
    >
      <Path
        fill={theme.colors.primary}
        fillOpacity="0.1"
        d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,186.7C960,213,1056,235,1152,218.7C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      />
      <Path
        fill={theme.colors.primary}
        fillOpacity="0.2"
        d="M0,224L48,208C96,192,192,160,288,170.7C384,181,480,235,576,250.7C672,267,768,245,864,213.3C960,181,1056,139,1152,128C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      />
    </Svg>
  </View>
);

const AuthScreen = () => {
  // --- STATE MANAGEMENT using useState hooks ---
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('Citizen');
  const [isCaptchaChecked, setIsCaptchaChecked] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  // --- HANDLER FUNCTIONS (for button presses) ---
  const handleLogin = () => {
    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }
    if (!isCaptchaChecked) {
      alert('Please confirm you are not a robot.');
      return;
    }
    console.log('Logging in with:', { email, password });
    alert('Login Successful!');
  };

  const handleSignUp = () => {
    if (!email || !password || !confirmPassword) {
      alert('Please fill all the required fields.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    if (!isCaptchaChecked) {
      alert('Please confirm you are not a robot.');
      return;
    }
    console.log('Signing up with:', { email, password, userType });
    alert('Sign Up Successful!');
  };

  // --- UI RENDERING (JSX) ---
  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <WaveBackground />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.title}>OceanAlly</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>{isLogin ? 'Welcome Back!' : 'Create Account'}</Text>

              <TextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                left={<TextInput.Icon icon="email-outline" />}
              />
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                mode="outlined"
                secureTextEntry={secureTextEntry}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={secureTextEntry ? 'eye-off' : 'eye'}
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                  />
                }
              />
              {!isLogin && (
                <>
                  <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={styles.input}
                    mode="outlined"
                    secureTextEntry={secureTextEntry}
                    left={<TextInput.Icon icon="lock-check-outline" />}
                  />
                  <View style={styles.radioGroupContainer}>
                    <Text style={styles.radioGroupLabel}>I am a:</Text>
                    <RadioButton.Group onValueChange={newValue => setUserType(newValue)} value={userType}>
                      <View style={styles.radioOption}>
                        <RadioButton value="citizen" />
                        <Text>Citizen</Text>
                      </View>
                      <View style={styles.radioOption}>
                        <RadioButton value="analyst" />
                        <Text>Analyst</Text>
                      </View>
                      <View style={styles.radioOption}>
                        <RadioButton value="official" />
                        <Text>Official</Text>
                      </View>
                    </RadioButton.Group>
                  </View>
                </>
              )}
              <View style={styles.captchaContainer}>
                <Checkbox.Item
                  label="I am not a robot"
                  status={isCaptchaChecked ? 'checked' : 'unchecked'}
                  onPress={() => {
                    setIsCaptchaChecked(!isCaptchaChecked);
                  }}
                  labelStyle={styles.captchaLabel}
                  position='leading'
                />
              </View>
              <Button
                mode="contained"
                onPress={isLogin ? handleLogin : handleSignUp}
                style={styles.button}
                labelStyle={styles.buttonLabel}
              >
                {isLogin ? 'Login' : 'Sign Up'}
              </Button>
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                </Text>
                <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                  <Text style={styles.toggleLink}>{isLogin ? 'Sign Up' : 'Login'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardAvoidingView: { flex: 1 },
  scrollViewContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  waveContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', width: '100%'},
  wave: { width: '100%', height: '100%' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 36, fontWeight: 'bold', color: theme.colors.primary },
  subtitle: { fontSize: 16, color: theme.colors.text },
  formContainer: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 15, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8 },
  formTitle: { fontSize: 24, fontWeight: '600', color: theme.colors.text, textAlign: 'center', marginBottom: 20 },
  input: { marginBottom: 15 },
  radioGroupContainer: { marginBottom: 15, padding: 10, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 5 },
  radioGroupLabel: { fontSize: 16, marginBottom: 10, color: theme.colors.text },
  radioOption: { flexDirection: 'row', alignItems: 'center' },
  captchaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: 10, backgroundColor: theme.colors.surface, borderRadius: 5, borderWidth: 1, borderColor: '#E0E0E0' },
  captchaLabel: { fontSize: 14 },
  button: { paddingVertical: 8, borderRadius: 8 },
  buttonLabel: { fontSize: 18, fontWeight: 'bold' },
  toggleContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  toggleText: { color: theme.colors.text },
  toggleLink: { color: theme.colors.primary, fontWeight: 'bold', marginLeft: 5 },
});

export default AuthScreen;

