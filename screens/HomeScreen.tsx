import React, {useState, useEffect} from 'react';
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
import {useNavigation} from '@react-navigation/native';
import RNPickerSelect from 'react-native-picker-select';
import axios from 'axios';
import withAuth from '../components/withAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CheckBox} from 'react-native-elements';

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
}

const HomeScreen: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigation = useNavigation();
  const [name, setEventName] = useState('');
  const [type, setEventType] = useState<EventType | null>(null);
  const [code, setEventCode] = useState('');
  const [rank, setRankChecked] = useState('');
  const [finish, setFinishChecked] = useState('');
  const [hidden, setHidden] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<number | null>(
    null,
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const placeholder = {
    label: 'Select an event type...',
    value: null,
  };

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

      const response = await axios.get(
        'https://mis.foundationu.com/api/score/event-types',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(
          'Failed to fetch event types: Network response was not ok',
        );
      }

      const responseData = response.data;

      if (!Array.isArray(responseData.event_types)) {
        throw new Error(
          'Failed to fetch event types: Event types data is not an array',
        );
      }

      const eventTypesData = responseData.event_types;

      setEventTypes(eventTypesData);
    } catch (error) {
      console.error('Error fetching event types:', error);
    }
  };

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const fetchEvents = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Failed to retrieve token');
      }

      const response = await axios.get(
        'https://mis.foundationu.com/api/score/events',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status !== 200) {
        throw new Error('Failed to fetch events: Network response was not ok');
      }

      const data = response.data.events;
      // console.log('Data fetched:', data);

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

  const handleEditEvent = (eventId: number) => {
    const selectedEvent = events.find(event => event.id === eventId);

    if (selectedEvent) {
      console.log('Selected Event:', selectedEvent);
      setSelectedEvent(selectedEvent);
      setEventName(selectedEvent.name);
      setEventCode(selectedEvent.code);
      setRankChecked(selectedEvent.is_ranked === 'yes' ? '1' : '0');
      setFinishChecked(selectedEvent.is_finished === 'yes' ? '1' : '0');
      setHidden(selectedEvent.hidden === 'yes' ? '1' : '0');

      const selectedType = eventTypes.find(
        type => type.name === selectedEvent.type,
      );
      setSelectedEventType(selectedType ? selectedType.id : null);
      setEventType(selectedType || null);

      toggleModal();
      setIsEditing(true);
    } else {
      console.error(`Event with ID ${eventId} not found.`);
    }
  };

  const handleUpdateEvent = async () => {
    try {
      if (!selectedEvent) {
        console.error('No event selected for update.');
        return;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Failed to retrieve token');
      }

      const eventData = {
        name: name,
        type: type?.id,
        code: code,
        rank: rank,
        finish: finish,
        hidden: hidden,
      };

      console.log(eventData);

      const response = await axios.post(
        `https://mis.foundationu.com/api/score/event-update/${selectedEvent.id}`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        console.log('Event updated successfully:', response.data);

        await fetchEvents();

        resetForm();

        setSelectedEvent(null);

        toggleModal();
      } else {
        console.error('Failed to update event:', response.data);
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const handleManageEvent = async eventId => {
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
        console.log('Event ID:', eventId);
        console.log('Event Type ID:', eventTypeId);

        if (eventTypeId === '2' || eventTypeId === '3') {
          navigation.navigate('ManageTrussEvent', {eventId, eventTypeId});
        } else {
          navigation.navigate('Manage', {eventId, eventTypeId});
        }
      } else {
        console.error('Failed to fetch event details:', response.data);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };

  const resetForm = () => {
    setEventName('');
    setEventCode('');
    setEventType(null);
    setRankChecked('');
    setFinishChecked('');
    setSelectedEventType(null);
  };

  const handleAddEvent = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Failed to retrieve token');
      }

      const eventData = {
        name: name,
        type: type?.id,
        code: code,
        rank: rank,
        finish: finish,
        hidden: hidden,
      };

      const response = await axios.post(
        'https://mis.foundationu.com/api/score/event-create',
        eventData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        console.log('Event added successfully:', response.data);
        resetForm();
        toggleModal();
        await fetchEvents();
      } else {
        console.error('Failed to add event:', response.data);
      }
    } catch (error) {
      console.error('Error adding event:', error);
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }>
          <View style={styles.tableRow}>
            <Text style={styles.tableHeader}>Event Name</Text>
            <Text style={styles.tableHeader}>Event Type</Text>
            <Text style={styles.tableHeader}>Event Code</Text>
            <Text style={styles.tableHeader}>Ranked</Text>
            <Text style={styles.tableHeader}>Finished</Text>
            <Text style={styles.tableHeader}>Hidden</Text>
            <Text style={styles.tableHeader}></Text>
          </View>

          {events.map(event => (
            <View key={event.id} style={styles.eventContainer}>
              <Text style={styles.eventName}>{event.name}</Text>
              <Text style={styles.eventName}>{event.type}</Text>
              <Text style={styles.eventName}>{event.code}</Text>
              <Text style={styles.eventName}>{event.is_ranked}</Text>
              <Text style={styles.eventName}>{event.is_finished}</Text>
              <Text style={styles.eventName}>{event.hidden}</Text>
              <View style={styles.eventName}>
                <TouchableOpacity
                  style={styles.optionContainer}
                  onPress={() => handleEditEvent(event.id)}>
                  <Icon name="pencil" size={24} color="#9a1b2f" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionContainer}
                  onPress={() => handleManageEvent(event.id)}>
                  <Icon name="cog" size={24} color="gray" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      <TouchableOpacity style={styles.addButton} onPress={toggleModal}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={toggleModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                toggleModal();
                setIsEditing(false);
                resetForm();
              }}>
              <Icon name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Event' : 'Add Event'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Event Name"
              value={name}
              onChangeText={setEventName}
            />
            <TextInput
              style={styles.input}
              placeholder="Event Code"
              value={code}
              onChangeText={setEventCode}
            />
            <RNPickerSelect
              placeholder={placeholder}
              value={selectedEventType}
              onValueChange={value => {
                setSelectedEventType(value);
                const selectedType =
                  eventTypes.find(type => type.id === value) || null;
                setEventType(selectedType);
              }}
              items={eventTypes.map(type => ({
                label: type.name,
                value: type.id,
              }))}
              style={{
                inputIOS: styles.pickerInput,
                inputAndroid: styles.pickerInput,
              }}
            />
            <View style={styles.checkBoxContainer}>
              <CheckBox
                title="Ranked"
                checked={rank === '1'}
                onPress={() => setRankChecked(rank === '1' ? '0' : '1')}
              />
              <CheckBox
                title="Finished"
                checked={finish === '1'}
                onPress={() => setFinishChecked(finish === '1' ? '0' : '1')}
              />
              <CheckBox
                title="Hidden"
                checked={hidden === '1'}
                onPress={() => setHidden(hidden === '1' ? '0' : '1')}
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={isEditing ? handleUpdateEvent : handleAddEvent}>
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
  },
  tableHeader: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginLeft: 50,
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
    marginLeft: 50,
  },
  optionsContainer: {
    flexDirection: 'row',
  },
  optionContainer: {
    marginHorizontal: 5,
    alignItems: 'flex-end',
    marginRight: 5,
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
    width: '40%',
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
});

export default withAuth(HomeScreen);
