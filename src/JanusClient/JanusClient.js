import {
     RTCPeerConnection,
    RTCMediaStream,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    mediaDevices, } from 'react-native-webrtc';
import WebSocket from 'isomorphic-ws';

class JanusClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.ws = null;
    this.sessionId = null;
    this.handleId = null;
    this.pc = null; // RTCPeerConnection instance
  }

  connect() {
    this.ws = new WebSocket(this.serverUrl, 'janus-protocol');
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.createSession();
    };

    this.ws.onmessage = this.onMessage.bind(this);
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  createSession() {
    const request = {
      janus: 'create',
      transaction: this.randomString(12)
    };
    this.sendRequest(request);
  }

  attachPlugin(pluginName) {
    const request = {
      janus: 'attach',
      session_id: this.sessionId,
      plugin: pluginName,
      transaction: this.randomString(12)
    };
    this.sendRequest(request);
  }

  createOffer() {
    console.log('Received-------');
    const pc = new RTCPeerConnection();
    this.pc = pc;

    mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      pc.createOffer().then(offer => {
        
        pc.setLocalDescription(offer);
        const request = {
          janus: 'message',
          body: { request: 'configure', audio: true, video: true },
          jsep: offer,
          transaction: this.randomString(12),
          handle_id: this.handleId
        };
        this.sendRequest(request);
      });
    });
  }

  onMessage(event) {
    const message = JSON.parse(event.data);

    if (message.janus === 'success' && message.data.id) {
      this.sessionId = message.data.id;
      this.attachPlugin('janus.plugin.videoroom');
    }

    if (message.janus === 'event' && message.jsep) {
      this.pc.setRemoteDescription(message.jsep);
    }

    if (message.janus === 'attached') {
      this.handleId = message.data.id;
      this.createOffer();
    }
    console.log('Received message:', message);
  }

  sendRequest(request) {
    if (this.sessionId) {
      request.session_id = this.sessionId;
    }
    this.ws.send(JSON.stringify(request));
  }

  randomString(length) {
    let result = '';
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export default JanusClient;
