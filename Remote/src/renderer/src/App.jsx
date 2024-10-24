import Janus from './js/janus'
import React, { useEffect, useRef } from 'react';
import adapter from 'webrtc-adapter';


function App() {
  var videoRoomPlugin = null;
  var textroomPlugin = null;
  var janus = null;
  var opaqueId = "videoroomtest-" + Janus.randomString(12);
  let currentWebsocketURL = "ws://143.198.212.46:8188/ws";
  let currentRoomId = 123456;
  var username = null;
  const videoRef = useRef()
  var remotePlugin = null;
  var isRemoting = false;
  var remoteId = null;
  let clientSelectedScreen

  async function sendRemoteMessage(message, roomId, plugin) {
    if (!message) return;
  
    var request = {
      textroom: "message",
      transaction: Janus.randomString(12),
      room: parseInt(roomId, 10),
      text: message,
      ack: false,
      to: parseInt(remoteId, 10),
    };
  
    await plugin.data({
      text: JSON.stringify(request),
      success: function () {
        //console.log("Message broadcasted successfully!");
      },
      error: function (error) {
        console.error("Error broadcasting message:", error);
      },
    });
  }

  function createRoom() {
    const createRoomRequest = {
      request: "create",
      room: parseInt(currentRoomId, 10), // Convert the input to a number
      description: `Live room ${currentRoomId}`, // Room description
      publishers: 6, // Maximum number of publishers
      textroom: "create",
      transaction: Janus.randomString(12),
    };
  
    textroomPlugin.data({
      text: JSON.stringify(createRoomRequest),
      error: function (error) {},
    });

    let createVideoRoom = {
      request: "create",
      room: currentRoomId,
      publishers: 6,
      videocodec: "vp9",
    };

    videoRoomPlugin.send({
      message: createVideoRoom,
      success: function (result) {},
    });
  }
  
  function joinRoom() {
    username = document.getElementById("username").value;
    username = parseInt(username);
  
    if (!username) {
      console.log("this field is required");
      return;
    }
    var joinRequest = {
      request: "join",
      room: parseInt(currentRoomId, 10), // Convert the input to a number
      username: username.toString(),
      transaction: Janus.randomString(12),
      textroom: "join",
    };
  
    textroomPlugin.data({
      text: JSON.stringify(joinRequest),
      error: function (error) {
        //console.log(error);
      },
    });

    let join = {
      request: "join",
      room: currentRoomId,
      ptype: "publisher",
      display: username.toString(),
      id: parseInt(username),
    };

    videoRoomPlugin.send({ message: join,
      success: async function (result) {
        console.log("join success")
        await publishCanvas()
      },
     });
  }
  
  async function handleIncomingMessage(msg) {
    if (msg['textroom'] === 'message') {
      let data = JSON.parse(msg['text'])
  
      console.log('incoming data', data)
  
      const content = data.content
  
      if (parseInt(username) == parseInt(data.remoteId)){
        if (data.type === 'KEY_PRESS') {
          var key = JSON.parse(content)
    
          window.electron.ipcRenderer.send("KEY_PRESS", {key: key});
        }
        if (data.type === 'MOUSE_CLICK') {
          window.electron.ipcRenderer.send("MOUSE_CLICK", {});

        }
        if (data.type === 'MOUSE_MOVE') {
          var mouseMovement = JSON.parse(content)
  
          const {
            displaySize: { width, height }
          } = clientSelectedScreen
    
          const ratioX = width / mouseMovement.clientWidth
          const ratioY = height / mouseMovement.clientHeight
    
          const hostX = mouseMovement.clientX * ratioX
          const hostY = mouseMovement.clientY * ratioY
    
          window.electron.ipcRenderer.send("MOUSE_MOVE", {hostX: hostX, hostY: hostY});
        }
        if (data.type === 'START_DRAG') {
          var mouseMovement = JSON.parse(content)
  
          const {
            displaySize: { width, height }
          } = clientSelectedScreen
    
          const ratioX = width / mouseMovement.clientWidth
          const ratioY = height / mouseMovement.clientHeight
    
          const hostX = mouseMovement.clientX * ratioX
          const hostY = mouseMovement.clientY * ratioY
    
          window.electron.ipcRenderer.send("START_DRAG", {hostX: hostX, hostY: hostY});
        }
        if (data.type === 'DROP') {
          var mouseMovement = JSON.parse(content)
  
          const {
            displaySize: { width, height }
          } = clientSelectedScreen
    
          const ratioX = width / mouseMovement.clientWidth
          const ratioY = height / mouseMovement.clientHeight
    
          const hostX = mouseMovement.clientX * ratioX
          const hostY = mouseMovement.clientY * ratioY
    
          window.electron.ipcRenderer.send("DROP", {hostX: hostX, hostY: hostY});
        }
      }
    }
  }

  function newRemoteFeed() {
    isRemoting = true;
    remoteId = document.getElementById("remoteid").value;
    remoteId = parseInt(remoteId);
  
    janus.attach({
      plugin: "janus.plugin.videoroom",
      opaqueId: opaqueId,
      success: function (pluginHandle) {
        remotePlugin = pluginHandle;
        let subscribe = {
          request: "join",
          room: currentRoomId,
          ptype: "subscriber",
          streams: [
            {
              feed: remoteId,
            },
          ],
        };
        remotePlugin.send({ message: subscribe });
      },
      onmessage: function (msg, jsep) {
        console.log("event happened in new remote feed: ", msg);
  
        if (jsep) {
          remotePlugin.createAnswer({
            jsep: jsep,
            tracks: [{ type: "data" }],
            success: function (jsep) {
              let body = { request: "start", room: currentRoomId };
              remotePlugin.send({ message: body, jsep: jsep });
            },
            error: function (error) {
              console.error("WebRTC error:", error);
            },
          });
        }
      },
      onremotetrack: function (track, mid, on) {
        console.log("hit remote", track, on);
  
        if (!on) {
          console.log("something something muted bs");
          return;
        }

        // Add the video tracks
        if (track.kind === "video") {
          var stream = new MediaStream([track]);

          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = (e) => videoRef.current.play()        }
      },
      oncleanup: function () {
        console.log("Cleanup done for remote feed " + remoteId);
      },
    });
  }
  
  async function publishCanvas() {
    console.log("publish canvas");
    
    const screenSources = await window.electron.ipcRenderer.invoke("GET_SCREEN_SOURCE")

    const selectedScreen = screenSources[0]
    console.log("selectedScreen", selectedScreen)
    clientSelectedScreen = selectedScreen

    console.log("selectedScreen", selectedScreen)

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: selectedScreen.id,
        }
      }
    })


    var videoTracks = stream.getVideoTracks()[0]; // Array of video tracks
    var audioTracks = stream.getAudioTracks()[0]; // Array of video tracks
  
    console.log("videoTracks", videoTracks);
    console.log("audioTracks", audioTracks);

    let tracks = [];
    tracks.push({ type: "video", capture: videoTracks, recv: false });
    tracks.push({ type: "audio", capture: audioTracks, recv: false });
  
    console.log("stream", stream);
    console.log("videoTracks", videoTracks);
    console.log("tracks", tracks);
  
    videoRoomPlugin.createOffer({
      tracks: tracks, // Pass the tracks here
  
      success: function (jsep) {
        let publish = {
          request: "publish",
          videocodec: "vp9",
        };
  
        videoRoomPlugin.send({ message: publish, jsep: jsep });
      },
      error: function (error) {
        console.error("WebRTC error:", error);
      },
    });
  }

  useEffect(() => {

    Janus.init({
      debug: "all",
      dependencies: Janus.useDefaultDependencies({ adapter }),
  
      callback: function () {
        //console.log("Janus initialized");
        janus = new Janus({
          server: currentWebsocketURL, // Replace with your Janus server URL
          success: function () {
            //console.log("Connected to Janus server");
            janus.attach({
              plugin: "janus.plugin.textroom",
              opaqueId: opaqueId,
              success: function (pluginHandle) {
                textroomPlugin = pluginHandle;
                console.log("TextRoom plugin attached successfully.");
  
                let body = { request: "setup" };
                textroomPlugin.send({ message: body });
              },
              error: function (error) {
                console.error("Error attaching TextRoom plugin:", error);
              },
              ondataopen: function () {
                console.log("Data channel is now open!");
              },
              ondata: function (data) {
                console.log("Received data on DataChannel:", data);
                handleIncomingMessage(JSON.parse(data));
              },
              onmessage: function (msg, jsep) {
                //console.log("Received message from Janus:", msg);
  
                if (jsep) {
                  // Answer
                  textroomPlugin.createAnswer({
                    jsep: jsep,
                    tracks: [{ type: "data" }],
                    success: function (jsep) {
                      let body = { request: "ack" };
                      textroomPlugin.send({ message: body, jsep: jsep });
                    },
                    error: function (error) {
                      //console.log("WebRTC error:", error);
                    },
                  });
                }
              },
              oncleanup: function () {
                //console.log("Cleanup notification from Janus.");
              },
            });

            janus.attach({
              plugin: "janus.plugin.videoroom",
              opaqueId: opaqueId,
              success: function (pluginHandle) {
                videoRoomPlugin = pluginHandle;
                console.log("Videoroom plugin attached successfully.");

              },
              error: function (error) {
                console.error("Error attaching plugin...", error);
              },
              onmessage: async function (msg, jsep) {
                console.log("event happened in local plugin: ", msg);
                if (jsep) {
                  videoRoomPlugin.handleRemoteJsep({ jsep: jsep });
                }
              },
              onlocaltrack: function (track, on) {},
              onremotetrack: function (track) {},
              oncleanup: function () {
                console.log("Cleanup done.");
              },
            });
          },
          error: function (error) {
            console.error("Error connecting to Janus server:", error);
          },
          destroyed: function () {
            //console.log("Janus session destroyed");
          },
        });
      },
    });
  }, []);

    const handleMouseClick = async () => {
    if(isRemoting) {
      console.log("clicked")
      // socket.emit('mouse_click', {})

      var message = {
        type: "MOUSE_CLICK",
        remoteId: remoteId,
        content: JSON.stringify({}),
      };

      await sendRemoteMessage(
        JSON.stringify(message),
        currentRoomId,
        textroomPlugin
      );
    }
  }

  const handleMouseMove = async ({ clientX, clientY }) => {
    if(isRemoting) {  
      console.log("moved")
      // socket.emit('mouse_move', {
      //   clientX, clientY,
      //   clientWidth: window.innerWidth,
      //   clientHeight: window.innerHeight,
      // })

      const { width, height } = videoRef.current.getBoundingClientRect();

      var mouseMovement = {
        clientX, clientY,
        clientWidth: width,
        clientHeight: height,
      };

      var message = {
        type: "MOUSE_MOVE",
        remoteId: remoteId,
        content: JSON.stringify(mouseMovement),
      };

      await sendRemoteMessage(
        JSON.stringify(message),
        currentRoomId,
        textroomPlugin
      );
    }
  }

  const handleKeyPress = async ({ event }) => {
    if(isRemoting) {    
      console.log("pressed")
      // socket.emit('mouse_move', {
      //   clientX, clientY,
      //   clientWidth: window.innerWidth,
      //   clientHeight: window.innerHeight,
      // })

      var message = {
        type: "KEY_PRESS",
        remoteId: remoteId,
        content: JSON.stringify(event.key),
      };

      await sendRemoteMessage(
        JSON.stringify(message),
        currentRoomId,
        textroomPlugin
      );
    }
  }

  // Handle the start of dragging
  const handleDragStart = async (event) => {
    if(isRemoting) {    
      const startX = event.clientX;
      const startY = event.clientY;
      const { width, height } = videoRef.current.getBoundingClientRect();

      var mouseStart = {
        startX, startY,
        clientWidth: width,
        clientHeight: height,
      };

      var message = {
        type: "START_DRAG",
        remoteId: remoteId,
        content: JSON.stringify(mouseStart),
      };

      await sendRemoteMessage(
        JSON.stringify(message),
        currentRoomId,
        textroomPlugin
      );
    }
  };

  // Handle dragging over the drop zone
  const handleDragOver = (event) => {
    if(isRemoting) {    
      event.preventDefault(); // Necessary to allow dropping
    }
  };

  // Handle the drop event
  const handleDrop = async (event) => {
    if(isRemoting) {    
      event.preventDefault();
      const endX = event.clientX;
      const endY = event.clientY;
      const { width, height } = videoRef.current.getBoundingClientRect();

      var mouseDrop = {
        endX, endY,
        clientWidth: width,
        clientHeight: height,
      };

      var message = {
        type: "DROP",
        remoteId: remoteId,
        content: JSON.stringify(mouseDrop),
      };

      await sendRemoteMessage(
        JSON.stringify(message),
        currentRoomId,
        textroomPlugin
      );
    }
  };

  return (
    <div className="App">
      <>
      <div style={styles.controls}>
          <button style={styles.button} onClick={createRoom}>Create Room</button>
          <input style={styles.button} type="text" id="username" name="username" required placeholder='Your ID'></input>
          <button style={styles.button} onClick={joinRoom} >Join Room</button>
          <input style={styles.button} type="text" id="remoteid" name="remoteid" required placeholder='Remote ID'></input>
          <button style={styles.button} onClick={newRemoteFeed} >Remote control</button>
      </div>

        <div
          style={{
            display: 'block',
            backgroundColor: 'black',
            margin: 0,
            width: '100%',    // Adjust this width based on your container size
            height: 'auto',    // This ensures the container resizes based on width
          }}
          onMouseMove={handleMouseMove}
          onClick={handleMouseClick}
          onKeyDown={handleKeyPress}
          onDragStart={handleDragStart}
          onDrag={handleDragOver}
          onDragEnd={handleDrop}
        >
          <video style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
           ref={videoRef} className="video">video not available</video>
        </div>
      </>
    </div>
  )
}

const styles = {
  controls: {
    position: 'fixed',
    top: 10,
    left: 10,
    zIndex: 10000,
    background: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
    color: 'white',
  },
  button: {
      margin: 5,
  }
};


export default App

