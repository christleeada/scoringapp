import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ContestantModal = ({ onClose, selectedContestant, eventId, judgeId }) => {
  const [sandSculpture, setSandSculpture] = useState({ height: 0, area: 0 });
  const [criteriaGroups, setCriteriaGroups] = useState([]);
  const [criteria, setCriteria] = useState({});
  const [criteriaGroupId, setCriteriaGroupId] = useState(null);
  const [specialAwards, setSpecialAwards] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [eventTypeId, setEventTypeId] = useState(null);

  const handleCloseModal = () => {
    setSandSculpture({ height: 0, area: 0 });
    setCriteriaGroups([]);
    setCriteria({});
    setSpecialAwards([]);
    onClose();
  };

  const handleSetScore = async () => {
    try {
      const criteriaScores = Object.values(criteria)
        .flat()
        .map(crit => ({
          id: crit.id,
          score: parseFloat(crit.score)
        }));

      const specialAwardScores = specialAwards.map(award => ({
        id: award.id,
        score: award.score !== null ? parseFloat(award.score) : 0
      }));

      const scoresPayload = {
        score: {
          [criteriaGroupId]: criteriaScores
        },
        height: parseFloat(sandSculpture.height),
        area: parseFloat(sandSculpture.area),
        score_award: specialAwardScores
      };

      console.log('Scores being sent:', JSON.stringify(scoresPayload, null, 2));

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const url = `https://mis.foundationu.com/api/score/judge-score-set/${eventId}/${judgeId}/${selectedContestant.id}`;
      console.log('Sending scores to URL:', url);

      const response = await axios.post(url, scoresPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('API response:', response);

      if (response.status === 200) {
        Alert.alert(
          'Scores',
          'Scores have been successfully set',
          [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
          { cancelable: false },
        );
        onRefresh();
        handleCloseModal();
      } else {
        throw new Error('Failed to set scores');
      }
    } catch (error) {
      console.error('Error setting scores:', error);
      Alert.alert('Error', 'Failed to set scores');
    }
  };

  const fetchEventTypeId = async (eventId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const url = `https://mis.foundationu.com/api/score/event/${eventId}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Response data:', response.data);

      if (response.data && response.data.item) {
        const eventType = response.data.item.event_type_id;
        if (eventType) {
          setEventTypeId(eventType);
          console.log('Fetched event type ID:', eventType);
        } else {
          throw new Error('Event type ID not found in the response');
        }
      } else {
        throw new Error('Unable to determine event type');
      }
    } catch (error) {
      console.error('Error fetching event type ID:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
    }
  };

  const fetchScores = async (event_id, judge_id, contestant_id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const url = `https://mis.foundationu.com/api/score/judge-score-view/${event_id}/${judge_id}/${contestant_id}`;
      console.log('Fetching scores from URL:', url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Response data:', response.data);

      if (response.data) {
        const { sand_sculpture, criteria_group, criteria, special_award } = response.data;

        if (sand_sculpture && sand_sculpture.height && sand_sculpture.area) {
          setSandSculpture({
            height: parseFloat(sand_sculpture.height) || 0,
            area: parseFloat(sand_sculpture.area) || 0,
          });
        }

        setCriteriaGroups(criteria_group || []);
        setCriteriaGroupId(criteria_group && criteria_group.length > 0 ? criteria_group[0].id : null);

        const updatedCriteria = {};
        if (criteria_group && criteria_group.length > 0) {
          for (const group of criteria_group) {
            updatedCriteria[group.id] = criteria[group.id].map(crit => ({
              ...crit,
              score: crit.score !== undefined && !isNaN(crit.score) ? parseFloat(crit.score) : 0,
            }));
          }
        }
        setCriteria(updatedCriteria);
        console.log('Updated criteria:', updatedCriteria);

        const updatedSpecialAwards = special_award.map(award => ({
          ...award,
          score: award.score !== null ? parseFloat(award.score) : 0
        }));
        setSpecialAwards(updatedSpecialAwards);
        console.log('Special awards:', updatedSpecialAwards);
      } else {
        setCriteriaGroups([]);
        setCriteria({});
        setSpecialAwards([]);
        console.log('Scores not found in the response');
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventTypeId(eventId);
    }
  }, [eventId]);

  useEffect(() => {
    if (selectedContestant && selectedContestant.id && eventId && judgeId) {
      fetchScores(eventId, judgeId, selectedContestant.id);
    }
  }, [selectedContestant, eventId, judgeId]);

  const onRefresh = useCallback(() => {
    if (selectedContestant && selectedContestant.id && eventId && judgeId) {
      setRefreshing(true);
      fetchScores(eventId, judgeId, selectedContestant.id).finally(() =>
        setRefreshing(false),
      );
    }
  }, [selectedContestant, eventId, judgeId]);

  const handleSliderChange = (groupId, criteriaId, value) => {
    setCriteria(prevCriteria => {
      const updatedCriteria = { ...prevCriteria };
      const criteriaList = updatedCriteria[groupId].map(crit => {
        if (crit.id === criteriaId) {
          return { ...crit, score: value };
        }
        return crit;
      });
      updatedCriteria[groupId] = criteriaList;
      return updatedCriteria;
    });
  };

  const handleSpecialAwardChange = (awardId, value) => {
    setSpecialAwards(prevAwards =>
      prevAwards.map(award =>
        award.id === awardId ? { ...award, score: value } : award
      )
    );
  };

  return (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={[styles.contestantmodal, styles.scale1FlexBox]}>
        <View style={styles.scalercontainer}>
          <View style={styles.scaler}>
            <Text style={styles.contestant1}>
              {selectedContestant
                ? selectedContestant.name
                : 'No contestant selected'}
            </Text>
            {eventTypeId === '4' && (
              <View style={[styles.scale1, styles.scale1FlexBox]}>
                <Text style={styles.heightToArea}>
                  Height to Area Ratio (50%)
                </Text>
                <View style={styles.scale1slider1}>
                  <Text style={[styles.height, styles.textTypo]}>
                    Height: {sandSculpture.height.toFixed(2)} 
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  minimumTrackTintColor="#9a1b2f"
                  maximumTrackTintColor="#666666"
                  thumbTintColor="#000000"
                  step={0.5}
                  value={sandSculpture.height}
                  onValueChange={value =>
                    setSandSculpture(prev => ({ ...prev, height: value }))
                  }
                  thumbStyle={styles.thumbStyle}
                />
                <View style={styles.scale1slider1}>
                  <Text style={[styles.height, styles.textTypo]}>
                    Area: {sandSculpture.area.toFixed(2)} 
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  minimumTrackTintColor="#9a1b2f"
                  maximumTrackTintColor="#666666"
                  thumbTintColor="#000000"
                  step={0.5}
                  value={sandSculpture.area}
                  onValueChange={value =>
                    setSandSculpture(prev => ({ ...prev, area: value }))
                  }
                  thumbStyle={styles.thumbStyle}
                />
              </View>
            )}
          </View>
        </View>
        {criteriaGroups.length === 0 && (
          <Text>No criteria groups found.</Text>
        )}
        {criteriaGroups.map(group => (
          <View key={group.id} style={styles.scaler}>
            <Text style={styles.heightToArea}>
              {group.name} ({group.weight}%)
            </Text>
            {criteria[group.id]?.length === 0 && (
              <Text>No criteria found.</Text>
            )}
            {criteria[group.id]?.map(crit => (
              <View key={crit.id}>
                <View style={styles.scale1slider1}>
                  <Text style={[styles.height, styles.textTypo]}>
                    {crit.name} ({crit.weight}%): {(crit.score !== undefined && !isNaN(crit.score) ? parseFloat(crit.score).toFixed(2) : 'N/A')}
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={parseFloat(crit.weight)}
                  minimumTrackTintColor="#9a1b2f"
                  maximumTrackTintColor="#666666"
                  thumbTintColor="#000000"
                  step={0.5}
                  value={crit.score}
                  onValueChange={value =>
                    handleSliderChange(group.id, crit.id, value)
                  }
                  thumbStyle={styles.thumbStyle}
                />
              </View>
            ))}
          </View>
        ))}
        {specialAwards.length > 0 && (
          <View style={styles.scaler}>
            <Text style={styles.heightToArea}>
              Special Awards
            </Text>
            {specialAwards.map(award => (
              <View key={award.id}>
                <View style={styles.scale1slider1}>
                  <Text style={[styles.height, styles.textTypo]}>
                    {award.name} ({award.weight}): {(award.score !== null && !isNaN(award.score) ? parseFloat(award.score).toFixed(2) : 'N/A')}
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={parseFloat(award.weight)}
                  minimumTrackTintColor="#9a1b2f"
                  maximumTrackTintColor="#666666"
                  thumbTintColor="#000000"
                  step={0.5}
                  value={award.score !== null ? parseFloat(award.score) : 0}
                  onValueChange={value =>
                    handleSpecialAwardChange(award.id, value)
                  }
                  thumbStyle={styles.thumbStyle}
                />
              </View>
            ))}
          </View>
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, styles.button]}
            onPress={handleSetScore}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.closeButton, styles.button]}
            onPress={handleCloseModal}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    width: '100%',
  },
  contestantmodal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '75%',
    marginTop: 30,
    alignSelf: 'center'
  },
  scalercontainer: {
    width: '100%',
    marginBottom: 20,
  },
  scaler: {
    marginBottom: 20,
  },
  contestant1: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scale1FlexBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heightToArea: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scale1slider1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 750,
    marginBottom: 10,
  },
  height: {
    fontSize: 14,
  },
  textTypo: {
    fontSize: 18,
    color: '#333',
  },
  slider: {
    width: 750,
    height: 40,
  },
  thumbStyle: {
    width: 75,
    height: 75,
    borderRadius: 20,
    backgroundColor: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 50,
  },
  submitButton: {
    backgroundColor: '#9a1b2f',
  },
  closeButton: {
    backgroundColor: '#666666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ContestantModal;
