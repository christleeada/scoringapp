import React, {useState, useEffect, useCallback} from 'react';
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
import {CheckBox} from 'react-native-elements';

const ContestantModalTrussAddWeight = ({
  onClose,
  selectedContestant,
  eventId,
  judgeId,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [eventTypeId, setEventTypeId] = useState(null);
  const [addWeight, setAddWeight] = useState(0);
  const [weightFailed, setWeightFailed] = useState(false);
  const [unit, setUnit] = useState('');
  const [weightMax, setWeightMax] = useState(0);
  const [step, setStep] = useState(0.1);
  const [max, setMax] = useState(0);
  const [success, setSuccess] = useState(1);
  const [attempts, setAttempts] = useState([]);

  const handleCloseModal = () => {
    onClose();
  };

  const fetchEventTypeId = async eventId => {
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

      // console.log('data:', response.data);

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

  const fetchContestantScore = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Token not found');

      const url = `https://mis.foundationu.com/api/score/judge-score-view/${eventId}/${judgeId}/${selectedContestant.id}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.weight_initial) {
        const {unit} = response.data.weight_initial;
        const {weight_failed, step, max, weight_added} = response.data;

        setWeightFailed(!!weight_failed);
        setStep(parseFloat(step) || 0.1);
        setMax(parseFloat(max) || 100);
        setUnit(unit || '');

        if (weight_added && Array.isArray(weight_added)) {
          const updatedAttempts = weight_added.map(attempt => ({
            ...attempt,
            status:
              attempt.success === '1'
                ? 'Successful'
                : attempt.success === '0'
                ? 'Failed'
                : '',
          }));
          setAttempts(updatedAttempts);
        }
      } else {
        console.log('No weight_initial data found');
      }
    } catch (error) {
      console.error('Error fetching contestant score:', error);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
    }
  };

  useEffect(() => {
    console.log(
      'useEffect triggered with:',
      selectedContestant,
      eventId,
      judgeId,
    );

    if (selectedContestant && selectedContestant.id && eventId && judgeId) {
      console.log('Selected Contestant ID:', selectedContestant.id);
      fetchContestantScore();
    } else {
      console.warn('Missing required data:', {
        selectedContestant,
        eventId,
        judgeId,
      });
    }
  }, [selectedContestant, eventId, judgeId]);

  const onRefresh = useCallback(() => {
    if (selectedContestant && selectedContestant.id && eventId && judgeId) {
      setRefreshing(true);
      fetchContestantScore();
      setRefreshing(false);
    }
  }, [selectedContestant, eventId, judgeId]);

  const handleSetWeight = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const url = `https://mis.foundationu.com/api/score/judge-score-set/${eventId}/${judgeId}/${selectedContestant.id}`;
      const payload = {
        action: 'add',
        weight: parseFloat(addWeight.toFixed(2)),
        success: success,
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

        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Added Weight:</Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={max}
              step={step}
              value={addWeight}
              onValueChange={setAddWeight}
              minimumTrackTintColor="#9a1b2f"
              maximumTrackTintColor="#000000"
              thumbTintColor="#9a1b2f"
            />
            <Text style={styles.sliderValue}>{addWeight.toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.checkBoxContainer}>
          <Text style={styles.checkBoxLabel}>Success:</Text>
          <View style={styles.checkBoxRow}>
            <CheckBox
              title="Yes"
              checked={success === 1}
              onPress={() => setSuccess(1)}
            />
            <CheckBox
              title="No"
              checked={success === 0}
              onPress={() => setSuccess(0)}
            />
          </View>
        </View>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Attempts</Text>
            <Text style={styles.tableHeaderText}>Weight</Text>
            <Text style={styles.tableHeaderText}>Status</Text>
          </View>
          {attempts.map((attempt, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>Attempt {index + 1}</Text>
              <Text style={styles.tableCell}>
                {attempt.weight} {attempt.unit || ''}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  attempt.status === 'Successful'
                    ? styles.successText
                    : attempt.status === 'Failed'
                    ? styles.failText
                    : {},
                ]}>
                {attempt.status}
              </Text>
            </View>
          ))}
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
  checkBoxContainer: {
    width: '25%',
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
  checkBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkBoxLabel: {
    fontSize: 16,
    marginBottom: 10,
    alignSelf: 'center',
  },
  tableContainer: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
    marginBottom: 10,
  },
  tableHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCell: {
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
  successText: {
    color: 'green',
  },
  failText: {
    color: 'red',
  },
});

export default ContestantModalTrussAddWeight;
