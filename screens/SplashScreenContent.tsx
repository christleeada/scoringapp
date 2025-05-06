import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  View,
  Image,
  StyleSheet,
} from 'react-native';
import ProgressBar from 'react-native-progress/Bar';

const SplashScreenContent: React.FC = () => {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress < 1) {
          return prevProgress + 1.0;
        }
        return prevProgress;
      });
    }, 300);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <SafeAreaView style={styles.wrapper}>
      <Image source={require('../assets/FULogo.png')} style={styles.logo} />
      <View style={styles.progressBarContainer}>
        <ProgressBar progress={progress} width={300} color="#9a1b2f" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  image: {
    height: 400,
    width: 300,
  },
  progressBarContainer: {
    marginTop: 150,
  },
  logo: {
    marginTop: 50,
    height: 200,
    width: 200,
  },
});

export default SplashScreenContent;
