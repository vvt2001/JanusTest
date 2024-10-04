var janus = null;
var textroom = null;
var dataChannelOpened = false;
var messageQueue = [];
let currentRoomId = 123456;
let currentUsername = "vvt";
let currentWebsocketURL = "ws://125.212.229.11:8188/ws";
// let currentPostURL = "http://125.212.229.11:7070/messages";

function initializeJanus() {
  if (janus) {
    janus.destroy(); // Clean up existing Janus instance
    janus = null;
  }

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
            opaqueId: "1234",
            success: function (pluginHandle) {
              textroom = pluginHandle;
              console.log("TextRoom plugin attached successfully.");

              let body = { request: "setup" };
              textroom.send({ message: body });

              // Add event listeners for the buttons
              document
                .getElementById("createRoom")
                .addEventListener("click", createRoom);
              document
                .getElementById("joinRoom")
                .addEventListener("click", joinRoom);
              //   document
              //     .getElementById("sendMessage")
              //     .addEventListener("click", sendMessage);
            },
            error: function (error) {
              console.error("Error attaching TextRoom plugin:", error);
            },
            ondataopen: function () {
              //console.log("Data channel is now open!");
              dataChannelOpened = true;
              processMessageQueue();
            },
            ondata: function (data) {
              //console.log("Received data on DataChannel:", data);
              handleIncomingMessage(JSON.parse(data));
            },
            onmessage: function (msg, jsep) {
              //console.log("Received message from Janus:", msg);

              if (jsep) {
                // Answer
                textroom.createAnswer({
                  jsep: jsep,
                  tracks: [{ type: "data" }],
                  success: function (jsep) {
                    let body = { request: "ack" };
                    textroom.send({ message: body, jsep: jsep });
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
}

function createRoom() {
  //   var roomIdInput = document.getElementById("createRoomIdInput").value;
  //   if (!roomIdInput) {
  //     alert("Please enter a Room ID.");
  //     return;
  //   }

  const createRoomRequest = {
    request: "create",
    room: parseInt(currentRoomId, 10), // Convert the input to a number
    description: `Live room ${currentRoomId}`, // Room description
    publishers: 6, // Maximum number of publishers
    textroom: "create",
    transaction: Janus.randomString(12),
    // post: currentPostURL,
  };

  // textroom.send({
  //     message: createRoomRequest,
  //     success: function(response) {
  //         //console.log('Room created', response);
  //         logMessage(`Room creation success, ID: ${parseInt(roomIdInput, 10)}`);
  //     },
  //     error: function(error) {
  //         console.error('Failed to create room', error);
  //         logMessage(`Room creation fail, ERROR: ${error.error}`);
  //     }
  // });

  textroom.data({
    text: JSON.stringify(createRoomRequest),
    error: function (error) {
      //console.log(error);
    },
  });
  //   document.getElementById("createRoomIdInput").value = "";
}

function joinRoom() {
  var joinRequest = {
    request: "join",
    room: parseInt(currentRoomId, 10), // Convert the input to a number
    username: currentUsername + Janus.randomString(12),
    transaction: Janus.randomString(12),
    textroom: "join",
  };

  textroom.data({
    text: JSON.stringify(joinRequest),
    error: function (error) {
      //console.log(error);
    },
  });

  //   document.getElementById("joinRoomIdInput").value = "";
  //   document.getElementById("joinUsernameInput").value = "";
}

function sendMessage() {
  var message = document.getElementById("messageInput").value;
  if (!message) return;

  if (!dataChannelOpened) {
    console.error("Data channel is not open yet, queueing message.");
    messageQueue.push(message);
    return;
  }

  var request = {
    textroom: "message",
    transaction: Janus.randomString(12),
    room: parseInt(currentRoomId, 10),
    text: message,
  };

  textroom.data({
    text: JSON.stringify(request),
    success: function () {
      //console.log("Message broadcasted successfully!");
    },
    error: function (error) {
      console.error("Error broadcasting message:", error);
    },
  });

  document.getElementById("messageInput").value = "";
}

function processMessageQueue() {
  while (messageQueue.length > 0) {
    var message = messageQueue.shift();
    sendMessage(message);
  }
}

initializeJanus();
