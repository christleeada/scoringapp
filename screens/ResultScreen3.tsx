import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import TopNav from '../components/TopNav';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ResultScreen3 = () => {
  const route = useRoute();
  const { judgeId, judgeName, eventId } = route.params;
  const [judgeResults, setJudgeResults] = useState(null);
  const [error, setError] = useState(null);

  const fetchJudgeResults = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.get(`https://mis.foundationu.com/api/score/result-judge/${eventId}/${judgeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setJudgeResults(response.data);
        console.log(response.data);
      } else {
        throw new Error(`Failed to fetch results, status code: ${response.status}`);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchJudgeResults();
  }, [eventId, judgeId]);

  const calculateTotalWeight = (weights) => {
    return weights.reduce((total, weight) => {
      return total + (weight.success === "1" ? parseFloat(weight.weight) : 0);
    }, 0);
  };

  const getGrade = (totalWeight) => {
    if (!judgeResults || !judgeResults.weight_range) return 'N/A';
    const range = judgeResults.weight_range.find(range => 
      totalWeight >= parseFloat(range.load_start) && totalWeight <= parseFloat(range.load_end)
    );
    return range ? range.grade : 'N/A';
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error fetching data: {error}</Text>
      </View>
    );
  }

  if (!judgeResults) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

    const columnWidths = {
      initialWeight: 120,
      addedWeight: 120,
      unit: 80,
      attempts: 120,
      weight: 120,
      success: 120,
      totalLoad: 120,
      grade: 120,
    };
  
    const tableWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0);
  
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.container}>
          <TopNav showBackButton={true} />
          <View style={styles.wrapper}>
            <Text style={styles.title}>{judgeResults.judge.name}</Text>
            <Text style={styles.title}>{judgeResults.event.name}</Text>
            <ScrollView horizontal contentContainerStyle={styles.scrollViewContent}>
              <View style={[styles.tableContainer, { width: tableWidth }]}>
                {judgeResults.contestants.map((contestant, index) => {
                  const contestantData = judgeResults.weight_added[contestant.event_contestant_id];
                  const totalWeight = calculateTotalWeight(contestantData.weight);
                  const grade = getGrade(totalWeight);
  
                  return (
                    <View key={index} style={styles.contestantSection}>
                      <Text style={styles.contestantName}>{contestant.event_contestant_name}</Text>
                      <View style={styles.criteriaTable}>
                        <View style={styles.tableRow}>
                          <Text style={[styles.tableHeader, { width: columnWidths.initialWeight }]}>Initial Weight</Text>
                          <Text style={[styles.tableHeader, { width: columnWidths.addedWeight }]}>Added Weight</Text>
                          <Text style={[styles.tableHeader, { width: columnWidths.unit }]}>Unit</Text>
                          <Text style={[styles.tableHeader, { width: columnWidths.attempts }]}>Attempts</Text>
                          <Text style={[styles.tableHeader, { width: columnWidths.weight }]}>Weight</Text>
                          <Text style={[styles.tableHeader, { width: columnWidths.success }]}>Success</Text>
                          <Text style={[styles.tableHeader, { width: columnWidths.totalLoad }]}>Total Load</Text>
                          <Text style={[styles.tableHeader, { width: columnWidths.grade }]}>Grade</Text>
                        </View>
                        {contestantData.weight.map((attempt, attemptIndex) => (
                          <View key={attemptIndex} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { width: columnWidths.initialWeight }]}>{attemptIndex === 0 ? contestantData.initial.weight : ''}</Text>
                            <Text style={[styles.tableCell, { width: columnWidths.addedWeight }]}>{attemptIndex === 0 ? contestantData.initial.add_weight : ''}</Text>
                            <Text style={[styles.tableCell, { width: columnWidths.unit }]}>{attemptIndex === 0 ? contestantData.initial.unit : ''}</Text>
                            <Text style={[styles.tableCell, { width: columnWidths.attempts }]}>Attempt {attemptIndex + 1}</Text>
                            <Text style={[styles.tableCell, { width: columnWidths.weight }]}>{attempt.weight}</Text>
                            <Text style={[styles.tableCell, { width: columnWidths.success }]}>{attempt.success === "1" ? "Success" : "Fail"}</Text>
                            <Text style={[styles.tableCell, { width: columnWidths.totalLoad }]}>{attemptIndex === contestantData.weight.length - 1 ? totalWeight.toFixed(2) : ''}</Text>
                            <Text style={[styles.tableCell, { width: columnWidths.grade }]}>{attemptIndex === contestantData.weight.length - 1 ? grade : ''}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    wrapper: {
      padding: 10,
      alignItems: 'center',
    },
    scrollViewContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 10,
      color: 'black'
    },
    tableContainer: {
      borderWidth: 1,
      borderColor: '#ddd',
      alignSelf: 'center',
    },
    contestantSection: {
      marginBottom: 20,
    },
    contestantName: {
      fontSize: 16,
      fontWeight: 'bold',
      padding: 10,
      backgroundColor: '#e0e0e0',
      textAlign: 'center',
      color: 'black'
    },
    criteriaTable: {
      borderWidth: 1,
      borderColor: '#ddd',
      
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
    },
    tableHeader: {
      fontSize: 14,
      fontWeight: 'bold',
      padding: 10,
      borderRightWidth: 1,
      borderRightColor: '#ddd',
      textAlign: 'center',
      backgroundColor: '#f0f0f0',
      color: 'black'
    },
    tableCell: {
      fontSize: 14,
      padding: 10,
      borderRightWidth: 1,
      borderRightColor: '#ddd',
      textAlign: 'center',
      color: 'black'
    },
  });

export default ResultScreen3;