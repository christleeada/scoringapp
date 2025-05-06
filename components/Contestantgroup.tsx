import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FontFamily, FontSize, Color, Border } from '../GlobalStyles';
import { checkTokenValidity } from '../components/userAuthUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ContestantGroupProps {
  propMarginTop?: number | string;
  onRatebuttonPress: () => void;
  openTriggerModal: () => void;
}

const ContestantGroup: React.FC<ContestantGroupProps> = ({
  propMarginTop,
  event_id,
  judge_id,
  token,
  onRatebuttonPress,
  openTriggerModal
}) => {
  const [contestants, setContestants] = useState<any[]>([]);
  const [tokenData, setTokenData] = useState<any>(null);

  const handleSetScore = (selectedContestant: any) => {
    console.log("Opening modal...");
    openTriggerModal(selectedContestant); 
  };

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const tokenValidity = await checkTokenValidity(token);
          setTokenData(tokenValidity.data);
          console.log('Token validity data:', tokenValidity.data);

          
          if (tokenValidity.data && tokenValidity.data.judge) {
            const { event_id, id: judge_id } = tokenValidity.data.judge;
            fetchContestants(event_id, judge_id, token);
          }
        }
      } catch (error) {
        console.error('Error fetching token:', error.message);
      }
    };

    fetchTokenData();
  }, []);

  const fetchContestants = async (event_id: string, judge_id: string, token: string) => {
    try {
      const fetchData = async () => {
        const response = await fetch(
          `https://mis.foundationu.com/api/score/judge-score-list/${event_id}/${judge_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        if (!response.ok) {
          throw new Error(
            `Failed to fetch contestants: ${response.status} - ${response.statusText}`
          );
        }
  
        const data = await response.json();
  
        if (!data.contestants || Object.keys(data.contestants).length === 0) {
          throw new Error('No contestants found');
        }
  
        const contestantsArray = Object.values(data.contestants);
        setContestants(contestantsArray);
      };
  
      await fetchData();
  
      
      const intervalId = setInterval(fetchData, 500); 
  
      
      return () => clearInterval(intervalId);
    } catch (error) {
      console.error('Error fetching contestants:', error.message);
    }
  };
  

  const renderContestants = () => {
    if (!Array.isArray(contestants) || contestants.length === 0) {
      return <Text>No contestants found</Text>;
    }

    return contestants.map((contestant, index) => (
      <View key={index} style={styles.contestantGroup}>
        <Text style={styles.contestant1}>{contestant.name}</Text>
        <TouchableOpacity
  style={styles.rateButton}
  activeOpacity={0.2}
  onPress={() => {
    handleSetScore(contestant); 
    console.log('Set score for', contestant.name);
  }}
>
          <Text style={styles.login}>
            {contestant.score > 0 ? `${contestant.score.toFixed(2)}%` : 'Set Score'}
            
          </Text>
        </TouchableOpacity>
      </View>
    ));
  };

  return <View style={styles.container}>{renderContestants()}</View>;
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  contestantGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: Color.colorGray_100,
    minHeight: 60,
    maxHeight: 60,
  },
  contestant1: {
    flex: 1,
    textAlign: 'left',
    color: Color.colorBlack,
    fontFamily: FontFamily.sFProTextRegular,
    fontSize: FontSize.size_xl,
  },
  rateButton: {
    flex: 1,
    height: 40,
    maxWidth: 130,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Color.colorRoyalblue_100,
    borderRadius: Border.br_5xs,
    elevation: 20,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 20,
    shadowOpacity: 1,
  },
  login: {
    color: Color.white,
    fontFamily: FontFamily.sFProTextRegular,
    fontSize: FontSize.size_xl,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
});

export default ContestantGroup;
