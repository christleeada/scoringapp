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
  KeyboardAvoidingView,
} from 'react-native';
import TopNav from '../components/TopNav';
import Icon from 'react-native-vector-icons/FontAwesome';
import Slider from '@react-native-community/slider';
import RNPickerSelect from 'react-native-picker-select';
import {useNavigation} from '@react-navigation/native';
import {RouteProp, useRoute} from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

type RootStackParamList = {
  Manage: {eventId: number; eventName: string; eventTypeId: number};
};

const ManageScreenTrussEvent: React.FC = () => {
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
  const [judges, setJudges] = useState([]);
  const [weights, setWeights] = useState({weight_range: []});
  const [editableWeights, setEditableWeights] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

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

  const fetchWeightRanges = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.get(
        `https://mis.foundationu.com/api/score/weight-range/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        const weightData = response.data;
        setWeights(weightData);
        setEditableWeights(weightData.weight_range || []);
        console.log(response.data);
      } else {
        throw new Error('Failed to fetch weight range');
      }
    } catch (error) {
      console.error('Error fetching weight range:', error);
    }
  };

  useEffect(() => {
    fetchWeightRanges();
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

  const handleWeightChange = (index, field, value) => {
    const newWeights = [...editableWeights];
    newWeights[index][field] = value;
    setEditableWeights(newWeights);
  };

  const validateWeightData = weights => {
    return weights.every(
      weight =>
        weight.load_start &&
        weight.load_end &&
        weight.range_start &&
        weight.range_end &&
        weight.grade,
    );
  };

  const parseWeightData = weights => {
    const load_start = [];
    const load_end = [];
    const range_start = [];
    const range_end = [];

    weights.forEach(weight => {
      load_start.push({id: weight.id, value: weight.load_start.toString()});
      load_end.push({id: weight.id, value: weight.load_end.toString()});
      range_start.push({id: weight.id, value: weight.range_start.toString()});
      range_end.push({id: weight.id, value: weight.range_end.toString()});
    });

    return {load_start, load_end, range_start, range_end};
  };

  const saveWeightChanges = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Token not found');

      if (!validateWeightData(editableWeights)) {
        setErrorMessage('Invalid weight data. Please check all fields.');
        return;
      }

      const parsedWeights = parseWeightData(editableWeights);
      console.log('Data being sent:', JSON.stringify(parsedWeights, null, 2));

      const response = await axios.post(
        `https://mis.foundationu.com/api/score/weight-range-update/${eventId}`,
        parsedWeights,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 200) {
        console.log('Weight ranges updated successfully');
        setErrorMessage('');
        fetchWeightRanges();
      } else {
        throw new Error('Failed to update weight ranges');
      }
    } catch (error) {
      console.error('Error updating weight ranges:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      setErrorMessage('Failed to update weight ranges. Please try again.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchContestants();
    fetchJudges();
    fetchWeightRanges();
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
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}>
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
              </KeyboardAvoidingView>
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
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}>
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
              </KeyboardAvoidingView>
            </Modal>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.addButton} onPress={toggleModal}>
                <Text style={styles.addButtonText}>Add Judge</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'weightRange':
        return (
          <KeyboardAwareScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollViewContent}
            extraScrollHeight={100}>
            <View style={styles.tableContainerWR}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderWR, {flex: 2}]}>Load</Text>
                <Text style={[styles.tableHeaderWR, {flex: 2}]}>Range</Text>
                <Text style={[styles.tableHeaderWR, {flex: 1}]}>Grade</Text>
              </View>
              <View style={styles.tableSubHeaderRow}>
                <Text style={[styles.tableSubHeader, {flex: 1}]}>Start</Text>
                <Text style={[styles.tableSubHeader, {flex: 1}]}>End</Text>
                <Text style={[styles.tableSubHeader, {flex: 1}]}>Start</Text>
                <Text style={[styles.tableSubHeader, {flex: 1}]}>End</Text>
                <Text style={[styles.tableSubHeader, {flex: 1}]}>Grade</Text>
              </View>
              {editableWeights.map((weight, index) => (
                <View key={index} style={styles.tableRowWR}>
                  <TextInput
                    style={[styles.tableCell, {flex: 1}]}
                    value={weight.load_start.toString()}
                    onChangeText={text =>
                      handleWeightChange(index, 'load_start', text)
                    }
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.tableCell, {flex: 1}]}
                    value={weight.load_end.toString()}
                    onChangeText={text =>
                      handleWeightChange(index, 'load_end', text)
                    }
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.tableCell, {flex: 1}]}
                    value={weight.range_start.toString()}
                    onChangeText={text =>
                      handleWeightChange(index, 'range_start', text)
                    }
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.tableCell, {flex: 1}]}
                    value={weight.range_end.toString()}
                    onChangeText={text =>
                      handleWeightChange(index, 'range_end', text)
                    }
                    keyboardType="numeric"
                  />
                  <Text style={[styles.tableCell, {flex: 1}]}>
                    {weight.grade}
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveWeightChanges}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </KeyboardAwareScrollView>
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
                        activeTab === 'weightRange'
                          ? styles.navLinkActive
                          : styles.navLink
                      }
                      onPress={() => setActiveTab('weightRange')}>
                      WEIGHT RANGE
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
  tableContainerWR: {
    borderWidth: 1,
    borderColor: '#ddd',
    margin: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  tableSubHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  tableHeaderWR: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
    color: '#333',
  },
  tableSubHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 8,
    color: '#333',
  },
  tableRowWR: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  tableCell: {
    fontSize: 14,
    textAlign: 'center',
    padding: 10,
    color: '#333',
  },

  saveButton: {
    backgroundColor: '#9a1b2f',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ManageScreenTrussEvent;
