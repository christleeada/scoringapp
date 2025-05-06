import React, {useRef, useState} from 'react';
import {
  View,
  Image,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {FontFamily} from '../GlobalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserLoginScreen: React.FC = () => {
  const inputRefs = useRef<Array<TextInput | null>>(Array(6).fill(null));
  const [pin, setPin] = useState<string>('');
  const [code, setCode] = useState<string>('');

  const navigation = useNavigation();

  const handleSignIn = async () => {
    try {
      const response = await fetch(
        'https://mis.foundationu.com/api/score/judge-login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pin: pin,
            code: code,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('token', data.token);
        navigation.navigate('Dashboard');
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCancel = () => {
    navigation.navigate('Landing');
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && index > 0 && !inputRefs.current[index]?.value) {
      inputRefs.current[index - 1]?.focus();
    } else if (
      key >= '0' &&
      key <= '9' &&
      index < inputRefs.current.length - 1
    ) {
      inputRefs.current[index + 1]?.focus();
    }
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
            <View style={styles.codetab}>
              <Text style={[styles.pinCode, styles.fuTypo]}>PIN CODE</Text>
              <View style={styles.codepins}>
                {[...Array(6)].map((_, index) => (
                  <TextInput
                    ref={ref => (inputRefs.current[index] = ref)}
                    key={index}
                    style={styles.code01}
                    keyboardType="number-pad"
                    autoCapitalize="characters"
                    multiline={false}
                    secureTextEntry={false}
                    placeholderTextColor="#8692a6"
                    textAlign="center"
                    maxLength={1}
                    onChangeText={text => {
                      const newPin = [...pin];
                      newPin[index] = text;
                      setPin(newPin.join(''));

                      if (
                        text.length === 1 &&
                        index < inputRefs.current.length - 1
                      ) {
                        inputRefs.current[index + 1]?.focus();
                      }
                    }}
                    onKeyPress={({nativeEvent: {key}}) =>
                      handleKeyPress(index, key)
                    }
                  />
                ))}
              </View>
            </View>
            <View style={styles.codetab}>
              <Text style={[styles.pinCode, styles.fuTypo]}>EVENT CODE</Text>
              <TextInput
                style={[styles.eventcodeinput, styles.code01Layout]}
                autoCapitalize="sentences"
                multiline={false}
                secureTextEntry={false}
                placeholderTextColor="#8692a6"
                value={code}
                onChangeText={setCode}
              />
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
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
  },
  container: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
    marginVertical: 20,
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
  codetab: {
    marginBottom: 20,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCode: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
  codepins: {
    flexDirection: 'row',
  },
  code01: {
    width: 40,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    textAlign: 'center',
    marginHorizontal: 5,
  },
  eventcodeinput: {
    width: '60%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingLeft: 10,
    color: 'black',
    alignSelf: 'center',
    textAlign: 'center',
  },
  loginbutton: {
    backgroundColor: '#9a1b2f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
    width: '60%',
  },
  cancelbutton: {
    backgroundColor: '#666666',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 30,
    width: '60%',
  },
  login: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
  },
  fuTypo: {
    fontWeight: '700',
    fontFamily: FontFamily.sFProTextRegular,
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
});

export default UserLoginScreen;
