import React, { useEffect, useState, ComponentType } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { checkTokenValidity } from './authUtils';

interface Props {}

const withAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const AuthComponent: React.FC<Props> = (props) => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      const validateToken = async () => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const isValid = await checkTokenValidity(token);
          if (isValid) {
            setIsAuthenticated(true);
          } else {
            navigation.navigate('AdminLogin');
          }
        } else {
          navigation.navigate('AdminLogin');
        }
        setLoading(false);
      };

      validateToken();
    }, [navigation]);

    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      );
    }

    if (!isAuthenticated) {
      return <Text>Redirecting...</Text>;
    }

    return <WrappedComponent {...props as P} />;
  };

  return AuthComponent;
};

export default withAuth;
