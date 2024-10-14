var janus = null;
var textroomPlugin = null;
var dataChannelOpened = false;
let currentRoomId = 234234234;
let currentUsername = "User-laptop";
let currentWebsocketURL = "ws://143.198.212.46:8188/ws";
// let currentPostURL = "http://125.212.229.11:7070/messages";
let opaqueId = "videoroomtest-" + Janus.randomString(12);
let groupTextroomPluginList = [];
let groupTextroomPlugin_learner = null;

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
            opaqueId: opaqueId,
            success: function (pluginHandle) {
              textroomPlugin = pluginHandle;
              console.log("TextRoom plugin attached successfully.");

              let body = { request: "setup" };
              textroomPlugin.send({ message: body });

              // Add event listeners for the buttons
              document
                .getElementById("createRoom")
                .addEventListener("click", createRoom);

              document
                .getElementById("joinRoom")
                .addEventListener("click", joinRoom);
            },
            error: function (error) {
              console.error("Error attaching TextRoom plugin:", error);
            },
            ondataopen: function () {
              //console.log("Data channel is now open!");
              dataChannelOpened = true;
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

              document
                .getElementById("publish")
                .addEventListener("click", publishOwnFeed);

              document
                .getElementById("share-screen")
                .addEventListener("click", attachCanvasPlugin);
            },
            error: function (error) {
              console.error("Error attaching plugin...", error);
            },
            onmessage: async function (msg, jsep) {
              console.log("event happened in local plugin: ", msg);
              var event = msg["videoroom"];
              if (event) {
                if (event === "joined") {
                  myId = msg["id"];

                  // Subscribe to existing publishers
                  if (msg["publishers"]) {
                    console.log("hit publishers: ", msg);

                    let list = msg["publishers"];
                    for (let f in list) {
                      let id = list[f]["id"];
                      console.log("run 1");

                      if (id === teacherId) {
                        newTeacherRemoteFeed(id);
                      } else if (id === canvasId) {
                        newCanvasRemoteFeed(id);
                      } else {
                        var placeholder = getAvailablePlaceholder();
                        if (placeholder) {
                          var index = placeholders.indexOf(placeholder);
                          newRemoteFeed(id);
                        } else {
                          waitingQueue.push(id);
                        }
                      }
                    }
                  }
                } else if (event === "event") {
                  // Handle new publishers joining after you
                  if (msg["publishers"]) {
                    console.log("hit event new publishers: ", msg);
                    let list = msg["publishers"];
                    for (let f in list) {
                      let id = list[f]["id"];
                      console.log("run 2");

                      if (id === teacherId) {
                        newTeacherRemoteFeed(id);
                      } else if (id === canvasId) {
                        newCanvasRemoteFeed(id);
                      } else {
                        var placeholder = getAvailablePlaceholder();
                        if (placeholder) {
                          var index = placeholders.indexOf(placeholder);
                          newRemoteFeed(id);
                        } else {
                          waitingQueue.push(id);
                        }
                      }
                    }
                  }

                  if (msg["unpublished"] === "ok") {
                    console.log("unpublished", msg);

                    if (myId === teacherId) {
                      removeTeacherFacecam();
                    } else {
                      stopFacecam();
                    }

                    // stopFacecam();
                  }

                  if (Number.isFinite(msg["unpublished"])) {
                    console.log("someone unpublished", msg);

                    if (msg["unpublished"] === teacherId) {
                      removeTeacherFacecam();
                    } else {
                      removeRemoteFacecam(msg["unpublished"]);
                    }

                    // removeRemoteFacecam(msg["unpublished"]);
                  }
                }
              }
              if (jsep) {
                videoRoomPlugin.handleRemoteJsep({ jsep: jsep });
              }
            },
            onlocaltrack: function (track, on) {
              console.log("hit local", track);

              if (!on) {
                console.log("stop face cam");
                stopFacecam();
                return;
              }
              if (track.kind === "video") {
                if (myId === teacherId) {
                  startTeacherFacecam(track);
                } else {
                  startFacecam(track);
                }
              }

              document
                .getElementById("unpublish")
                .addEventListener("click", unpublishOwnFeed);
            },
            onremotetrack: function (track) {},
            oncleanup: function () {
              console.log("Cleanup done.");
            },
          });
          janus.attach({
            plugin: "janus.plugin.audiobridge",
            opaqueId: opaqueId,
            success: function (pluginHandle) {
              audiobridgePlugin = pluginHandle;
              console.log("Audiobridge plugin attached successfully.");

              console.log(
                "Plugin attached! (" +
                  audiobridgePlugin.getPlugin() +
                  ", id=" +
                  audiobridgePlugin.getId() +
                  ")"
              );

              document
                .getElementById("joinRoom")
                .addEventListener("click", joinAudioRoom);
            },
            error: function (error) {
              console.error("Error attaching plugin...", error);
            },
            onmessage: function (msg, jsep) {
              let event = msg["audiobridge"];
              console.log("Got a message in audio bridge:", msg);
              if (jsep) {
                audiobridgePlugin.handleRemoteJsep({ jsep: jsep });
              }
              if (event) {
                if (event === "joined") {
                  // Successfully joined, negotiate WebRTC now
                  if (msg["id"]) {
                    console.log("Successfully joined room " + msg["room"]);
                    // Handle JSEP if provided
                    audiobridgePlugin.createOffer({
                      tracks: [{ type: "audio", capture: true, recv: true }],
                      success: function (jsep) {
                        console.log("Got SDP!", jsep);
                        let publish = { request: "configure", muted: true };
                        audiobridgePlugin.send({
                          message: publish,
                          jsep: jsep,
                        });
                      },
                      error: function (error) {
                        console.error("WebRTC error:", error);
                      },
                    });
                  }
                } else if (event === "destroyed") {
                  // The room has been destroyed
                  console.warn("The room has been destroyed!");
                } else if (event === "talking") {
                  var talkingId = msg["id"];
                  var talkingPlaceholder = placeholders.find(
                    (p) => p.userId === talkingId
                  );
                  if (talkingPlaceholder) {
                    talkingPlaceholder.isTalking = true;
                  } else if (isPublishing) {
                    var replacingPlaceholder = placeholders.find(
                      (p) => p.isTalking === false && p.id !== "Video-1"
                    );
                    if (replacingPlaceholder) {
                      var oldId = replacingPlaceholder.userId;
                      waitingQueue[waitingQueue.indexOf(talkingId)] = oldId;
                      replacingPlaceholder.userId = talkingId;
                      switchRemoteFeed(
                        placeholders.indexOf(replacingPlaceholder),
                        oldId,
                        talkingId
                      );
                    }
                  } else {
                    var replacingPlaceholder = placeholders.find(
                      (p) => p.isTalking === false
                    );
                    if (replacingPlaceholder) {
                      var oldId = replacingPlaceholder.userId;
                      waitingQueue[waitingQueue.indexOf(talkingId)] = oldId;
                      replacingPlaceholder.userId = talkingId;
                      switchRemoteFeed(
                        placeholders.indexOf(replacingPlaceholder),
                        oldId,
                        talkingId
                      );
                    }
                  }
                } else if (event === "stopped-talking") {
                  console.log("someone stopped talking");
                  var placeholder = placeholders.find(
                    (p) => p.userId === msg["id"]
                  );
                  if (placeholder) placeholder.isTalking = false;
                }
              }
            },
            onlocaltrack: function (track) {
              // Handle local audio stream (your microphone)
              console.log("Got local track:", track);
              document
                .getElementById("mute")
                .addEventListener("click", toggleMute);
            },
            onremotetrack: function (track) {
              // Handle remote audio streams (other participants)
              console.log("checkpoint");
              console.log("Got remote track:", track);

              let stream = new MediaStream([track]);
              Janus.attachMediaStream(
                document.getElementById("remoteaudio"),
                stream
              );
            },
            oncleanup: function () {
              console.log("Cleaning up...");
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
}

function joinRoom() {
  console.log("currentRoomId", currentRoomId);
  console.log("currentUsername", currentUsername);

  var joinRequest = {
    request: "join",
    room: parseInt(currentRoomId, 10), // Convert the input to a number
    username: currentUsername,
    transaction: Janus.randomString(12),
    textroom: "join",
  };

  textroomPlugin.data({
    text: JSON.stringify(joinRequest),
    error: function (error) {
      //console.log(error);
    },
  });

  //   document.getElementById("joinRoomIdInput").value = "";
  //   document.getElementById("joinUsernameInput").value = "";
}

function createNewGroup(groupId) {
  let groupTextroomPlugin = null;
  janus.attach({
    plugin: "janus.plugin.textroom",
    opaqueId: opaqueId,
    success: function (pluginHandle) {
      groupTextroomPlugin = pluginHandle;
      groupTextroomPluginList.push(groupTextroomPlugin);
      console.log("Additional group TextRoom plugin attached successfully.");

      let body = { request: "setup" };
      groupTextroomPlugin.send({ message: body });

      // Add event listeners for the buttons
      createGroupRoom(groupTextroomPlugin, groupId);
      joinGroupRoom(groupTextroomPlugin, groupId);
    },
    error: function (error) {
      console.error("Error attaching TextRoom plugin:", error);
    },
    ondataopen: function () {
      //console.log("Data channel is now open!");
      dataChannelOpened = true;
    },
    ondata: function (data) {
      console.log("Received data on DataChannel:", data);
      handleIncomingMessage(JSON.parse(data));
    },
    onmessage: function (msg, jsep) {
      //console.log("Received message from Janus:", msg);

      if (jsep) {
        // Answer
        groupTextroomPlugin.createAnswer({
          jsep: jsep,
          tracks: [{ type: "data" }],
          success: function (jsep) {
            let body = { request: "ack" };
            groupTextroomPlugin.send({ message: body, jsep: jsep });
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
}

function joinNewGroup(groupId) {
  janus.attach({
    plugin: "janus.plugin.textroom",
    opaqueId: opaqueId,
    success: function (pluginHandle) {
      groupTextroomPlugin_learner = pluginHandle;
      console.log("Additional group TextRoom plugin attached successfully.");

      let body = { request: "setup" };
      groupTextroomPlugin_learner.send({ message: body });

      // Add event listeners for the buttons
      joinGroupRoom(groupTextroomPlugin_learner, groupId);
    },
    error: function (error) {
      console.error("Error attaching TextRoom plugin:", error);
    },
    ondataopen: function () {
      //console.log("Data channel is now open!");
      dataChannelOpened = true;
    },
    ondata: function (data) {
      console.log("Received data on DataChannel:", data);
      handleIncomingMessage(JSON.parse(data));
    },
    onmessage: function (msg, jsep) {
      //console.log("Received message from Janus:", msg);

      if (jsep) {
        // Answer
        groupTextroomPlugin_learner.createAnswer({
          jsep: jsep,
          tracks: [{ type: "data" }],
          success: function (jsep) {
            let body = { request: "ack" };
            groupTextroomPlugin_learner.send({ message: body, jsep: jsep });
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
}

function createGroupRoom(plugin, groupRoomId) {
  const createRoomRequest = {
    request: "create",
    room: parseInt(groupRoomId, 10), // Convert the input to a number
    description: `Live room ${currentRoomId}`, // Room description
    publishers: 6, // Maximum number of publishers
    textroom: "create",
    transaction: Janus.randomString(12),
  };

  plugin.data({
    text: JSON.stringify(createRoomRequest),
    error: function (error) {},
  });
}

function joinGroupRoom(plugin, groupRoomId) {
  console.log("currentRoomId", currentRoomId);
  console.log("currentUsername", currentUsername);

  var joinRequest = {
    request: "join",
    room: parseInt(groupRoomId, 10), // Convert the input to a number
    username: currentUsername,
    transaction: Janus.randomString(12),
    textroom: "join",
  };

  plugin.data({
    text: JSON.stringify(joinRequest),
    error: function (error) {
      //console.log(error);
    },
  });

  //   document.getElementById("joinRoomIdInput").value = "";
  //   document.getElementById("joinUsernameInput").value = "";
}

function splitGroup(groupCount) {
  // Define an array to store the participants
  let participantList = [];

  // Send the request to list participants
  let listRequest = {
    request: "listparticipants",
    room: ROOM_ID, // The room ID you're querying
  };

  textroomPlugin.send({
    message: listRequest,
    success: function (response) {
      if (response.textroom === "participants") {
        // Clear the array before storing new participants
        participantList = [];

        // Store each participant's ID, username, and display name in the array
        response.participants.forEach((participant) => {
          participantList.push({
            id: participant.id, // Store the participant's ID
            username: participant.username,
            display: participant.display,
          });
        });

        // Log the list of participants
        console.log("Participants list with IDs:", participantList);
      }
    },
    error: function (error) {
      console.error("Error retrieving participants:", error);
    },
  });

  // If there are more groups than students, reduce the group count to the number of students
  if (groupCount > participantList.length) {
    groupCount = participantList.length;
  }

  // Step 1: Shuffle the participantList to randomize the group assignment
  participantList = participantList.sort(() => Math.random() - 0.5);

  // Step 2: Divide the students into groups
  const groupSize = Math.ceil(participantList.length / groupCount);
  const groups = [];

  for (let i = 0; i < groupCount; i++) {
    // Step 3: Assign students to the group
    const groupStudents = participantList.slice(
      i * groupSize,
      (i + 1) * groupSize
    );

    if (groupStudents.length > 0) {
      // Step 4: Select the first student as the leader
      const leader = groupStudents[0];

      // Step 5: Create the group object
      const group = {
        groupId: leader.id, // Use the leader's id as the groupId
        studentList: groupStudents, // The list of students in this group
        leader: {
          id: leader.id,
          username: leader.username,
          display: leader.display,
        },
      };

      createNewGroup(group.groupId);
      // Add the group to the array of groups
      groups.push(group);
    }
  }

  sendMessage(JSON.stringify(groups), currentRoomId, textroomPlugin);

  console.log("group", groups);
}

function sendMessage(message, roomId, plugin) {
  if (!message) return;

  var request = {
    textroom: "message",
    transaction: Janus.randomString(12),
    room: parseInt(roomId, 10),
    text: message,
  };

  plugin.data({
    text: JSON.stringify(request),
    success: function () {
      //console.log("Message broadcasted successfully!");
    },
    error: function (error) {
      console.error("Error broadcasting message:", error);
    },
  });
}

initializeJanus();
