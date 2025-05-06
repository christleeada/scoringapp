import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import TopNav from '../components/TopNav';
import Icon from 'react-native-vector-icons/FontAwesome';
import Slider from '@react-native-community/slider';
import RNPickerSelect from 'react-native-picker-select';
import {useNavigation} from '@react-navigation/native';
import {RouteProp, useRoute} from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Manage: {eventId: number; eventName: string; eventTypeId: number};
};

const ManageScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('contestants');
  const [sideNavVisible, setSideNavVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const [selectedStatus, setSelectedStatus] = useState('');
  const route = useRoute<RouteProp<RootStackParamList, 'Manage'>>();
  const {eventId, eventTypeId} = route.params;
  const [eventName, setEventName] = useState('');
  const [contestants, setContestants] = useState([]);
  const [specialAwardName, setSpecialAwardName] = useState('');
  const [specialAwards, setSpecialAwards] = useState([]);
  const [awardWeight, setAwardWeight] = useState(0);
  console.log('event id: ', eventId);

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
          console.log(response.data.item.name);

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

  useEffect(() => {
    if (isAnimating) {
      Animated.timing(slideAnim, {
        toValue: sideNavVisible ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setIsAnimating(false);
      });
    }
  }, [isAnimating, sideNavVisible]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [contestantName, setContestantName] = useState('');

  const statuses = [
    {id: 1, name: 'enabled', value: '1'},
    {id: 2, name: 'disabled', value: '0'},
  ];
  const fetchContestants = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.get(
        `https://mis.foundationu.com/api/score/contestants/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        const contestantsData = response.data.contestants;
        setContestants(contestantsData);
      } else {
        throw new Error('Failed to fetch contestants');
      }
    } catch (error) {
      console.error('Error fetching contestants:', error);
    }
  };

  useEffect(() => {
    fetchContestants();
  }, [eventId]);

  const [judgeName, setJudgeName] = useState('');
  const [judgeCode, setJudgeCode] = useState('');
  const [judges, setJudges] = useState('');

  const fetchJudges = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.get(
        `https://mis.foundationu.com/api/score/judges/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        const judgesData = response.data.judges;
        setJudges(judgesData);
      } else {
        throw new Error('Failed to fetch judges');
      }
    } catch (error) {
      console.error('Error fetching judges:', error);
    }
  };

  useEffect(() => {
    fetchJudges();
  }, [eventId]);

  const [criteriaGroups, setCriteriaGroups] = useState([]);
  const [criteriaGroupName, setCriteriaGroupName] = useState('');
  const [weight, setWeight] = useState(0);
  const [criteriaGroupStatus, setCriteriaGroupStatus] = useState('1');
  const [totalWeight, setTotalWeight] = useState(0);

  const fetchCriteriaGroups = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.get(
        `https://mis.foundationu.com/api/score/criteria-groups/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        const criteriaGroupsData = response.data.groups;
        console.log(response.data.groups);
        if (!criteriaGroupsData) {
          throw new Error('Criteria groups not found in the response');
        }
        setCriteriaGroups(criteriaGroupsData);
      } else {
        throw new Error('Failed to fetch criteria groups');
      }
    } catch (error) {
      console.error('Error fetching criteria groups:', error);
    }
  };

  useEffect(() => {
    fetchCriteriaGroups();
  }, [eventId]);

  useEffect(() => {
    if (Array.isArray(criteriaGroups)) {
      const total = criteriaGroups
        .filter(group => group.weight !== '')
        .reduce((total, group) => total + parseInt(group.weight), 0);

      if (eventTypeId === '4') {
        setTotalWeight(total + 50);
      } else {
        setTotalWeight(total);
      }
    } else {
      console.error('criteriaGroups is not an array:', criteriaGroups);
    }
  }, [criteriaGroups, eventTypeId]);

  const [criterias, setCriterias] = useState([]);
  const [criteriaName, setCriteriaName] = useState('');
  const [criteriaWeight, setCriteriaWeight] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [remainingWeight, setRemainingWeight] = useState(100);

  const fetchCriterias = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.get(
        `https://mis.foundationu.com/api/score/criterias/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        const criteriasData = response.data.criterias;
        if (!criteriasData) {
          throw new Error('Criterias not found in the response');
        }
        setCriterias(criteriasData);
      } else {
        throw new Error('Failed to fetch criteria');
      }
    } catch (error) {
      console.error('Error fetching criteria:', error);
    }
  };

  useEffect(() => {
    fetchCriterias();
  }, [eventId]);

  const calculateRemainingWeight = () => {
    if (selectedGroup) {
      const group = criteriaGroups.find(group => group.id === selectedGroup);
      if (group) {
        const groupCriteria = criterias.filter(
          criteria => criteria.event_criteria_group_id === selectedGroup,
        );
        const totalWeightInGroup = groupCriteria.reduce(
          (total, crit) => total + parseInt(crit.weight),
          0,
        );
        const remainingWeightInGroup = group.weight - totalWeightInGroup;
        setRemainingWeight(
          remainingWeightInGroup < 0 ? 0 : remainingWeightInGroup,
        );
      }
    } else {
      const overallRemainingWeight = 100 - totalWeight;
      setRemainingWeight(
        overallRemainingWeight < 0 ? 0 : overallRemainingWeight,
      );
    }
  };

  useEffect(() => {
    calculateRemainingWeight();
  }, [selectedGroup, criteriaGroups, totalWeight]);

  const calculateTotalCriteriaWeight = () => {
    const criteriaSum = criterias.reduce(
      (total, criteria) => total + parseInt(criteria.weight),
      0,
    );

    return eventTypeId === '4' ? criteriaSum + 50 : criteriaSum;
  };

  const totalCriteriaWeight = calculateTotalCriteriaWeight();

  const fetchSpecialAwards = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.get(
        `https://mis.foundationu.com/api/score/special-awards/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        const specialAwardsData = response.data.special_awards;
        setSpecialAwards(specialAwardsData);
        console.log(response.data);
      } else {
        throw new Error('Failed to fetch special awards');
      }
    } catch (error) {
      console.error('Error fetching special awards:', error);
    }
  };

  useEffect(() => {
    fetchSpecialAwards();
  }, [eventId]);

  const [contestantWarningMessage, setContestantWarningMessage] = useState('');
  const handleAddContestant = async () => {
    try {
      if (!contestantName || !contestantName.trim()) {
        setContestantWarningMessage('Contestant Name is required');
        return;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const eventData = {
        name: contestantName,
        event_id: eventId,
      };

      const response = await axios.post(
        `https://mis.foundationu.com/api/score/contestant-create/${eventId}`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Contestant added successfully:', response.data);

      setContestantName('');
      setContestantWarningMessage('');
      toggleModal();
      fetchContestants();
    } catch (error) {
      console.error('Error adding contestant:', error);
      setContestantWarningMessage('Failed to add contestant');
    }
  };

  const handleRemoveContestant = async id => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const removeData = {
        remove: '1',
      };

      const response = await axios.post(
        `https://mis.foundationu.com/api/score/contestant-remove/${id}`,
        removeData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        console.log('Contestant removed successfully:', response.data);
        fetchContestants();
      } else {
        throw new Error('Failed to remove contestant');
      }
    } catch (error) {
      console.error('Error removing contestant:', error);
    }
  };
  const [judgeWarningMessage, setJudgeWarningMessage] = useState('');
  const handleAddJudge = async () => {
    try {
      if (!judgeName || !judgeCode || !judgeName.trim() || !judgeCode.trim()) {
        setJudgeWarningMessage('Judge Name and Pin Code are required');
        return;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.post(
        `https://mis.foundationu.com/api/score/judge-create/${eventId}`,
        {
          name: judgeName,
          pincode: judgeCode,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        setJudgeName('');
        setJudgeCode('');
        setJudgeWarningMessage('');
        toggleModal();
        fetchJudges();
        console.log('Judge added successfully:', response.data);
      } else {
        throw new Error('Failed to add judge');
      }
    } catch (error) {
      console.error('Error adding judge:', error);
      setJudgeWarningMessage('Failed to add judge');
    }
  };

  const handleRemoveJudge = async id => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const removeData = {
        remove: '1',
      };

      const response = await axios.post(
        `https://mis.foundationu.com/api/score/judge-remove/${id}`,
        removeData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        console.log('Judge removed successfully:', response.data);
        fetchJudges();
      } else {
        throw new Error('Failed to remove judge');
      }
    } catch (error) {
      console.error('Error removing judge:', error);
    }
  };

  const [cGWarningMessage, setCgWarningMessage] = useState('');

  const handleAddCriteriaGroup = async () => {
    try {
      if (!criteriaGroupName.trim()) {
        setCgWarningMessage('Criteria Group Name is required');
        return;
      }
      if (weight === 0) {
        setCgWarningMessage('Weight cannot be 0');
        return;
      }
      if (!criteriaGroupStatus) {
        setCgWarningMessage('Status is required');
        return;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.post(
        `https://mis.foundationu.com/api/score/criteria-group-create/${eventId}`,
        {
          name: criteriaGroupName,
          weight: weight,
          status: criteriaGroupStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        console.log('Criteria group added successfully:', response.data);
        setCriteriaGroupName('');
        setWeight(0);
        setCriteriaGroupStatus('1');
        setCgWarningMessage('');
        toggleModal();
        fetchCriteriaGroups();
      } else {
        throw new Error('Failed to add criteria group');
      }
    } catch (error) {
      console.error('Error adding criteria group:', error);
      setWarningMessage('Failed to add criteria group');
    }
  };

  const handleRemoveCriteriaGroup = async id => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const removeData = {
        remove: '1',
      };

      const response = await axios.post(
        `https://mis.foundationu.com/api/score/criteria-group-remove/${id}`,
        removeData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        console.log('Criteria group removed successfully:', response.data);
        fetchCriteriaGroups();
      } else {
        throw new Error('Failed to remove criteria group');
      }
    } catch (error) {
      console.error('Error removing criteria group:', error);
    }
  };
  const [specialAwardWarningMessage, setSpecialAwardWarningMessage] =
    useState('');
  const handleAddSpecialAward = async () => {
    try {
      if (
        !specialAwardName ||
        !awardWeight ||
        specialAwardName.trim() === '' ||
        awardWeight === 0
      ) {
        setSpecialAwardWarningMessage(
          'Special Award Name and Weight are required',
        );
        return;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.post(
        `https://mis.foundationu.com/api/score/special-award-create/${eventId}`,
        {
          name: specialAwardName,
          weight: awardWeight,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        console.log('Special award added successfully:', response.data);
        setSpecialAwardName('');
        setAwardWeight(0);
        toggleModal();
        fetchSpecialAwards();
      } else {
        throw new Error('Failed to add special award');
      }
    } catch (error) {
      console.error('Error adding special award:', error);
    }
  };

  const [warningMessage, setWarningMessage] = useState('');

  const handleAddCriteria = async () => {
    if (!criteriaName.trim()) {
      setWarningMessage('Criteria name is required');
      return;
    }
    if (!selectedGroup) {
      setWarningMessage('Please select a criteria group');
      return;
    }
    if (criteriaWeight === 0) {
      setWarningMessage('Weight cannot be 0');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.post(
        `https://mis.foundationu.com/api/score/criteria-create/${eventId}`,
        {
          name: criteriaName,
          weight: criteriaWeight,
          group: selectedGroup,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        console.log('Criteria added successfully:', response.data);
        setCriteriaName('');
        setCriteriaWeight(0);
        setSelectedGroup('');
        setWarningMessage('');
        toggleModal();
        fetchCriterias();
      } else {
        throw new Error('Failed to add criteria');
      }
    } catch (error) {
      console.error('Error adding criteria:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  };

  const handleRemoveCriteria = async id => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const removeData = {
        remove: '1',
      };

      const response = await axios.post(
        `https://mis.foundationu.com/api/score/criteria-remove/${id}`,
        removeData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        console.log('Criteria removed successfully:', response.data);
        fetchCriterias();
      } else {
        throw new Error('Failed to remove criteria');
      }
    } catch (error) {
      console.error('Error removing criteria:', error);
    }
  };

  const handleRemoveSpecialAward = async id => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const removeData = {
        remove: '1',
      };

      const response = await axios.post(
        `https://mis.foundationu.com/api/score/special-award-remove/${id}`,
        removeData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        console.log('Special award removed successfully:', response.data);
        fetchSpecialAwards();
      } else {
        throw new Error('Failed to remove Special award');
      }
    } catch (error) {
      console.error('Error removing Special award:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);

    fetchContestants();
    fetchJudges();
    fetchCriteriaGroups();
    fetchCriterias();
    fetchSpecialAwards();
    setRefreshing(false);
  };

  const handleViewResult = async judge => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Failed to retrieve token');
      }

      const response = await axios.get(
        `https://mis.foundationu.com/api/score/event/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        const eventData = response.data;
        const eventTypeId = eventData.item.event_type_id;
        let screenName = '';

        console.log('Event Type ID:', eventTypeId);

        if (eventTypeId === '4') {
          screenName = 'Result4';
        } else if (eventTypeId === '3') {
          screenName = 'Result3';
        } else if (eventTypeId === '2') {
          screenName = 'Result2';
        } else if (eventTypeId === '1') {
          screenName = 'Result1';
        } else {
          screenName = 'Result';
        }

        console.log(`Navigating to ${screenName}`);

        navigation.navigate(screenName, {
          judgeId: judge.id,
          judgeName: judge.name,
          eventId: eventId,
        });
      } else {
        console.error('Failed to fetch event details:', response.data);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };

  const handleViewCriteriaResult = async (criteriaId, criteriaName) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Failed to retrieve token');
      }

      const response = await axios.get(
        `https://mis.foundationu.com/api/score/event/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        const eventData = response.data;
        const eventTypeId = eventData.item.event_type_id;
        let screenName = '';

        console.log('Event Type ID:', eventTypeId);

        if (eventTypeId === '4') {
          screenName = 'CriteriaResult4';
        } else if (eventTypeId === '3') {
          screenName = 'CriteriaResult3';
        } else if (eventTypeId === '2') {
          screenName = 'CriteriaResult2';
        } else if (eventTypeId === '1') {
          screenName = 'CriteriaResult1';
        } else {
          screenName = 'CriteriaResult';
        }

        console.log(`Navigating to ${screenName}`);

        navigation.navigate(screenName, {
          eventId: eventId,
          criteriaId: criteriaId,
          criteriaName: criteriaName,
        });
      } else {
        console.error('Failed to fetch event details:', response.data);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };

  const handleViewOverallResult = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Failed to retrieve token');
      }

      const response = await axios.get(
        `https://mis.foundationu.com/api/score/event/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        const eventData = response.data;
        const eventTypeId = eventData.item.event_type_id;
        let screenName = '';

        console.log('Event Type ID:', eventTypeId);

        if (eventTypeId === '4') {
          screenName = 'OverallResult4';
        } else if (eventTypeId === '3') {
          screenName = 'OverallResult3';
        } else if (eventTypeId === '2') {
          screenName = 'OverallResult2';
        } else if (eventTypeId === '1') {
          screenName = 'OverallResult1';
        } else {
          screenName = 'Result';
        }

        console.log(`Navigating to ${screenName}`);

        navigation.navigate(screenName, {eventId: eventId});
      } else {
        console.error('Failed to fetch event details:', response.data);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const renderContent = () => {
    const toggleModal = () => {
      setIsModalVisible(!isModalVisible);
    };

    switch (activeTab) {
      case 'contestants':
        return (
          <View>
            <ScrollView style={styles.scrollView}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Contestant Name</Text>
                <Text style={styles.tableHeader}>Option</Text>
              </View>
              {contestants.length > 0 ? (
                contestants.map(contestant => (
                  <View key={contestant.id} style={styles.tableContainer}>
                    <Text style={styles.name}>{contestant.name}</Text>
                    <View style={styles.optionsContainer}>
                      <TouchableOpacity
                        onPress={() => handleRemoveContestant(contestant.id)}
                        style={styles.optionContainer}>
                        <Icon name="trash" size={20} color="red" />
                        <Text style={styles.option}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text>No contestants found</Text>
                </View>
              )}
            </ScrollView>
            <Modal
              animationType="slide"
              transparent={true}
              visible={isModalVisible}
              onRequestClose={toggleModal}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Add Contestant</Text>
                  {contestantWarningMessage ? (
                    <Text style={styles.warning}>
                      {contestantWarningMessage}
                    </Text>
                  ) : null}
                  <TextInput
                    style={styles.input}
                    placeholder="Contestant Name"
                    value={contestantName}
                    onChangeText={text => setContestantName(text)}
                    placeholderTextColor="grey"
                  />

                  <View style={styles.modalbuttonContainer}>
                    <TouchableOpacity
                      style={styles.addButtonModal}
                      onPress={handleAddContestant}>
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButtonModal}
                      onPress={toggleModal}>
                      <Text style={styles.addButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.addButton} onPress={toggleModal}>
                <Text style={styles.addButtonText}>Add Contestant</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'judges':
        return (
          <View>
            <ScrollView style={styles.scrollView}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Judge</Text>
                <Text style={styles.tableHeader}>Pin Code</Text>
                <Text style={styles.tableHeader}>Option</Text>
              </View>
              {judges.length > 0 ? (
                judges.map(judge => (
                  <View key={judge.id} style={styles.tableContainer}>
                    <Text style={styles.name}>{judge.name}</Text>
                    <Text style={styles.name}>{judge.pincode}</Text>
                    <View style={styles.optionsContainer}>
                      <TouchableOpacity
                        onPress={() => handleRemoveJudge(judge.id)}
                        style={styles.optionContainer}>
                        <Icon name="trash" size={20} color="red" />
                        <Text style={styles.option}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text>No judges found</Text>
                </View>
              )}
            </ScrollView>
            <Modal
              animationType="slide"
              transparent={true}
              visible={isModalVisible}
              onRequestClose={toggleModal}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContentJudge}>
                  <Text style={styles.modalTitle}>Add Judge</Text>
                  {judgeWarningMessage ? (
                    <Text style={styles.warning}>{judgeWarningMessage}</Text>
                  ) : null}
                  <TextInput
                    style={styles.input}
                    placeholder="Judge Name"
                    value={judgeName}
                    onChangeText={text => setJudgeName(text)}
                    placeholderTextColor="grey"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Pin Code"
                    value={judgeCode}
                    onChangeText={text => setJudgeCode(text)}
                    placeholderTextColor="grey"
                  />

                  <View style={styles.modalbuttonContainer}>
                    <TouchableOpacity
                      style={styles.addButtonModal}
                      onPress={handleAddJudge}>
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButtonModal}
                      onPress={toggleModal}>
                      <Text style={styles.addButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.addButton} onPress={toggleModal}>
                <Text style={styles.addButtonText}>Add Judge</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'criteriaGroups':
        return (
          <View>
            <ScrollView style={styles.scrollView}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Criteria Group</Text>
                <Text style={styles.tableHeader}>Weight</Text>
                <Text style={styles.tableHeader}>Status</Text>
                <Text style={styles.tableHeader}>Options</Text>
              </View>

              {criteriaGroups.length > 0 ? (
                criteriaGroups.map(criteriaGroup => (
                  <View key={criteriaGroup.id} style={styles.tableContainer}>
                    <Text style={styles.name}>{criteriaGroup.name}</Text>
                    <Text style={styles.name}>{criteriaGroup.weight}%</Text>
                    <Text style={styles.name}>
                      {criteriaGroup.status === '1' ? 'enabled' : 'disabled'}
                    </Text>
                    <View style={styles.optionsContainer}>
                      <TouchableOpacity
                        onPress={() =>
                          handleRemoveCriteriaGroup(criteriaGroup.id)
                        }
                        style={styles.optionContainer}>
                        <Icon name="trash" size={20} color="red" />
                        <Text style={styles.option}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text>No criteria groups found</Text>
                </View>
              )}
              {eventTypeId === '4' && (
                <View style={styles.tableContainer}>
                  <Text style={styles.name}>Height to Area Ratio</Text>
                  <Text style={styles.name}>50%</Text>
                  <Text style={styles.name}>enabled</Text>
                  <View style={styles.optionsContainer}></View>
                </View>
              )}

              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}></Text>
                <Text style={styles.tableHeader}>
                  Total Weight: {totalWeight}%
                </Text>
                <View style={styles.emptyColumn} />
                <View style={styles.emptyColumn} />
              </View>
            </ScrollView>

            <Modal
              animationType="slide"
              transparent={true}
              visible={isModalVisible && totalWeight < 100}
              onRequestClose={toggleModal}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContentCG}>
                  <Text style={styles.modalTitle}>Add Criteria Group</Text>
                  {cGWarningMessage ? (
                    <Text style={styles.warning}>{cGWarningMessage}</Text>
                  ) : null}
                  <TextInput
                    style={styles.input}
                    placeholder="Criteria Group Name"
                    value={criteriaGroupName.toString()}
                    onChangeText={text => setCriteriaGroupName(text)}
                    placeholderTextColor="grey"
                  />
                  <View style={styles.pickerContainer}>
                    <RNPickerSelect
                      placeholder={{label: 'Select status', value: null}}
                      value={criteriaGroupStatus}
                      onValueChange={itemValue =>
                        setCriteriaGroupStatus(itemValue)
                      }
                      items={[
                        {label: 'enabled', value: '1'},
                        {label: 'disabled', value: '0'},
                      ]}
                    />
                  </View>
                  <View style={styles.sliderContainer}>
                    <Text>
                      Weight: {weight}% (Remaining: {100 - totalWeight}%)
                    </Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={100 - totalWeight}
                      value={weight}
                      onValueChange={value => setWeight(value)}
                      step={1}
                    />
                  </View>
                  <View style={styles.modalbuttonContainer}>
                    <TouchableOpacity
                      style={styles.addButtonModal}
                      onPress={handleAddCriteriaGroup}>
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButtonModal}
                      onPress={toggleModal}>
                      <Text style={styles.addButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  totalWeight >= 100 && styles.disabledButton,
                ]}
                onPress={toggleModal}
                disabled={totalWeight >= 100}>
                <Text style={styles.addButtonText}>Add Criteria Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'criterias':
        return (
          <View>
            <ScrollView style={styles.scrollView}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Criteria</Text>
                <Text style={styles.tableHeader}>Weight</Text>
                <Text style={styles.tableHeader}>Criteria Group</Text>
                <Text style={styles.tableHeader}>Options</Text>
              </View>
              {criterias.length > 0 ? (
                criterias.map(criteria => (
                  <View key={criteria.id} style={styles.tableContainer}>
                    <Text style={styles.name}>{criteria.name}</Text>
                    <Text style={styles.name}>{criteria.weight}%</Text>
                    <Text style={styles.name}>{criteria.group}</Text>
                    <View style={styles.optionsContainer}>
                      <TouchableOpacity
                        onPress={() => handleRemoveCriteria(criteria.id)}
                        style={styles.optionContainer}>
                        <Icon name="trash" size={20} color="red" />
                        <Text style={styles.option}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text>No criterias found</Text>
                </View>
              )}
              <View style={styles.tableRow}>
                <Text style={styles.emptyColumn}></Text>
                <Text style={styles.tableHeader}>
                  Total Weight: {totalCriteriaWeight}%
                </Text>
                <View style={styles.emptyColumn} />
                <View style={styles.emptyColumn} />
              </View>
            </ScrollView>
            <Modal
              animationType="slide"
              transparent={true}
              visible={isModalVisible && totalCriteriaWeight < 100}
              onRequestClose={toggleModal}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContentCG}>
                  <Text style={styles.modalTitle}>Add Criteria</Text>
                  {warningMessage ? (
                    <Text style={styles.warningText}>{warningMessage}</Text>
                  ) : null}
                  <TextInput
                    style={styles.input}
                    placeholder="Criteria Name"
                    value={criteriaName}
                    onChangeText={text => setCriteriaName(text)}
                    placeholderTextColor="grey"
                  />
                  <View style={styles.pickerContainer}>
                    <RNPickerSelect
                      placeholder={{label: 'Select Group', value: null}}
                      value={selectedGroup}
                      onValueChange={itemValue => {
                        setSelectedGroup(itemValue);
                        setCriteriaWeight(0);
                      }}
                      items={criteriaGroups.map(group => ({
                        label: group.name,
                        value: group.id,
                      }))}
                    />
                  </View>

                  <View style={styles.sliderContainer}>
                    <Text>
                      Weight: {criteriaWeight}% (Remaining: {remainingWeight}%)
                    </Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={remainingWeight}
                      value={criteriaWeight}
                      onValueChange={value => setCriteriaWeight(value)}
                      step={1}
                    />
                  </View>
                  <View style={styles.modalbuttonContainer}>
                    <TouchableOpacity
                      style={styles.addButtonModal}
                      onPress={handleAddCriteria}>
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButtonModal}
                      onPress={toggleModal}>
                      <Text style={styles.addButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  totalCriteriaWeight >= 100 && styles.disabledButton,
                ]}
                onPress={toggleModal}
                disabled={totalCriteriaWeight >= 100}>
                <Text style={styles.addButtonText}>Add Criteria</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'specialAwards':
        return (
          <View>
            <ScrollView style={styles.scrollView}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Special Award</Text>
                <Text style={styles.tableHeader}>Weight</Text>
                <Text style={styles.tableHeader}>Options</Text>
              </View>
              {specialAwards.length > 0 ? (
                specialAwards.map(specialAward => (
                  <View key={specialAward.id} style={styles.tableContainer}>
                    <Text style={styles.name}>{specialAward.name}</Text>
                    <Text style={styles.name}>{specialAward.weight}</Text>
                    <View style={styles.optionsContainer}>
                      <TouchableOpacity
                        onPress={() =>
                          handleRemoveSpecialAward(specialAward.id)
                        }
                        style={styles.optionContainer}>
                        <Icon name="trash" size={20} color="red" />
                        <Text style={styles.option}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text>No special awards found</Text>
                </View>
              )}
            </ScrollView>

            <Modal
              animationType="slide"
              transparent={true}
              visible={isModalVisible}
              onRequestClose={toggleModal}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContentSA}>
                  <Text style={styles.modalTitle}>Add Special Award</Text>

                  {specialAwardWarningMessage ? (
                    <Text style={styles.warning}>
                      {specialAwardWarningMessage}
                    </Text>
                  ) : null}

                  <TextInput
                    style={styles.input}
                    placeholder="Special Award Name"
                    value={specialAwardName}
                    onChangeText={text => setSpecialAwardName(text)}
                    placeholderTextColor="grey"
                  />

                  <View style={styles.sliderContainer}>
                    <Text>Weight: {awardWeight}</Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={10}
                      value={awardWeight}
                      onValueChange={value => setAwardWeight(value)}
                      step={1}
                    />
                  </View>

                  <View style={styles.modalbuttonContainer}>
                    <TouchableOpacity
                      style={styles.addButtonModal}
                      onPress={handleAddSpecialAward}>
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButtonModal}
                      onPress={toggleModal}>
                      <Text style={styles.addButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.addButton} onPress={toggleModal}>
                <Text style={styles.addButtonText}>Add Special Award</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'results':
        return (
          <View>
            <ScrollView style={styles.scrollView}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Judge</Text>
                <Text style={styles.tableHeader}>Option</Text>
              </View>
              {judges && judges.length > 0 ? (
                judges.map(judge => (
                  <View key={judge.id} style={styles.tableContainer}>
                    <Text style={styles.name}>{judge.name}</Text>
                    <View style={styles.optionsContainer}>
                      <TouchableOpacity
                        onPress={() => handleViewResult(judge)}
                        style={styles.optionContainer}>
                        <Icon name="search" size={20} color="#007bff" />
                        <Text style={styles.optionviewresult}>View Result</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text>No judges found</Text>
                </View>
              )}
            </ScrollView>

            <View style={{height: 20}} />

            <View style={{height: 20}} />

            {/* <ScrollView style={styles.scrollView}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Criterias</Text>
                <Text style={styles.tableHeader}>Option</Text>
              </View>
              {criterias.length > 0 ? (
                criterias.map(criteria => (
                  <View key={criteria.id} style={styles.tableContainer}>
                    <Text style={styles.name}>
                      {criteria.name} ({criteria.weight}%){' '}
                    </Text>
                    <View style={styles.optionsContainer}>
                      <TouchableOpacity
                        onPress={() =>
                          handleViewCriteriaResult(criteria.id, criteria.name)
                        }
                        style={styles.optionContainer}>
                        <Icon name="search" size={20} color="#007bff" />
                        <Text style={styles.optionviewresult}>View Result</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text>No criterias found</Text>
                </View>
              )}
            </ScrollView> */}

            <View style={{height: 20}} />

            <View style={styles.OverallResultButtonContainer}>
              <TouchableOpacity
                style={styles.overallbutton}
                onPress={handleViewOverallResult}>
                <Text style={styles.addButtonText}>View Overall Results</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <TopNav showBackButton={true} />
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Event: {eventName}</Text>
            </View>
            <View style={[styles.cardBody]}>
              <View style={styles.column1}>
                <View style={styles.column1}>
                  <View style={styles.nav}>
                    <Text
                      style={
                        activeTab === 'contestants'
                          ? styles.navLinkActive
                          : styles.navLink
                      }
                      onPress={() => setActiveTab('contestants')}>
                      CONTESTANTS
                    </Text>
                    <Text
                      style={
                        activeTab === 'judges'
                          ? styles.navLinkActive
                          : styles.navLink
                      }
                      onPress={() => setActiveTab('judges')}>
                      JUDGES
                    </Text>
                    <Text
                      style={
                        activeTab === 'criteriaGroups'
                          ? styles.navLinkActive
                          : styles.navLink
                      }
                      onPress={() => setActiveTab('criteriaGroups')}>
                      CRITERIA GROUPS
                    </Text>
                    <Text
                      style={
                        activeTab === 'criterias'
                          ? styles.navLinkActive
                          : styles.navLink
                      }
                      onPress={() => setActiveTab('criterias')}>
                      CRITERIAS
                    </Text>
                    <Text
                      style={
                        activeTab === 'specialAwards'
                          ? styles.navLinkActive
                          : styles.navLink
                      }
                      onPress={() => setActiveTab('specialAwards')}>
                      SPECIAL AWARDS
                    </Text>
                    <Text
                      style={
                        activeTab === 'results'
                          ? styles.navLinkActive
                          : styles.navLink
                      }
                      onPress={() => setActiveTab('results')}>
                      RESULTS
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.column2}>
                <View style={styles.tabContent}>{renderContent()}</View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    paddingHorizontal: 1,
    paddingTop: 5,
  },
  navtab: {
    color: 'black',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,

    shadowColor: '#000',
    shadowOffset: {width: 1, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
  },
  cardTitleStrong: {
    fontWeight: 'bold',
    color: 'black',
  },
  cardBody: {
    flexDirection: 'row',
  },
  column1: {
    flex: 0.25,
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    paddingRight: 10,
    marginRight: 10,
    textAlign: 'center',
  },
  navContainer: {
    marginLeft: 'auto',
    marginRight: 100,
  },
  column2: {
    flex: 0.75,
    paddingLeft: 10,
    textAlign: 'center',
  },
  nav: {},
  navLink: {
    fontSize: 16,
    color: '#000',
    marginBottom: 10,
  },
  navLinkActive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9a1b2f',
    marginBottom: 10,
  },
  tabContent: {},
  sideNavButtonContainer: {
    width: 30,
    height: 30,
    justifyContent: 'flex-end',
    marginBottom: 15,
    color: 'maroon',
  },
  sideNavButton: {
    fontSize: 20,
  },
  buttonContainer: {
    paddingTop: 10,
    paddingBottom: 20,
    marginTop: 10,
    marginRight: 5,
  },
  modalbuttonContainer: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 20,
    marginTop: 10,
    marginRight: 5,
  },
  addButton: {
    backgroundColor: '#9a1b2f',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
    marginRight: 10,
  },
  addButtonModal: {
    backgroundColor: '#9a1b2f',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 1,
    alignSelf: 'center',
    width: '50%',
    marginRight: 10,
  },
  cancelButtonModal: {
    backgroundColor: 'grey',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    width: '50%',
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingLeft: 10,
    color: 'black',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    width: 250,
    height: 250,
  },
  modalContentJudge: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    width: 250,
    height: 325,
  },
  modalContentCG: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    width: 250,
    height: 400,
  },
  modalContentSA: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    width: 250,
    height: 325,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#9a1b2f',
    justifyContent: 'center',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  tableHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'black',
    flex: 1,
    textAlign: 'center',
  },
  tableContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  name: {
    fontSize: 12,
    color: 'black',
    flex: 1,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    marginLeft: 10,
    flex: 1,
    justifyContent: 'center',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  option: {
    fontSize: 10,
    marginLeft: 2,
    color: 'red',
  },
  optionviewresult: {
    fontSize: 10,
    marginLeft: 2,
    color: '#007bff',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  slider: {
    width: '100%',
  },
  picker: {
    flex: 1,
  },
  addButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  totalWeightContainer: {
    alignItems: 'flex-start',
    marginRight: 50,
    marginLeft: 370,
  },
  totalCriteriaWeightContainer: {
    alignItems: 'flex-end',
    marginRight: 350,
  },
  OverallResultButtonContainer: {
    justifyContent: 'center',
    paddingTop: 15,
  },
  overallbutton: {
    backgroundColor: '#9a1b2f',
    borderRadius: 10,
    paddingTop: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginRight: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    marginBottom: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
  totalWeight: {
    marginLeft: -70,
    color: 'black',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  emptyColumn: {
    flex: 1,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  warningText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 5,
  },
  warning: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 5,
  },
});

export default ManageScreen;
