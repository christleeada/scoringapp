import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';

const ContestantModalTruss = ({ onClose, selectedContestant, eventId, judgeId }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [eventTypeId, setEventTypeId] = useState(null);
  const [trussWeight, setTrussWeight] = useState(0);
  const [woodPlankWeight, setWoodPlankWeight] = useState(0);
  const [unit, setUnit] = useState('');
  const [weightMax, setWeightMax] = useState(0);
  const [step, setStep] = useState(0.1);
  const [addMax, setAddMax] = useState(0);
  const [error, setError] = useState('');

  const handleCloseModal = () => {
    onClose();
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

      console.log('Event data:', response.data);

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

  useEffect(() => {
    if (eventId) {
      fetchEventTypeId(eventId);
    }
  }, [eventId]);

  const fetchContestantScore = async (eventId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const url = `https://mis.foundationu.com/api/score/judge-score-view/${eventId}/${judgeId}/${selectedContestant.id}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Weight data:', response.data);
      console.log(url);

      if (response.data && response.data.score) {
        const { truss_weight, wood_plank_weight, unit, add_max, weight_max } = response.data.score;
        setTrussWeight(truss_weight);
        setWoodPlankWeight(wood_plank_weight);
        setUnit(unit);
        setStep(step);
        setWeightMax(parseFloat(weight_max));
        setAddMax(parseFloat(add_max));
      } else {
        console.log('No score data found');
        if (response.data.weight_max && response.data.add_max) {
          setWeightMax(parseFloat(response.data.weight_max));
          setAddMax(parseFloat(response.data.add_max));
        }
      }
    } catch (error) {
      console.error('Error fetching contestant score:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
    }
  };

  useEffect(() => {
    if (selectedContestant && selectedContestant.id && eventId && judgeId) {
      fetchContestantScore(eventId);
    }
  }, [selectedContestant, eventId, judgeId]);

  const onRefresh = useCallback(() => {
    if (selectedContestant && selectedContestant.id && eventId && judgeId) {
      setRefreshing(true);
      fetchContestantScore(eventId);
      setRefreshing(false);
    }
  }, [selectedContestant, eventId, judgeId]);

  const handleSetWeight = async () => {
    if (trussWeight === 0 || !unit) {
      setError('Please ensure all values are set and a weight unit is selected.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      console.log('Token:', token);

      const url = `https://mis.foundationu.com/api/score/judge-score-set/${eventId}/${judgeId}/${selectedContestant.id}`;
      const payload = {
        action: 'initial',
        main_weight: parseFloat(trussWeight.toFixed(2)),
        add_weight: parseFloat(woodPlankWeight.toFixed(2)),
        unit: unit,
      };

      console.log('Payload:', payload);

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Weights set successfully:', response.data);
      handleCloseModal();
    } catch (error) {
      console.error('Error setting weights:', error);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        console.error('Error response data:', error.response.data);
        console.error('Error response status text:', error.response.statusText);
        console.error('Error response config:', error.response.config);
      }
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.contestantModal}>
        <Text style={styles.contestant1}>
          {selectedContestant ? selectedContestant.name : 'Contestant'}
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {weightMax > 0 && (
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Truss Weight:</Text>
            <View style={styles.sliderRow}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={weightMax}
                step={step}
                value={trussWeight}
                onValueChange={setTrussWeight}
                minimumTrackTintColor="#9a1b2f"
                maximumTrackTintColor="#000000"
                thumbTintColor="#9a1b2f"
              />
              <Text style={styles.sliderValue}>{trussWeight.toFixed(1)}</Text>
            </View>
          </View>
        )}

        {addMax > 0 && (
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Weight of Wood Plank:</Text>
            <View style={styles.sliderRow}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={addMax}
                step={step}
                value={woodPlankWeight}
                onValueChange={setWoodPlankWeight}
                minimumTrackTintColor="#9a1b2f"
                maximumTrackTintColor="#000000"
                thumbTintColor="#9a1b2f"
              />
              <Text style={styles.sliderValue}>{woodPlankWeight.toFixed(1)}</Text>
            </View>
          </View>
        )}

        <View style={styles.unitContainer}>
          <Text style={styles.unitText}>Unit:</Text>
          <RNPickerSelect
            placeholder={{ label: 'Select Weight Unit', value: null }}
            value={unit}
            onValueChange={itemValue => setUnit(itemValue)}
            items={[
              { label: 'Kilograms', value: 'kg' },
              { label: 'Grams', value: 'g' },
            ]}
            style={pickerSelectStyles}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.closeButton, styles.button]}
            onPress={handleCloseModal}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, styles.button]}
            onPress={handleSetWeight}>
            <Text style={styles.buttonText}>Set Weight</Text>
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
  contestantModal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '60%',
    marginTop: 30,
    alignSelf: 'center',
    alignItems: 'center',
  },
  contestant1: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sliderContainer: {
    width: '100%',
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  unitText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    marginLeft: 10,
    fontSize: 16,
    width: 50,
    textAlign: 'right',
  },
  unitContainer: {
    width: '30%',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButton: {
    backgroundColor: '#cccccc',
  },
  submitButton: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#f0f0f0',
    width: '100%',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'gray',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#f0f0f0',
    width: '100%',
  },

});

export default ContestantModalTruss;
