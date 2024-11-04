import React, { useEffect, useState } from 'react';
import { View, Button, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Janus from 'janus-gateway';
import adapter from 'webrtc-adapter'; 

const App = ({navigation}) => {
  const [janus, setJanus] = useState(null);
  const [audiobridge, setAudiobridge] = useState(null);
  const [status, setStatus] = useState('Disconnected');

  useEffect(() => {
    Janus.init({
      debug: 'all',
      dependencies: Janus.useDefaultDependencies({ adapter: adapter }),
      callback: () => {
        initializeJanus();
      },
    });

    return () => {
      if (janus) {
        janus.destroy();
      }
    };
  }, []);

  const initializeJanus = () => {
    const janusInstance = new Janus({
      server: 'ws://125.212.229.11:8188/',
      success: () => {
        janusInstance.attach({
          plugin: 'janus.plugin.audiobridge',
          success: (pluginHandle) => {
            console.log('Plugin attached:', pluginHandle.getPlugin());
            setAudiobridge(pluginHandle);

            // Tham gia phòng Audio Bridge
            const joinBody = {
              request: 'join',
              room: 1234, // ID phòng bạn muốn sử dụng
              ptype: 'publisher',
              display: 'User' + Math.random().toString(36).substring(2, 7),
            };
            pluginHandle.send({ message: joinBody });
            setStatus('Connected');
          },
          error: (error) => {
            console.error('Error attaching plugin:', error);
          },
          onmessage: (msg, jsep) => {
            console.log('Message received:', msg);
            if (msg.audiobridge === 'joined') {
              setStatus('In Room');
            }
          },
          ondataopen: () => {
            console.log('Data channel is open');
          },
          ondata: (data) => {
            console.log('Data received:', data);
          },
          onremotestream: (stream) => {
            console.log('Remote stream received');
            // Xử lý stream từ người dùng khác
          },
          onlocalstream: (stream) => {
            console.log('Local stream received');
            // Xử lý stream từ chính người dùng
          },
        });
      },
      error: (error) => {
        console.error('Janus initialization error:', error);
      },
      destroyed: () => {
        console.log('Janus session destroyed');
      },
    });

    setJanus(janusInstance);
  };

  const joinRoom = () => {
    if (audiobridge) {
      const joinBody = {
        request: 'join',
        room: 1234, // ID phòng bạn muốn sử dụng
        ptype: 'publisher',
        display: 'User' + Math.random().toString(36).substring(2, 7),
      };
      audiobridge.send({ message: joinBody });
      setStatus('In Room');
    }
  };

  const leaveRoom = () => {
    if (audiobridge) {
      const leaveBody = {
        request: 'leave',
      };
      audiobridge.send({ message: leaveBody });
      setStatus('Disconnected');
    }
  };

  return (
    <View style={styles.container}>
      <Text>Status: {status}</Text>
      <Button title="Join Room" onPress={joinRoom} />
      <Button title="Leave Room" onPress={leaveRoom} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default App;
