import React, { useState, useEffect, useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import ContestantModal from '../components/ContestantModal';
import ContestantModalTruss from '../components/ContestantModalTruss';
import ContestantModalTrussAddWeight from '../components/ContestantModalTrussAddWeight';
import ContestantModalTrussTable from '../components/ContestantModalTrussTable';
import { useNavigation } from '@react-navigation/native';
import Contestantgroup from '../components/Contestantgroup';
import ContestantgroupTruss from '../components/ContestantgroupTruss';
import { FontFamily, Color, FontSize, Padding, Border } from '../GlobalStyles';
import userWithAuth from '../components/userWithAuth';
import { checkTokenValidity } from '../components/userAuthUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Dashboard: React.FC = () => {
  const [ratebuttonVisible, setRatebuttonVisible] = useState(false);
  const [addWeightModalVisible, setAddWeightModalVisible] = useState(false);
  const [contestantTableModalVisible, setContestantTableModalVisible] = useState(false); // New state
  const navigation = useNavigation();
  const [sliderValue, setSliderValue] = useState(0);
  const [judgeData, setJudgeData] = useState<any>(null);
  const [tokenData, setTokenData] = useState<any>(null);
  const [eventName, setEventName] = useState('');
  const [selectedContestant, setSelectedContestant] = useState<any>(null);
  const [eventId, setEventId] = useState<string>('');
  const [eventTypeId, setEventTypeId] = useState<string>('');
  const [judgeId, setJudgeId] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const openRatebutton = useCallback(() => {
    console.log('Opening rate button...');
    setRatebuttonVisible(true);
  }, []);

  const closeRatebutton = useCallback(() => {
    setRatebuttonVisible(false);
  }, []);

  const openTriggerModal = useCallback(
    (contestant) => {
      setSelectedContestant(contestant);
      if (contestant.weight_failed) {
        setRatebuttonVisible(false);
        setAddWeightModalVisible(false);
        setContestantTableModalVisible(true); 
      } else if (contestant.weight_initial && contestant.weight_initial.add_weight >= 0) {
        setAddWeightModalVisible(true);
      } else {
        openRatebutton();
      }
    },
    [openRatebutton],
  );

  const fetchEventName = async (event_id: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await axios.get(
        `https://mis.foundationu.com/api/score/event/${event_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.item && response.data.item.name) {
        console.log("Event name: ", response.data.item.name); 
        console.log("Event Type ID:", response.data.item.event_type_id);
        setEventName(response.data.item.name);
        setEventTypeId(response.data.item.event_type_id);
      } else {
        throw new Error('Event name not found in the response');
      }
    } catch (error) {
      console.error('Error fetching event name:', error);
    }
  };

  const fetchTokenData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const tokenValidity = await checkTokenValidity(token);
        setTokenData(tokenValidity.data);
        console.log('Token validity data:', tokenValidity.data);

        if (tokenValidity.data && tokenValidity.data.judge) {
          const { event_id, ...judge } = tokenValidity.data.judge;
          setJudgeData(judge);
          fetchEventName(event_id);
          setEventId(event_id);
          setJudgeId(judge.id);
        }
      }
    } catch (error) {
      console.error('Error fetching token:', error.message);
    }
  };

  useEffect(() => {
    fetchTokenData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTokenData().finally(() => setRefreshing(false));
  }, []);

  const ContestantGroupComponent = eventTypeId === '2' || eventTypeId === '3' ? ContestantgroupTruss : Contestantgroup;
  const ContestantModalComponent = eventTypeId === '2' || eventTypeId === '3' ? ContestantModalTruss : ContestantModal;

  return (
    <>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.navbar, styles.navbarSpaceBlock]}>
          <TouchableOpacity activeOpacity={0.2} onPress={() => {}}>
            <Text style={[styles.testEvent1, styles.textTypo]}>
              {eventName || 'Event Name'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutbutton}
            activeOpacity={0.2}
            onPress={() => navigation.navigate('UserLogin')}>
            <Text style={styles.logout}>
              <Icon name="power" size={20} color="white" />
              <Text style={styles.logout1}> LOGOUT</Text>
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View style={[styles.dashboard, styles.judge1FlexBox]}>
            <View style={[styles.dynamiccontainer, styles.judge1FlexBox]}>
              <View style={[styles.container, styles.containerShadowBox]}>
                <View
                  style={[styles.contentcontainer, styles.containerShadowBox]}>
                  <View style={[styles.contentgroup, styles.navbarSpaceBlock]}>
                    <View style={[styles.framecontent, styles.titletabFlexBox]}>
                      <View
                        style={[styles.judgeContent, styles.titletabFlexBox]}>
                        <View style={[styles.titletab, styles.titletabFlexBox]}>
                          <Text style={[styles.judge1, styles.textTypo]}>
                            {judgeData ? judgeData.name : 'Judge Name'}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.contestantsection,
                            styles.navbarSpaceBlock,
                          ]}>
                          <ContestantGroupComponent
                            event_id={eventId}
                            judge_id={judgeId}
                            openTriggerModal={openTriggerModal}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal animationType="fade" transparent visible={ratebuttonVisible}>
        <View style={styles.ratebuttonOverlay}>
          <Pressable style={styles.ratebuttonBg} onPress={closeRatebutton} />
          <ContestantModalComponent
            onClose={closeRatebutton}
            selectedContestant={selectedContestant}
            eventId={eventId}
            judgeId={judgeId}
          />
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={addWeightModalVisible}>
        <View style={styles.ratebuttonOverlay}>
          <Pressable style={styles.ratebuttonBg} onPress={() => setAddWeightModalVisible(false)} />
          <ContestantModalTrussAddWeight
            onClose={() => setAddWeightModalVisible(false)}
            selectedContestant={selectedContestant}
            eventId={eventId}
            judgeId={judgeId}
          />
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={contestantTableModalVisible}>
        <View style={styles.ratebuttonOverlay}>
          <Pressable style={styles.ratebuttonBg} onPress={() => setContestantTableModalVisible(false)} />
          <ContestantModalTrussTable
            onClose={() => setContestantTableModalVisible(false)}
            selectedContestant={selectedContestant}
            eventId={eventId}
            judgeId={judgeId}
          />
        </View>
      </Modal>
    </>
  );
};
const styles = StyleSheet.create({
  judge1FlexBox: {
    flex: 1,
    alignItems: 'center',
  },
  containerShadowBox: {
    shadowOpacity: 1,
    elevation: 5,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    alignSelf: 'stretch',
    alignItems: 'center',
    flex: 1,
  },
  navbarSpaceBlock: {
    paddingVertical: 0,
    alignItems: 'center',
  },
  textTypo: {
    fontWeight: '700',
    fontFamily: FontFamily.sFProTextRegular,
  },
  titletabFlexBox: {
    borderStyle: 'solid',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  ratebuttonOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(113, 113, 113, 0.3)',
  },
  ratebuttonBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
  },
  testEvent1: {
    textAlign: 'left',
    color: Color.white,
    fontFamily: FontFamily.sFProTextRegular,
    fontSize: FontSize.size_6xl,
    fontWeight: '700',
  },
  powerOffSolid1Icon: {
    width: 20,
    height: 20,
    overflow: 'hidden',
  },
  text: {
    fontFamily: FontFamily.sFProTextRegular,
  },
  logout1: {
    fontFamily: FontFamily.sFProTextRegular,
  },
  logout: {
    fontSize: FontSize.size_m,
    marginLeft: 5,
    textAlign: 'center',
    color: Color.white,
  },
  logoutbutton: {
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  navbar: {
    backgroundColor: Color.colorBrown,
    height: 50,
    paddingHorizontal: Padding.p_xl,
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  judge1: {
    color: Color.colorBlack,
    display: 'flex',
    textAlign: 'center',
    justifyContent: 'center',
    fontFamily: FontFamily.sFProTextRegular,
    fontSize: FontSize.size_6xl,
    fontWeight: '700',
    alignSelf: 'stretch',
    alignItems: 'center',
    flex: 1,
  },
  titletab: {
    borderTopLeftRadius: Border.br_8xs,
    borderTopRightRadius: Border.br_8xs,
    borderColor: Color.colorGray_100,
    borderBottomWidth: 1,
    height: 50,
    maxHeight: 50,
    justifyContent: 'space-between',
  },
  contestantsection: {
    paddingHorizontal: 15,
    alignSelf: 'stretch',
  },
  judgeContent: {
    backgroundColor: Color.white,
    borderColor: Color.colorGray_200,
    borderWidth: 1,
    paddingBottom: Padding.p_xl,
    borderRadius: Border.br_5xs,
  },
  framecontent: {
    borderColor: Color.colorBrown,
    borderTopWidth: 3,
    borderRadius: Border.br_5xs,
    justifyContent: 'center',
  },
  contentgroup: {
    paddingHorizontal: Padding.p_11xl,
    maxWidth: 780,
    borderRadius: Border.br_5xs,
    width: '100%',
  },
  contentcontainer: {
    paddingHorizontal: 0,
    paddingVertical: Padding.p_11xl,
  },
  container: {
    justifyContent: 'space-between',
  },
  dynamiccontainer: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  dashboard: {
    backgroundColor: Color.colorWhitesmoke_100,
    height: 1366,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    width: '100%',
  },
});

export default userWithAuth(Dashboard);