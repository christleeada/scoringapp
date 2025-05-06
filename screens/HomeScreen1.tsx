import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import TopNav from '../components/TopNav';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import RNPickerSelect from 'react-native-picker-select';
import axios from 'axios';
import withAuth from '../components/withAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckBox } from 'react-native-elements';

interface EventType {
  id: number;
  name: string;
}

interface Event {
  id: number;
  name: string;
  type: string;
  code: string;
  ranked: string;
  finished: string;
  hidden: string;
}

const HomeScreen1: React.FC = () => {
  
  const navigation = useNavigation();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  



  useEffect(() => {
    fetchEvents();
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Failed to retrieve token');
      }

      const response = await axios.get('https://mis.foundationu.com/api/score/event-types', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch event types: Network response was not ok');
      }

      const responseData = response.data;

      if (!Array.isArray(responseData.event_types)) {
        throw new Error('Failed to fetch event types: Event types data is not an array');
      }

      const eventTypesData = responseData.event_types;

      setEventTypes(eventTypesData);
    } catch (error) {
      console.error('Error fetching event types:', error);
    }
  };

 

  const fetchEvents = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Failed to retrieve token');
      }

      const response = await axios.get('https://mis.foundationu.com/api/score/events', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch events: Network response was not ok');
      }

      const data = response.data.events;
      

      if (!Array.isArray(data)) {
        throw new Error('Failed to fetch events: API response is not an array');
      }

      const eventsWithBooleanRankedAndFinished = data.map((event: any) => ({
        ...event,
        is_ranked: event.is_ranked === '1' ? 'yes' : 'no',
        is_finished: event.is_finished === '1' ? 'yes' : 'no',
        hidden: event.hidden === '1' ? 'yes' : 'no',
      }));

      setEvents(eventsWithBooleanRankedAndFinished);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error.message);
      setLoading(false);
    }
  };





  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };



 

  const handleViewOverallResult = async (eventId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Failed to retrieve token');
      }

      const response = await axios.get(`https://mis.foundationu.com/api/score/event/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

        navigation.navigate(screenName, { eventId: eventId });
      } else {
        console.error('Failed to fetch event details:', response.data);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopNav showBackButton={false} />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
         <View style={styles.tableRow}>
            <Text style={styles.tableHeader}>Event Name</Text>
            <Text style={styles.tableHeader}>Event Type</Text>
            <Text style={styles.tableHeader}>Event Code</Text>
            <Text style={styles.tableHeader}>Ranked</Text>
            <Text style={styles.tableHeader}>Finished</Text>
            <Text style={styles.tableHeader}></Text>
          </View>

          {events.filter(event => event.hidden !== 'yes').map((event) => (
            <View key={event.id} style={styles.eventContainer}>
              <Text style={styles.eventName}>{event.name}</Text>
              <Text style={styles.eventName}>{event.type}</Text>
              <Text style={styles.eventName}>{event.code}</Text>
              <Text style={styles.eventName}>{event.is_ranked}</Text>
              <Text style={styles.eventName}>{event.is_finished}</Text>
              <View style={styles.eventName}>
                <TouchableOpacity
                  onPress={() => handleViewOverallResult(event.id)} 
                  style={styles.optionContainer}>
                  
                  <Text style={styles.viewResult}><Icon name="magnify" size={20} color="#007bff" /> View Result</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

     
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  scrollView: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  tableHeader: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  eventContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  eventName: {
    flex: 1,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
  },
  optionContainer: {
    marginHorizontal: 5,
    alignItems: 'flex-end',
  },
  addButton: {
    backgroundColor: '#9a1b2f',
    height: 50,
    width: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  addButtonText: {
    color: 'white',
    fontSize: 30,
    lineHeight: 30,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  pickerInput: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#9a1b2f',
    width: '100%',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  checkBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
  },
  viewResult: {
    color: '#007bff'
  }
  
});



export default withAuth(HomeScreen1);
