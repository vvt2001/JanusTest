// import React from 'react';
// import {
//   SafeAreaView,
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
// } from 'react-native';

// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// import LoginSVG from '../assets/images/misc/login.svg';
// // import GoogleSVG from '../assets/images/misc/google.svg';
// // import FacebookSVG from '../assets/images/misc/facebook.svg';

// import CustomButton from '../components/CustomButton';
// import InputField from '../components/InputField';

// const LoginScreen = ({ navigation }) => {
//   return (
//     <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
//       <View style={{ paddingHorizontal: 25 }}>
//         <View style={{ alignItems: 'center' }}>
//           {/* <LoginSVG
//             height={300}
//             width={300}
//             style={{transform: [{rotate: '-5deg'}]}}
//           /> */}
//         </View>

//         <Text
//           style={{
//             fontFamily: 'Roboto-Medium',
//             fontSize: 28,
//             fontWeight: '500',
//             color: '#333',
//             marginBottom: 30,
//           }}>
//           Đăng Nhập
//         </Text>

//         <InputField
//           label={'Email ID'}
//           // icon={
//           //   <MaterialIcons
//           //     name="alternate-email"
//           //     size={20}
//           //     color="#666"
//           //     style={{ marginRight: 5 }}
//           //   />
//           // }
//           keyboardType="email-address"
//         />

//         <InputField
//           label={'Password'}
//           // icon={
//           //   <Ionicons
//           //     name="ios-lock-closed-outline"
//           //     size={20}
//           //     color="#666"
//           //     style={{ marginRight: 5 }}
//           //   />
//           // }
//           inputType="password"
//         // fieldButtonLabel={"Forgot?"}
//         // fieldButtonFunction={() => { }}
//         />

//         <TouchableOpacity
//           onPress={() => { }} style={{ textAlign: 'center', color: '#04b0d6', marginBottom: 20 }}>
//           <Text style={{ color: '#04b0d6', fontWeight: '700' }}>
//             Quên mật khẩu?
//           </Text>
//         </TouchableOpacity>

//         <CustomButton label={"Đăng Nhập"} onPress={() => navigation.navigate('Home')} />

//         <Text style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
//           HOẶC
//         </Text>

//         <View
//           style={{
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             marginBottom: 20,
//             paddingStart: 20,
//             paddingEnd: 20
//           }}>
//           <TouchableOpacity
//             onPress={() => { }}
//             style={{
//               borderColor: '#ddd',
//               borderWidth: 2,
//               borderRadius: 10,
//               paddingHorizontal: 30,
//               paddingVertical: 20,
//             }}>
//             {/* <View style={{ height: 24, width: 24 }}></View> */}
//             {/* <GoogleSVG height={24} width={24} /> */}
//             <Image
//               style={{ height: 50, width: 50, alignSelf: "center" }}
//               source={require("../assets/images/misc/fb-icon.png")}
//               resizeMode="contain"
//             />
//           </TouchableOpacity>
//           <TouchableOpacity
//             onPress={() => { }}
//             style={{
//               borderColor: '#ddd',
//               borderWidth: 2,
//               borderRadius: 10,
//               paddingHorizontal: 30,
//               paddingVertical: 20,
//             }}>
//             {/* <View style={{ height: 24, width: 24 }}></View> */}
//             <Image
//               style={{ height: 50, width: 50, alignSelf: "center" }}
//               source={require("../assets/images/misc/icon-gg.png")}
//               resizeMode="contain"
//             />
//             {/* <FacebookSVG height={24} width={24} /> */}
//           </TouchableOpacity>
//         </View>

//         <View
//           style={{
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             marginBottom: 20,
//             paddingStart: 20,
//             paddingEnd: 20
//           }}>
//           <View style={{
//             width: '50%',
//           }}>
//             <Text>Bạn là người mới sử dụng Edulive?
//             </Text>
//           </View>
//           <View style={{ width: '50%' }}>
//             <TouchableOpacity onPress={() => navigation.navigate('Register')}>
//               <Text style={{ color: '#04b0d6', fontWeight: '700' }}> Đăng ký tại đây
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default LoginScreen;

// import React, { useEffect, useState } from 'react';
// import { View, Text } from 'react-native';
// import { RTCPeerConnection, RTCSessionDescription, RTCView, mediaDevices } from 'react-native-webrtc';
// import JanusClient from '../JanusClient/JanusClient';


// function App() {
//   const [localStream, setLocalStream] = useState(null);

//   useEffect(() => {
//     const janusClient = new JanusClient('ws://125.212.229.11:8188/');
//     janusClient.connect();

    
//     janusClient.createOffer = () => {
      
//       const pc = new RTCPeerConnection();
//       mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
        
//         setLocalStream(stream);
        
