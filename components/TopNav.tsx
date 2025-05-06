import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface TopNavProps {
  showBackButton: boolean;
}

const TopNav: React.FC<TopNavProps> = ({showBackButton}) => {
  const navigation = useNavigation();

  const navigateToLoginScreen = () => {
    navigation.navigate('AdminLogin');
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        {showBackButton && (
          <TouchableOpacity onPress={goBack}>
            <Text style={styles.backButton}>{' < '}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>FU Scoring App</Text>
      </View>

      <TouchableOpacity
        style={styles.logoutContainer}
        onPress={navigateToLoginScreen}>
        <Icon name="power" size={20} color="white" />
        <Text style={styles.logout}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#9a1b2f',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  backButton: {
    fontSize: 16,
    color: '#fff',
  },
  logoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logout: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 5,
  },
});

export default TopNav;
