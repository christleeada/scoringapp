import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import TopNav from '../components/TopNav';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRoute} from '@react-navigation/native';

const OverallResultScreen2 = () => {
  const route = useRoute();
  const {eventId} = route.params;
  const [overallResults, setOverallResults] = useState(null);
  const [eventName, setEventName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error('Token not found');
        }

        const [overallRes, eventRes] = await Promise.all([
          axios.get(
            `https://mis.foundationu.com/api/score/result-overall/${eventId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          ),
          axios.get(`https://mis.foundationu.com/api/score/event/${eventId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (overallRes.status === 200 && eventRes.status === 200) {
          setOverallResults(overallRes.data);
          setEventName(eventRes.data.item.name);
          console.log(overallRes.data);
        } else {
          throw new Error(
            `Failed to fetch data, status code: ${overallRes.status} ${eventRes.status}`,
          );
        }
      } catch (error) {
        setError(error.message);
      }
    };

    fetchData();
  }, [eventId]);

  if (error) {
    return (
      <View>
        <Text>Error fetching data: {error}</Text>
      </View>
    );
  }

  if (!overallResults || !eventName) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  const {contestants, criteria_groups, judges, scores} = overallResults;

  const calculateWeightedAverageScore = contestantId => {
    const score = scores[contestantId]?.['']?.[''];
    return score ? {[criteria_groups[0].event_criteria_group_id]: score} : {};
  };

  const calculateCriteriaGroupAverageScore = contestantId => {
    const score = scores[contestantId]?.['']?.[''];
    return score ? {[criteria_groups[0].event_criteria_group_id]: score} : {};
  };

  const formatScore = score => {
    if (score === null || score === undefined || isNaN(score)) {
      return '0.00';
    }
    return Number(score).toFixed(2);
  };

  const getColumnWidths = () => {
    const contestantWidth = 200;
    const judgeWidth = 100;
    const totalWidth = 100;
    const criteriaGroupWidth = judgeWidth * judges.length + 2 * totalWidth;

    return {
      contestant: contestantWidth,
      judge: judgeWidth,
      total: totalWidth,
      criteriaGroup: criteriaGroupWidth,
    };
  };

  const columnWidths = getColumnWidths();
  const headerRowStyle = [
    styles.tableHeaderRow,
    {width: Dimensions.get('window').width},
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <TopNav showBackButton={true} />
        <View style={styles.wrapper}>
          <Text style={styles.title}>Overall Results for {eventName}</Text>
          <ScrollView
            horizontal
            contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.tableContainer}>
              <View style={headerRowStyle}>
                {criteria_groups.map((criteria_group, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      width: columnWidths.criteriaGroup,
                    }}>
                    <Text
                      style={[
                        styles.tableHeader,
                        {width: columnWidths.criteriaGroup},
                      ]}>
                      {criteria_group.event_criteria_group_name} (
                      {criteria_group.event_criteria_group_weight}%)
                    </Text>
                  </View>
                ))}
              </View>
              <View style={headerRowStyle}>
                <Text
                  style={[
                    styles.tableHeader,
                    {width: columnWidths.contestant},
                  ]}>
                  Contestant
                </Text>
                {criteria_groups.map((criteria_group, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      width: columnWidths.criteriaGroup,
                    }}>
                    {judges.map((judge, jIndex) => (
                      <Text
                        key={`${index}-${jIndex}`}
                        style={[
                          styles.tableHeader,
                          {width: columnWidths.judge},
                        ]}>
                        {judge.event_judge_name}
                      </Text>
                    ))}
                    <Text
                      style={[styles.tableHeader, {width: columnWidths.total}]}>
                      Average Score
                    </Text>
                    <Text
                      style={[styles.tableHeader, {width: columnWidths.total}]}>
                      Weighted Average Score
                    </Text>
                  </View>
                ))}
                <Text style={[styles.tableHeader, {width: columnWidths.total}]}>
                  Overall Score
                </Text>
              </View>
              {contestants.map((contestant, index) => {
                const criteriaGroupAverageScores =
                  calculateCriteriaGroupAverageScore(
                    contestant.event_contestant_id,
                  );
                const criteriaGroupWeightedAverageScores =
                  calculateWeightedAverageScore(contestant.event_contestant_id);
                const overallScore =
                  scores[contestant.event_contestant_id]?.['']?.[''] || 0;

                return (
                  <View key={index} style={styles.tableRow}>
                    <Text
                      style={[
                        styles.tableCell,
                        {width: columnWidths.contestant},
                      ]}>
                      {contestant.event_contestant_name}
                    </Text>
                    {criteria_groups.map((group, gIndex) => (
                      <React.Fragment key={gIndex}>
                        {judges.map((judge, jIndex) => (
                          <Text
                            key={`${gIndex}-${jIndex}`}
                            style={[
                              styles.tableCell,
                              {width: columnWidths.judge},
                            ]}>
                            {formatScore(overallScore)}%
                          </Text>
                        ))}
                        <Text
                          style={[
                            styles.tableCell,
                            {width: columnWidths.total},
                          ]}>
                          {formatScore(
                            criteriaGroupAverageScores[
                              group.event_criteria_group_id
                            ],
                          )}
                          %
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            {width: columnWidths.total},
                          ]}>
                          {formatScore(
                            criteriaGroupWeightedAverageScores[
                              group.event_criteria_group_id
                            ],
                          )}
                          %
                        </Text>
                      </React.Fragment>
                    ))}
                    <Text
                      style={[styles.tableCell, {width: columnWidths.total}]}>
                      {formatScore(overallScore)}%
                    </Text>
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
  tableContainer: {
    borderWidth: 0,
    borderColor: 'black',
    marginVertical: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 0,
    borderColor: 'black',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    borderWidth: 0,
    borderColor: 'black',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    padding: 10,
    textAlign: 'center',
    borderWidth: 0,
    borderColor: 'black',
  },
});

export default OverallResultScreen2;
