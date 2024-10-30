var janus = null;
var textroom = null;
var dataChannelOpened = false;
var messageQueue = [];
let currentRoomId = null;
let currentUserId = null;
let currentUserName = null;
let currentWebsocketURL = "ws://143.198.212.46:8188/ws";
// let currentPostURL = "http://125.212.229.11:7070/messages";
let opaqueId = "videoroomtest-" + Janus.randomString(12);

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
              textroom = pluginHandle;
              console.log("TextRoom plugin attached successfully.");

              let body = { request: "setup" };
              textroom.send({ message: body });
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
              console.log("Received data on DataChannel:", data);
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
                    textroom.send({
                      message: body,
                      jsep: jsep,
                      success: function () {
                        // joinTextRoom();
                      },
                    });
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

              // joinVideoRoom();
            },
            error: function (error) {
              console.error("Error attaching plugin...", error);
            },
            onmessage: async function (msg, jsep) {
              console.log("event happened in local plugin: ", msg);
              var event = msg["videoroom"];
              if (event) {
                if (event === "joined") {
                  currentUserId = parseInt(msg["id"], 10);

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

                    if (currentUserId === teacherId) {
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
                if (currentUserId === teacherId) {
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

              // joinAudioRoom();
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

  textroom.data({
    text: JSON.stringify(createRoomRequest),
    error: function (error) {},
  });
}

function joinTextRoom() {
  if (currentUserId && currentRoomId && currentUserName) {
    var joinRequest = {
      request: "join",
      room: parseInt(currentRoomId, 10), // Convert the input to a number
      username: currentUserName,
      transaction: Janus.randomString(12),
      textroom: "join",
    };

    console.log("textroom joinRequest", joinRequest);

    textroom.data({
      text: JSON.stringify(joinRequest),
      error: function (error) {
        //console.log(error);
      },
    });
  } else {
    console.log("Missing current userid or roomid for text room"); // Alert if the field is empty
  }
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

// window.addEventListener('load', async () => {
//   console.log('custom script loading');
//   currentRoomId = '2617451206';
//   currentUserId = '123';
//   currentUserName = 'VVT';
//   joinAudioRoom();
//   joinVideoRoom();
//   joinTextRoom();
// });
