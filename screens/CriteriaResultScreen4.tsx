import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import TopNav from '../components/TopNav';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const CriteriaResultScreen4 = () => {
  const route = useRoute();
  const { eventId, criteriaId, criteriaName } = route.params;
  const [judgeResults, setJudgeResults] = useState({});
  const [error, setError] = useState(null);
  const [eventName, setEventName] = useState('');

  
  console.log('Event ID:', eventId);
  console.log('Criteria ID:', criteriaId);

  const fetchResults = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.get(
        `https://mis.foundationu.com/api/score/result-criteria/${eventId}/${criteriaId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        setJudgeResults(response.data);
        console.log(response.data);
      } else {
        throw new Error(
          `Failed to fetch results, status code: ${response.status}`,
        );
      }
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [eventId, criteriaId]);

  useEffect(() => {
    const fetchEventName = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error('Token not found');
        }

        const response = await axios.get(
          `https://mis.foundationu.com/api/score/event/${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.item && response.data.item.name) {
          setEventName(response.data.item.name);
        } else {
          throw new Error('Event name not found in the response');
        }
      } catch (error) {
        console.error('Error fetching event name:', error);
      }
    };

    fetchEventName();
  }, [eventId]);

  if (error) {
    return (
      <View>
        <Text>Error fetching data: {error}</Text>
      </View>
    );
  }

  const calculateGroupScore = (contestantId, groupId) => {
    let groupScore = 0;
    const criteriaGroupScores = judgeResults.scores[contestantId][groupId];
    for (let criteriaId in criteriaGroupScores) {
      groupScore += parseFloat(criteriaGroupScores[criteriaId]);
    }
    return groupScore.toFixed(2);
  };

  const calculateWeightedScore = (contestantId, groupId) => {
    const groupScore = calculateGroupScore(contestantId, groupId);
    const groupWeight = judgeResults.criteria_groups.find(
      group => group.event_criteria_group_id === groupId,
    ).event_criteria_group_weight;
    return ((groupScore * groupWeight) / 100).toFixed(2);
  };

  const calculateOverallScore = contestantId => {
    let overallScore = 0;

    if (judgeResults.criteria_groups) {
      for (let group of judgeResults.criteria_groups) {
        overallScore += parseFloat(
          calculateWeightedScore(contestantId, group.event_criteria_group_id),
        );
      }
    }

    return overallScore.toFixed(2);
  };

  const columnWidths = {
    contestant: 200,
    judge: 100,
    criteriaGroup: 300,
    total: 100,
    criterias: 100,
    eventname: 900,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <TopNav showBackButton={true} />
        <ScrollView
          horizontal
          contentContainerStyle={styles.scrollViewContent}
          style={styles.scrollView}>
          <View style={styles.wrapper}>
            <Text style={styles.title}>{eventName}</Text>
            <Text style={styles.subtitle}>{criteriaName}</Text>
            <ScrollView horizontal>
              <View style={{ flexDirection: 'row' }}>
                <View>
                  <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    <Text style={[styles.tableHeader, { width: columnWidths.contestant }]}>
                      Contestants
                    </Text>
                    {judgeResults.judges &&
                      judgeResults.judges.map(judge => (
                        <View key={judge.name} style={{ width: columnWidths.criteriaGroup }}>
                          <Text style={styles.tableHeader}>{judge.name}</Text>
                          <View style={{ flexDirection: 'row' }}>
                            <Text style={[styles.tableHeader, { width: columnWidths.judge }]}>Score</Text>
                            <Text style={[styles.tableHeader, { width: columnWidths.judge }]}>Rank</Text>
                          </View>
                        </View>
                      ))}
                    <Text style={[styles.tableHeader, { width: columnWidths.total }]}>Total Score</Text>
                    <Text style={[styles.tableHeader, { width: columnWidths.total }]}>Total Rank</Text>
                    <Text style={[styles.tableHeader, { width: columnWidths.total }]}>Final Rank</Text>
                  </View>

                  {judgeResults.contestants &&
                    judgeResults.contestants.map(contestant => (
                      <View key={contestant.event_contestant_id} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { width: columnWidths.contestant }]}>
                          {contestant.event_contestant_name}
                        </Text>
                        {judgeResults.judges.map(judge => (
                          <View key={judge.name} style={{ width: columnWidths.criteriaGroup }}>
                            <View style={{ flexDirection: 'row' }}>
                              <Text style={[styles.tableCell, { width: columnWidths.judge }]}>
                                {judgeResults.scores[contestant.event_contestant_id][judge.judge_id].score}
                              </Text>
                              <Text style={[styles.tableCell, { width: columnWidths.judge }]}>
                                {judgeResults.scores[contestant.event_contestant_id][judge.judge_id].rank}
                              </Text>
                            </View>
                          </View>
                        ))}
                        <Text style={[styles.tableCell, { width: columnWidths.total }]}>
                          {calculateOverallScore(contestant.event_contestant_id)}
                        </Text>
                        <Text style={[styles.tableCell, { width: columnWidths.total }]}>
                          {contestant.total_rank}
                        </Text>
                        <Text style={[styles.tableCell, { width: columnWidths.total }]}>
                          {contestant.final_rank}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  wrapper: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: 'black',
    marginVertical: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: 'black',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: 'black',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    padding: 10,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'black',
  },
});

export default CriteriaResultScreen4;
