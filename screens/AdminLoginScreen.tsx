import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AdminLoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const [id, setId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedId = await AsyncStorage.getItem('savedId');
        const savedPassword = await AsyncStorage.getItem('savedPassword');
        const savedRememberMe = await AsyncStorage.getItem('savedRememberMe');

        if (savedId) setId(savedId);
        if (savedPassword) setPassword(savedPassword);
        if (savedRememberMe) setRememberMe(savedRememberMe === 'true');
      } catch (error) {
        console.error('Failed to load saved credentials:', error);
      }
    };

    loadCredentials();
  }, []);

  const handleSignIn = async () => {
    try {
      const response = await fetch(
        'https://mis.foundationu.com/api/score/admin-login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employee_id: id,
            password: password,
          }),
        },
      );

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        await AsyncStorage.setItem('token', data.token);

        if (rememberMe) {
          await AsyncStorage.setItem('savedId', id);
          await AsyncStorage.setItem('savedPassword', password);
          await AsyncStorage.setItem('savedRememberMe', 'true');
        } else {
          await AsyncStorage.removeItem('savedId');
          await AsyncStorage.removeItem('savedPassword');
          await AsyncStorage.setItem('savedRememberMe', 'false');
        }

        checkAdminStatus(data.token);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkAdminStatus = async (token: string) => {
    try {
      const response = await fetch(
        'https://mis.foundationu.com/api/score/admin-login-check',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      console.log('Admin check response:', data);

      if (response.ok) {
        const isAdmin = data.employee.is_admin;
        if (isAdmin === '1') {
          navigation.navigate('Home');
        } else if (isAdmin === '0') {
          navigation.navigate('Home1');
        } else {
          Alert.alert('Error', 'Invalid admin status.');
        }
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleCancel = () => {
    navigation.navigate('Landing');
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.card}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../assets/FULogo.png')}
              style={styles.image}
            />
          </View>
          <View style={{flexDirection: 'row'}}>
            <Text style={styles.text}>FU </Text>
            <Text style={styles.smalltext}>Scoring App</Text>
          </View>
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="ID Number"
              placeholderTextColor="grey"
              value={id}
              onChangeText={text => setId(text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={true}
              placeholderTextColor="grey"
              value={password}
              onChangeText={text => setPassword(text)}
            />
            <View style={styles.rememberMeContainer}>
              <TouchableOpacity
                onPress={toggleRememberMe}
                style={styles.checkbox}>
                <Icon
                  name={rememberMe ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color="#000"
                />
              </TouchableOpacity>
              <Text style={styles.rememberMeText}>Remember Me</Text>
            </View>
            <TouchableOpacity
              style={[styles.loginbutton, styles.code01Layout]}
              activeOpacity={0.2}
              onPress={handleSignIn}>
              <Text style={styles.login}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelbutton, styles.code01Layout]}
              activeOpacity={0.2}
              onPress={handleCancel}>
              <Text style={styles.login}>Cancel </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    alignItems: 'center',
    width: '60%',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  formContainer: {
    alignItems: 'center',
    width: '100%',
  },
  input: {
    height: 40,
    width: '50%',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingLeft: 10,
    color: 'black',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    marginRight: 10,
  },
  rememberMeText: {
    color: 'black',
  },
  text: {
    color: 'black',
    marginBottom: 10,
    fontSize: 30,
    fontWeight: 'bold',
  },
  smalltext: {
    color: 'black',
    marginBottom: 10,
    fontSize: 30,
    fontWeight: 'normal',
  },
  loginbutton: {
    backgroundColor: '#9a1b2f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
    width: '50%',
  },
  cancelbutton: {
    backgroundColor: '#666666',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 120,
    width: '50%',
  },
  login: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
  },
});

export default AdminLoginScreen;
