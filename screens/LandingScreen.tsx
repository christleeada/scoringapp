import React from 'react';
import {View, Image, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const LandingPage: React.FC = () => {
  const navigation = useNavigation();

  const AdminSignin = () => {
    navigation.navigate('AdminLogin');
  };
  const UserSignin = () => {
    navigation.navigate('UserLogin');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/FULogo.png')}
            style={styles.image}
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.text}>FU </Text>
          <Text style={styles.smalltext}>Scoring App</Text>
        </View>
        <View style={styles.formContainer}>
          <TouchableOpacity onPress={UserSignin} style={styles.button}>
            <Icon name="account" size={24} color="white" />
            <Text style={styles.buttonText}>User Sign In</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.formContainer}>
          <TouchableOpacity onPress={AdminSignin} style={styles.button}>
            <Icon name="account-key" size={24} color="white" />
            <Text style={styles.buttonText}>Admin Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  text: {
    color: 'black',
    fontSize: 30,
    fontWeight: 'bold',
  },
  smalltext: {
    color: 'black',
    fontSize: 30,
    fontWeight: 'normal',
  },
  formContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#9a1b2f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
    width: '60%',
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    marginLeft: 10,
  },
});

export default LandingPage;
