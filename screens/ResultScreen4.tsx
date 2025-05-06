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
import {useRoute} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ResultScreen4 = () => {
  const route = useRoute();
  const {judgeId, judgeName, eventId, eventTypeId} = route.params;
  const [judgeResults, setJudgeResults] = useState({});
  const [error, setError] = useState(null);
  const [eventName, setEventName] = useState('');

  const fetchJudgeResults = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.get(
        `https://mis.foundationu.com/api/score/result-judge/${eventId}/${judgeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        setJudgeResults(response.data);
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
    fetchJudgeResults();
  }, [eventId, judgeId]);

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

  const calculateRatio = (height, area) => {
    if (area > 0) {
      const ratio = (height / area).toFixed(2);
      return isNaN(ratio) ? 0 : ratio;
    }
    return 0;
  };

  const calculateTotalScore = contestantId => {
    let totalScore = 0;
    let sandSculptureScore = 0;

    if (judgeResults.scores_sand_sculpture[contestantId]) {
      const {height, area} = judgeResults.scores_sand_sculpture[contestantId];
      const ratio = parseFloat(calculateRatio(height, area));
      sandSculptureScore = (parseFloat(height) + parseFloat(area) + ratio) * 5;
    }

    totalScore += sandSculptureScore;

    if (judgeResults.scores[contestantId]) {
      for (let groupId in judgeResults.scores[contestantId]) {
        if (groupId !== '1') {
          const criteriaGroupScores =
            judgeResults.scores[contestantId][groupId];
          for (let criteriaId in criteriaGroupScores) {
            totalScore += parseFloat(criteriaGroupScores[criteriaId]);
          }
        }
      }
    }

    const weightedTotalScore = totalScore * 0.5;

    return {
      totalScore: isNaN(totalScore) ? 0 : totalScore.toFixed(2),
      weightedTotalScore: isNaN(weightedTotalScore)
        ? 0
        : weightedTotalScore.toFixed(2),
    };
  };

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
    const groupWeight = judgeResults.criteria_groups.find(
      group => group.event_criteria_group_id === groupId,
    ).event_criteria_group_weight;
    const weightedScore = ((groupScore * groupWeight) / 100).toFixed(2);
    return isNaN(weightedScore) ? 0 : weightedScore;
  };

  const calculateOverallScore = contestantId => {
    const {weightedTotalScore} = calculateTotalScore(contestantId);
    let overallScore = parseFloat(weightedTotalScore);

    if (judgeResults.criteria_groups) {
      for (let group of judgeResults.criteria_groups) {
        overallScore += parseFloat(
          calculateWeightedScore(contestantId, group.event_criteria_group_id),
        );
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

  const headerRowStyle = [
    styles.tableHeaderRow,
    {width: Dimensions.get('window').width},
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <TopNav showBackButton={true} />
        <ScrollView
          horizontal
          contentContainerStyle={styles.scrollViewContent}
          style={styles.scrollView}>
          <View style={styles.wrapper}>
            <Text style={styles.title}>{judgeName}</Text>

            <View style={styles.tableContainer}>
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <Text
                  style={[styles.tableHeader, {width: columnWidths.eventname}]}>
                  {eventName}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text
                  style={[
                    styles.tableHeader,
                    {width: columnWidths.contestant},
                  ]}>
                  {' '}
                </Text>
                <Text
                  style={[
                    styles.tableHeader,
                    {width: columnWidths.criteria_group},
                  ]}>
                  Height To Area Ratio (50%)
                </Text>

                {judgeResults.criteria_groups &&
                  judgeResults.criteria_groups.map((group, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.tableHeader,
                        {width: columnWidths.criteria_group},
                      ]}
                      colSpan={
                        judgeResults.criterias?.[group.event_criteria_group_id]
                          ?.length || 1
                      }>
                      {group.event_criteria_group_name} (
                      {group.event_criteria_group_weight}%)
                    </Text>
                  ))}

                <Text
                  style={[
                    styles.tableHeader,
                    {width: columnWidths.criterias},
                  ]}></Text>
                <Text
                  style={[
                    styles.tableHeader,
                    {width: columnWidths.criterias},
                  ]}></Text>
              </View>

              <View style={styles.tableRow}>
                <Text
                  style={[
                    styles.tableHeader,
                    {width: columnWidths.contestant},
                  ]}>
                  Contestant
                </Text>
                <Text
                  style={[styles.tableHeader, {width: columnWidths.criterias}]}>
                  Height
                </Text>
                <Text
                  style={[styles.tableHeader, {width: columnWidths.criterias}]}>
                  Area
                </Text>
                <Text
                  style={[styles.tableHeader, {width: columnWidths.criterias}]}>
                  Ratio
                </Text>
                <Text
                  style={[styles.tableHeader, {width: columnWidths.criterias}]}>
                  Total Score
                </Text>
                <Text
                  style={[styles.tableHeader, {width: columnWidths.criterias}]}>
                  Weighted Total Score
                </Text>

                {judgeResults.criterias &&
                  Object.keys(judgeResults.criterias).map((groupId, index) =>
                    judgeResults.criterias[groupId].map(
                      (criteria, criteriaIndex) => (
                        <Text
                          key={criteriaIndex}
                          style={[
                            styles.tableHeader,
                            {width: columnWidths.criterias},
                          ]}>
                          {criteria.event_criteria_name} (
                          {criteria.event_criteria_weight}%)
                        </Text>
                      ),
                    ),
                  )}
                <Text
                  style={[styles.tableHeader, {width: columnWidths.criterias}]}>
                  Total Score
                </Text>
                <Text
                  style={[styles.tableHeader, {width: columnWidths.criterias}]}>
                  Weighted Total Score
                </Text>
                <Text
                  style={[styles.tableHeader, {width: columnWidths.criterias}]}>
                  Overall Score
                </Text>
              </View>

              {judgeResults.contestants &&
                judgeResults.contestants.map((contestant, index) => {
                  const {height, area} =
                    judgeResults.scores_sand_sculpture[
                      contestant.event_contestant_id
                    ] || {};
                  const ratio = calculateRatio(height, area);
                  const {totalScore, weightedTotalScore} = calculateTotalScore(
                    contestant.event_contestant_id,
                  );
                  return (
                    <View key={index} style={styles.tableRow}>
                      <Text
                        style={[
                          styles.tableCell,
                          {width: columnWidths.contestant},
                        ]}>
                        {contestant.event_contestant_name}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          {width: columnWidths.criterias},
                        ]}>
                        {isNaN(height) ? 0 : height || 0}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          {width: columnWidths.criterias},
                        ]}>
                        {isNaN(area) ? 0 : area || 0}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          {width: columnWidths.criterias},
                        ]}>
                        {isNaN(ratio) ? 0 : ratio || 0}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          {width: columnWidths.criterias},
                        ]}>
                        {isNaN(totalScore) ? 0 : totalScore}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          {width: columnWidths.criterias},
                        ]}>
                        {isNaN(weightedTotalScore) ? 0 : weightedTotalScore}
                      </Text>
                      {judgeResults.criteria_groups &&
                        judgeResults.criteria_groups.map(
                          (group, groupIndex) => (
                            <View
                              key={groupIndex}
                              style={{flexDirection: 'row'}}>
                              {judgeResults.criterias?.[
                                group.event_criteria_group_id
                              ] &&
                                judgeResults.criterias[
                                  group.event_criteria_group_id
                                ].map((criteria, criteriaIndex) => (
                                  <Text
                                    key={criteriaIndex}
                                    style={[
                                      styles.tableCell,
                                      {width: columnWidths.criterias},
                                    ]}>
                                    {isNaN(
                                      judgeResults.scores[
                                        contestant.event_contestant_id
                                      ]?.[group.event_criteria_group_id]?.[
                                        criteria.event_criteria_id
                                      ],
                                    )
                                      ? 0
                                      : judgeResults.scores[
                                          contestant.event_contestant_id
                                        ]?.[group.event_criteria_group_id]?.[
                                          criteria.event_criteria_id
                                        ] || 0}
                                  </Text>
                                ))}
                              <Text
                                style={[
                                  styles.tableCell,
                                  {width: columnWidths.criterias},
                                ]}>
                                {isNaN(
                                  calculateGroupScore(
                                    contestant.event_contestant_id,
                                    group.event_criteria_group_id,
                                  ),
                                )
                                  ? 0
                                  : calculateGroupScore(
                                      contestant.event_contestant_id,
                                      group.event_criteria_group_id,
                                    )}
                                %
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  {width: columnWidths.criterias},
                                ]}>
                                {isNaN(
                                  calculateWeightedScore(
                                    contestant.event_contestant_id,
                                    group.event_criteria_group_id,
                                  ),
                                )
                                  ? 0
                                  : calculateWeightedScore(
                                      contestant.event_contestant_id,
                                      group.event_criteria_group_id,
                                    )}
                                %
                              </Text>
                            </View>
                          ),
                        )}
                      <Text
                        style={[
                          styles.tableCell,
                          {width: columnWidths.criterias},
                        ]}>
                        {isNaN(
                          calculateOverallScore(contestant.event_contestant_id),
                        )
                          ? 0
                          : calculateOverallScore(
                              contestant.event_contestant_id,
                            )}
                        %
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
    fontSize: 18,
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

export default ResultScreen4;
