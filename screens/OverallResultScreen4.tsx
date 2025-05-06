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

const OverallResultScreen4 = () => {
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

  const {
    contestants,
    criteria_groups,
    judges,
    scores_sand_sculpture,
    scores,
    rank,
  } = overallResults;

  const calculateWeightedAverageScore = contestantId => {
    const groupAverageScores = {};

    criteria_groups.forEach(group => {
      let groupTotalScore = 0;
      let groupTotalWeight = 0;

      judges.forEach(judge => {
        const judgeScore =
          scores[contestantId]?.[group.event_criteria_group_id]?.[
            judge.event_judge_id
          ];
        if (judgeScore) {
          groupTotalScore += judgeScore;
          groupTotalWeight += 1;
        }
      });

      if (groupTotalWeight > 0) {
        const averageScore = groupTotalScore / groupTotalWeight;

        const weightedAverageScore =
          averageScore * (group.event_criteria_group_weight / 100);
        groupAverageScores[group.event_criteria_group_id] =
          weightedAverageScore;
      } else {
        groupAverageScores[group.event_criteria_group_id] = 0;
      }
    });

    return groupAverageScores;
  };

  const calculateCriteriaGroupAverageScore = contestantId => {
    const groupAverageScores = {};

    criteria_groups.forEach(group => {
      let groupTotalScore = 0;
      let groupTotalWeight = 0;

      judges.forEach(judge => {
        const judgeScore =
          scores[contestantId]?.[group.event_criteria_group_id]?.[
            judge.event_judge_id
          ];
        if (judgeScore) {
          groupTotalScore += judgeScore;
          groupTotalWeight += 1;
        }
      });

      if (groupTotalWeight > 0) {
        groupAverageScores[group.event_criteria_group_id] =
          groupTotalScore / groupTotalWeight;
      } else {
        groupAverageScores[group.event_criteria_group_id] = 0;
      }
    });

    return groupAverageScores;
  };

  const calculateAverageScore = contestantId => {
    let totalScore = 0;
    let totalWeightedScore = 0;
    let totalWeight = 0;

    judges.forEach(judge => {
      const sandSculptureScore =
        scores_sand_sculpture[contestantId]?.[judge.event_judge_id]?.score;

      if (sandSculptureScore) {
        const weightedScore = sandSculptureScore * 0.5;
        totalScore += sandSculptureScore;
        totalWeightedScore += weightedScore;
        totalWeight += 0.5;
      }
    });

    return {
      averageScore: (totalScore / judges.length).toFixed(2),
    };
  };

  const formatScore = score => {
    return score ? score.toFixed(2) : 0;
  };

  const columnWidths = {
    contestant: 200,
    judge: 100,
    total: 100,
  };

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
                <Text
                  style={[
                    styles.tableHeader,
                    {width: columnWidths.contestant},
                  ]}>
                  Contestant
                </Text>
                <Text style={[styles.tableHeader, {width: 300}]}>
                  Height to Area Ratio (50%)
                </Text>
                <Text style={[styles.tableHeader, {width: 200}]}> </Text>
                {criteria_groups.map((criteria_group, index) => (
                  <Text key={index} style={[styles.tableHeader, {width: 300}]}>
                    {criteria_group.event_criteria_group_name} (
                    {criteria_group.event_criteria_group_weight}%)
                  </Text>
                ))}
                <Text style={[styles.tableHeader, {width: columnWidths.total}]}>
                  {' '}
                </Text>
                <Text style={[styles.tableHeader, {width: columnWidths.total}]}>
                  {' '}
                </Text>
                <Text
                  style={[
                    styles.tableHeader,
                    {width: columnWidths.total},
                  ]}></Text>
              </View>
              <View style={headerRowStyle}>
                <Text
                  style={[styles.tableHeader, {width: columnWidths.contestant}]}
                />
                {judges.map((judge, index) => (
                  <Text
                    key={index}
                    style={[styles.tableHeader, {width: columnWidths.judge}]}>
                    {judge.event_judge_name}
                  </Text>
                ))}
                <Text style={[styles.tableHeader, {width: columnWidths.total}]}>
                  Average Score
                </Text>
                <Text style={[styles.tableHeader, {width: columnWidths.total}]}>
                  Weighted Average Score
                </Text>
                {judges.map((judge, index) => (
                  <Text
                    key={index}
                    style={[styles.tableHeader, {width: columnWidths.judge}]}>
                    {judge.event_judge_name}
                  </Text>
                ))}
                <Text style={[styles.tableHeader, {width: columnWidths.total}]}>
                  Average Score
                </Text>
                <Text style={[styles.tableHeader, {width: columnWidths.total}]}>
                  Weighted Average Score
                </Text>
                <Text style={[styles.tableHeader, {width: columnWidths.total}]}>
                  Overall Score
                </Text>
              </View>
              {contestants.map((contestant, index) => {
                const {averageScore, weightedAverageScore} =
                  calculateAverageScore(contestant.event_contestant_id);
                return (
                  <View key={index} style={styles.tableRow}>
                    <Text
                      style={[
                        styles.tableCell,
                        {width: columnWidths.contestant},
                      ]}>
                      {contestant.event_contestant_name}
                    </Text>
                    {judges.map((judge, jIndex, gIndex) => (
                      <Text
                        key={`${gIndex}-${jIndex}`}
                        style={[styles.tableCell, {width: columnWidths.judge}]}>
                        {formatScore(
                          scores_sand_sculpture[
                            contestant.event_contestant_id
                          ]?.[judge.event_judge_id]?.score,
                        )}
                        %
                      </Text>
                    ))}
                    <Text
                      style={[styles.tableCell, {width: columnWidths.total}]}>
                      {averageScore}%
                    </Text>
                    <Text
                      style={[styles.tableCell, {width: columnWidths.total}]}>
                      {formatScore(averageScore * 0.5)}%
                    </Text>
                    {criteria_groups.map((group, gIndex) =>
                      judges.map((judge, jIndex) => (
                        <Text
                          key={`${gIndex}-${jIndex}`}
                          style={[
                            styles.tableCell,
                            {width: columnWidths.judge},
                          ]}>
                          {formatScore(
                            scores[contestant.event_contestant_id]?.[
                              group.event_criteria_group_id
                            ]?.[judge.event_judge_id],
                          )}
                          %
                        </Text>
                      )),
                    )}

                    {Object.keys(
                      calculateCriteriaGroupAverageScore(
                        contestant.event_contestant_id,
                      ),
                    ).map((groupId, index) => (
                      <Text
                        key={index}
                        style={[styles.tableCell, {width: columnWidths.total}]}>
                        {formatScore(
                          calculateCriteriaGroupAverageScore(
                            contestant.event_contestant_id,
                          )[groupId],
                        )}
                        %
                      </Text>
                    ))}
                    {Object.keys(
                      calculateWeightedAverageScore(
                        contestant.event_contestant_id,
                      ),
                    ).map((groupId, index) => (
                      <Text
                        key={index}
                        style={[styles.tableCell, {width: columnWidths.total}]}>
                        {formatScore(
                          calculateWeightedAverageScore(
                            contestant.event_contestant_id,
                          )[groupId],
                        )}
                        %
                      </Text>
                    ))}
                    {Object.keys(
                      calculateWeightedAverageScore(
                        contestant.event_contestant_id,
                      ),
                    ).map((groupId, index) => (
                      <Text
                        style={[styles.tableCell, {width: columnWidths.total}]}>
                        {formatScore(
                          averageScore * 0.5 +
                            calculateWeightedAverageScore(
                              contestant.event_contestant_id,
                            )[groupId],
                        )}
                        %
                      </Text>
                    ))}
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

export default OverallResultScreen4;
