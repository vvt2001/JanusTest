import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, MediaStream } from 'react-native-webrtc';

const App = ({navigation}) => {
  const [peerConnection, setPeerConnection] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("New ICE candidate:", event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.log("Track event:", event);
      // Handle received tracks
    };

    setPeerConnection(pc);

    return () => {
      pc.close();
    };
  }, []);

  const createOffer = async () => {
    if (peerConnection) {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
        console.log("Offer created:", offer);
        // Send offer to remote peer via signaling server
      } catch (error) {
        console.error("Failed to create offer:", error);
      }
    }
  };

  const sendMessage = () => {
    // Send the message using a signaling server
    console.log("Sending message:", message);
    setMessages((prevMessages) => [...prevMessages, `You: ${message}`]);
    setMessage('');
  };

  return (
    <View style={{padding :30}}>
      <Text style= {{  marginTop: 50}}>TextRoom</Text>
      <Button title="Create Offer" onPress={createOffer} />
      <FlatList
        data={messages}
        renderItem={({ item }) => <Text>{item}</Text>}
        keyExtractor={(item, index) => index.toString()}
      />
      <TextInput
        style={{ borderWidth: 1, marginBottom: 20, padding: 5 }}
        value={message}
        onChangeText={setMessage}
        placeholder="Enter your message"
      />
      <Button title="Send Message" onPress={sendMessage} />
      <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 30,
          }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: '#AD40AF', fontWeight: '700' }}> Back</Text>
          </TouchableOpacity>
        </View>
    </View>
  );
};

export default App;
