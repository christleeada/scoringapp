import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import TopNav from '../components/TopNav';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ResultScreen1 = () => {
  const route = useRoute();
  const { judgeId, judgeName, eventId } = route.params;
  const [judgeResults, setJudgeResults] = useState({});
  const [error, setError] = useState(null);
  const [eventName, setEventName] = useState('');

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
        console.log(response.data)
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

  useEffect(() => {
    const fetchEventName = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error('Token not found');
        }

        const response = await axios.get(`https://mis.foundationu.com/api/score/event/${eventId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
    return isNaN(groupScore) ? 0 : groupScore.toFixed(2);
  };

  const calculateWeightedScore = (contestantId, groupId) => {
    const groupScore = calculateGroupScore(contestantId, groupId);
    const groupWeight = judgeResults.criteria_groups.find(group => group.event_criteria_group_id === groupId).event_criteria_group_weight;
    const weightedScore = (groupScore * groupWeight / 100).toFixed(2);
    return isNaN(weightedScore) ? 0 : weightedScore;
  };

  const calculateOverallScore = (contestantId) => {
    let overallScore = 0;
  
    if (judgeResults.criteria_groups) {
      for (let group of judgeResults.criteria_groups) {
        const criteriaGroupScores = judgeResults.scores[contestantId][group.event_criteria_group_id];
        for (let criteriaId in criteriaGroupScores) {
          overallScore += parseFloat(criteriaGroupScores[criteriaId]);
        }
      }
    }
  
    return isNaN(overallScore) ? 0 : overallScore.toFixed(2);
  };

  const columnWidths = {
    contestant: 200,
    judge: 100,
    total: 100,
    criteria_group: 500,
    criterias: 100,
    eventname: 1400,
  };

  const headerRowStyle = [styles.tableHeaderRow, { width: Dimensions.get('window').width }];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <TopNav showBackButton={true} />
        <ScrollView
          horizontal
          contentContainerStyle={styles.scrollViewContent}
          style={styles.scrollView}
        >
          <View style={styles.wrapper}>
            <Text style={styles.title}>{judgeName}</Text>
            <Text style={styles.title}>{eventName}</Text>
            <View style={styles.tableContainer}>
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
              
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableHeader, { width: columnWidths.contestant }]}> </Text>
      
                {judgeResults.criteria_groups &&
                  judgeResults.criteria_groups.map((group, index) => (
                    <Text
                      key={index}
                      style={[styles.tableHeader, { width: columnWidths.criteria_group }]}
                      colSpan={judgeResults.criterias?.[group.event_criteria_group_id]?.length || 1}
                    >
                      {group.event_criteria_group_name} ({group.event_criteria_group_weight}%)
                    </Text>
                  ))}

                <Text style={[styles.tableHeader, { width: columnWidths.criterias }]}></Text>
                <Text style={[styles.tableHeader, { width: columnWidths.criterias }]}></Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tableHeader, { width: columnWidths.contestant }]}>Contestants</Text>
                {judgeResults.criterias &&
                  Object.keys(judgeResults.criterias).map((groupId, index) => (
                    judgeResults.criterias[groupId].map((criteria, criteriaIndex) => (
                      <Text
                        key={criteriaIndex}
                        style={[styles.tableHeader, { width: columnWidths.criterias }]}
                      >
                        {criteria.event_criteria_name} ({criteria.event_criteria_weight}%)
                      </Text>
                    )).concat(
                      <Text
                        key={`score-${groupId}`}
                        style={[styles.tableHeader, { width: columnWidths.criterias }]}
                      >
                        Score
                      </Text>
                    )
                  ))
                }
                <Text style={[styles.tableHeader, { width: columnWidths.criterias }]}>Total Score</Text>

                <Text style={[styles.tableHeader, { width: columnWidths.criterias }]}>Rank</Text>
              </View>

              {judgeResults.contestants &&
                judgeResults.contestants.map((contestant, index) => {
                  return (
                    <View key={index} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: columnWidths.contestant }]}>{contestant.event_contestant_name}</Text>

                      {judgeResults.criteria_groups &&
                        judgeResults.criteria_groups.map((group, groupIndex) => (
                          <View key={groupIndex} style={{ flexDirection: 'row' }}>
                            {judgeResults.criterias?.[group.event_criteria_group_id] &&
                              judgeResults.criterias[group.event_criteria_group_id].map((criteria, criteriaIndex) => (
                                <Text key={criteriaIndex} style={[styles.tableCell, { width: columnWidths.criterias }]}>
                                  {isNaN(judgeResults.scores[contestant.event_contestant_id]?.[group.event_criteria_group_id]?.[criteria.event_criteria_id]) ? 0 : 
                                   (judgeResults.scores[contestant.event_contestant_id]?.[group.event_criteria_group_id]?.[criteria.event_criteria_id] || 0)}%
                                </Text>
                              ))}
                            <Text style={[styles.tableCell, { width: columnWidths.criterias }]}>
                              {isNaN(calculateGroupScore(contestant.event_contestant_id, group.event_criteria_group_id)) ? 0 : calculateGroupScore(contestant.event_contestant_id, group.event_criteria_group_id)}%
                            </Text>
            
                          </View>
                        ))}
                  <Text style={[styles.tableCell, { width: columnWidths.criterias }]}>
                    {calculateOverallScore(contestant.event_contestant_id)}%
                  </Text>
                  <Text style={[styles.tableCell, { width: columnWidths.criterias }]}>
                    {judgeResults.rank[contestant.event_contestant_id]}
                  </Text>
                    </View>
                  );
                })}
            </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableHeaderRow: {
    backgroundColor: '#f9f9f9',
  },
  tableHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 14,
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    textAlign: 'center',
  },
});

export default ResultScreen1;
