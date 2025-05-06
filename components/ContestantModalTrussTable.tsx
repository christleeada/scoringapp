import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ContestantModalTrussTable = ({ onClose, selectedContestant, eventId, judgeId }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [attempts, setAttempts] = useState([]);

  const handleCloseModal = () => {
    onClose();
  };

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
        const { weight_added } = response.data;
        console.log(response.data);

        if (weight_added && Array.isArray(weight_added)) {
          // Map success codes to status text
          const updatedAttempts = weight_added.map(attempt => ({
            ...attempt,
            status: attempt.success === '1' ? 'Successful' : (attempt.success === '0' ? 'Failed' : '')
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
    if (selectedContestant && selectedContestant.id && eventId && judgeId) {
      fetchContestantScore();
    }
  }, [selectedContestant, eventId, judgeId]);

  const onRefresh = useCallback(() => {
    if (selectedContestant && selectedContestant.id && eventId && judgeId) {
      setRefreshing(true);
      fetchContestantScore();
      setRefreshing(false);
    }
  }, [selectedContestant, eventId, judgeId]);

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

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Attempts</Text>
            <Text style={styles.tableHeaderText}>Weight</Text>
            <Text style={styles.tableHeaderText}>Status</Text>
          </View>
          {attempts.map((attempt, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>Attempt {index + 1}</Text>
              <Text style={styles.tableCell}>{attempt.weight} {attempt.unit || ''}</Text>
              <Text style={[styles.tableCell, attempt.status === 'Successful' ? styles.successText : (attempt.status === 'Failed' ? styles.failText : {})]}>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});

export default ContestantModalTrussTable;
