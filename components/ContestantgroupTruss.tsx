import React, { useState, useEffect, useCallback } from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FontFamily, FontSize, Color, Border } from '../GlobalStyles';
import { checkTokenValidity } from './userAuthUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface ContestantGroupProps {
  propMarginTop?: number | string;
  event_id: string;
  judge_id: string;
  token: string;
  onRatebuttonPress: () => void;
  openTriggerModal: (contestant: any) => void;
}

const ContestantGroupTruss: React.FC<ContestantGroupProps> = ({
  propMarginTop,
  event_id,
  judge_id,
  token,
  onRatebuttonPress,
  openTriggerModal
}) => {
  const [contestants, setContestants] = useState<any[]>([]);
  const [contestantWeights, setContestantWeights] = useState<{ [key: string]: string }>({});

  const fetchContestants = useCallback(async (event_id: string, judge_id: string, token: string) => {
    try {
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

      contestantsArray.forEach((contestant: any) => {
        fetchContestantScore(event_id, judge_id, contestant.id, token);
      });
    } catch (error) {
      console.error('Error fetching contestants:', error.message);
    }
  }, []);

  const fetchContestantScore = useCallback(async (event_id: string, judge_id: string, contestant_id: string, token: string) => {
    // console.log('Calling fetchContestantScore with:', event_id, judge_id, contestant_id);
    try {
      const url = `https://mis.foundationu.com/api/score/judge-score-view/${event_id}/${judge_id}/${contestant_id}`;
      // console.log('Fetching URL:', url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.weight_initial) {
        const { add_weight, unit } = response.data.weight_initial;
        const { weight_added } = response.data;

        let totalWeight = parseFloat(add_weight) || 0;
        if (weight_added && Array.isArray(weight_added)) {
          totalWeight += weight_added.reduce((sum, weightObj) => sum + (parseFloat(weightObj.weight) || 0), 0);
        }

        setContestantWeights(prev => ({
          ...prev,
          [contestant_id]: `${totalWeight.toFixed(2)} ${unit}`
        }));
      } else {
        // console.log('No weight_initial data found');
      }
    } catch (error) {
      console.error('Error fetching contestant score:', error);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
    }
  }, []);

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const tokenValidity = await checkTokenValidity(token);

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

    const intervalId = setInterval(() => {
      fetchContestants(event_id, judge_id, token);
      contestants.forEach((contestant) => {
        fetchContestantScore(event_id, judge_id, contestant.id, token);
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [fetchContestants, event_id, judge_id, token, contestants, fetchContestantScore]);

  const handleSetScore = (selectedContestant: any) => {
    openTriggerModal(selectedContestant);
  };

  const renderContestants = () => {
    if (!Array.isArray(contestants) || contestants.length === 0) {
      return <Text>No contestants found</Text>;
    }

    return contestants.map((contestant, index) => {
      const buttonText = contestantWeights[contestant.id] || 'Set Weight';
      return (
        <View key={index} style={styles.contestantGroup}>
          <Text style={styles.contestant1}>{contestant.name}</Text>
          <TouchableOpacity
            style={[styles.rateButton, contestant.weight_failed && styles.disabledButton]}
            activeOpacity={0.2}
            onPress={() => handleSetScore(contestant)}
          >
            <Text style={styles.login}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      );
    });
  };

  return <View style={[styles.container, { marginTop: propMarginTop }]}>{renderContestants()}</View>;
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
    backgroundColor: '#079347',
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
  disabledButton: {
    backgroundColor: '#ab1f24',
  },
  login: {
    color: Color.white,
    fontFamily: FontFamily.sFProTextRegular,
    fontSize: FontSize.size_xl,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
});

export default ContestantGroupTruss;