//         stream.getTracks().forEach(track => pc.addTrack(track, stream));

//         pc.createOffer().then(offer => {
//           pc.setLocalDescription(offer);
//           janusClient.sendOffer(offer);
//         });
//       });
//     };
//     console.log("------localStream",localStream);
    
//   }, []);

//   return (
//     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//       <Text>Janus WebRTC with React Native</Text>
//       {localStream && (
//         <RTCView
//           streamURL={localStream.toURL()}
//           style={{ width: '100%', height: 400 }}
//         />
//       )}
//     </View>
//   );
// }

// export default App;

import {mediaDevices, MediaStream, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription, RTCView} from 'react-native-webrtc';
import React from 'react';
import {Dimensions, FlatList, StatusBar, View, Text} from 'react-native';
import {Janus, JanusVideoRoomPlugin} from 'react-native-janus';

Janus.setDependencies({
    RTCPeerConnection,
    RTCSessionDescription,
    RTCIceCandidate,
    MediaStream,
});

class JanusVideoRoomScreen extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            stream: null,
            publishers: [],
        };
    }

    async receivePublisher(publisher) {
        try {
            let videoRoom = new JanusVideoRoomPlugin(this.janus);
            videoRoom.setRoomID(1234);
            videoRoom.setOnStreamListener((stream) => {
                this.setState(state => ({
                    publishers: [
                        ...state.publishers,
                        {
                            publisher: publisher,
                            stream: stream,
                        },
                    ],
                }));
            });

            await videoRoom.createPeer();
            await videoRoom.connect();
            await videoRoom.receive(this.videoRoom.getUserPrivateID(), publisher);
        } catch (e) {
            console.error(e);
        }
    }

    async removePublisher(publisherID) {
        try {
            this.setState(state => ({
                publishers: state.publishers.filter(pub => pub.publisher == null || pub.publisher.id !== publisherID),
            }));
        } catch (e) {
            console.error(e);
        }
    }

    async initJanus(stream) {
        try {
            this.setState(state => ({
                publishers: [
                    {
                        publisher: null,
                        stream: stream,
                    },
                ],
            }));

            this.janus = new Janus('ws://125.212.229.11:8188/');
            this.janus.setApiSecret('janusrocks');
            await this.janus.init();

            this.videoRoom = new JanusVideoRoomPlugin(this.janus);
            this.videoRoom.setRoomID(1234);
            this.videoRoom.setDisplayName('can');
            this.videoRoom.setOnPublishersListener((publishers) => {
                for (let i = 0; i < publishers.length; i++) {
                    this.receivePublisher(publishers[i]);
                }
            });
            this.videoRoom.setOnPublisherJoinedListener((publisher) => {
                this.receivePublisher(publisher);
            });
            this.videoRoom.setOnPublisherLeftListener((publisherID) => {
                this.removePublisher(publisherID);
            });
            this.videoRoom.setOnWebRTCUpListener(async () => {

            });

            await this.videoRoom.createPeer();
            await this.videoRoom.connect();
            await this.videoRoom.join();
            await this.videoRoom.publish(stream);

        } catch (e) {
            console.error('main', JSON.stringify(e));
        }
    }

    getMediaStream = async () => {
        let isFront = true;
        let sourceInfos = await mediaDevices.enumerateDevices();
        let videoSourceId;
        for (let i = 0; i < sourceInfos.length; i++) {
            const sourceInfo = sourceInfos[i];
            console.log(sourceInfo);
            if (sourceInfo.kind == 'videoinput' && sourceInfo.facing == (isFront ? 'front' : 'environment')) {
                videoSourceId = sourceInfo.deviceId;
            }
        }

        let stream = await mediaDevices.getUserMedia({
            audio: true,
            video: {
                facingMode: (isFront ? 'user' : 'environment'),
            },
        });
        await this.initJanus(stream);
    };

    async componentDidMount() {
        this.getMediaStream();
    }

    componentWillUnmount = async () => {
        if (this.janus) {
            await this.janus.destroy();
        }
    };

    renderView() {
    }

    render() {
        return (
          <View style={{flex: 1, width: '100%', height: '100%', flexDirection: 'row'}}>
          <StatusBar translucent={true} barStyle={'light-content'}/>
          <FlatList
              data={this.state.publishers}
              numColumns={2}
              keyExtractor={(item, index) => {
                  if (item.publisher === null) {
                      return `rtc-default`;
                  }
                  return `rtc-${item.publisher.id}`;
              }}
              renderItem={({item}) => (
                  <RTCView style={{
                      flex: 1,
                      height: (Dimensions.get('window').height / 2),
                  }} objectFit={'cover'} streamURL={item.stream.toURL()}/>
              )}
          />
      </View>
        );
    }
}

export default JanusVideoRoomScreen
