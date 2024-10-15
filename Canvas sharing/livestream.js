let videoRoomPlugin = null;
let canvasPlugin = null;
let remoteFeedPugin = null;
let teacherFeedPlugin = null;
let remoteCanvasFeedPlugin = null;

let audiobridgePlugin = null;
const server = "ws://143.198.212.46:8188/ws"; // Your Janus server URL
// let server = "wss://ab.edulive.net:8989/";  // Your Janus server URL
let subscribers = []; // Store list of subscriber handles
let isPublishing = false;
const placeholders = [
  {
    id: "Video-1",
    isOccupied: false,
    videoTrackId: null,
    videoTrack: null,
    userId: null,
    isTalking: false,
    remoteFeedPugin: null,
  }, // Placeholder 1
  {
    id: "Video-2",
    isOccupied: false,
    videoTrackId: null,
    videoTrack: null,
    userId: null,
    isTalking: false,
    remoteFeedPugin: null,
  }, // Placeholder 2
  {
    id: "Video-3",
    isOccupied: false,
    videoTrackId: null,
    videoTrack: null,
    userId: null,
    isTalking: false,
    remoteFeedPugin: null,
  }, // Placeholder 3
];
const waitingQueue = [];
let isMuted = true;
let isTeacher = true;
let canvasId = 69420;

function getAvailablePlaceholder() {
  return placeholders.find((placeholder) => !placeholder.isOccupied);
}

function clearPlaceholder(placeholderId) {
  const placeholderElement = document.getElementById(placeholderId);
  placeholderElement.srcObject = null; // Clear the video or audio from the element
}

function shiftPublishers(startIndex) {
  for (let i = startIndex; i < placeholders.length - 1; i++) {
    let nextPlaceholder = placeholders[i + 1];
    let currentPlaceholder = placeholders[i];

    if (nextPlaceholder.isOccupied) {
      newRemoteFacecam(
        nextPlaceholder.videoTrack,
        nextPlaceholder.userId,
        nextPlaceholder.remoteFeedPugin
      );

      nextPlaceholder.isOccupied = false;
      nextPlaceholder.videoTrackId = null;
      nextPlaceholder.videoTrack = null;
      nextPlaceholder.userId = null;
      nextPlaceholder.remoteFeedPugin = null;

      clearPlaceholder(nextPlaceholder.id);
    } else {
      break;
    }
  }
}

function startTeacherFacecam(track) {
  try {
    isPublishing = true;
    const placeholderElement = document.getElementById("teacherVideo");
    if (placeholderElement) {
      var stream = new MediaStream([track]);
      Janus.attachMediaStream(placeholderElement, stream);
    }
  } catch (error) {
    console.error("Error accessing camera:", error);
    alert("Could not access the camera. Please check your permissions.");
  }
}

function startFacecam(track) {
  try {
    isPublishing = true;
    const placeholder = placeholders.find((p) => p.id === "Video-1");
    if (placeholder) {
      if (placeholder.isOccupied === true) {
        var availablePlaceholder = getAvailablePlaceholder();
        if (availablePlaceholder) {
          newRemoteFacecam(
            placeholder.videoTrack,
            placeholder.userId,
            placeholder.remoteFeedPugin
          );
        } else {
          cleanupRemoteFeed(placeholder.remoteFeedPugin);
          waitingQueue.push(placeholder.userId);
        }
      }
      placeholder.isOccupied = true;
      placeholder.videoTrackId = track.id;
      placeholder.videoTrack = track;
      placeholder.userId = username;
      placeholder.remoteFeedPugin = videoRoomPlugin;
    }
    // Attach the stream to the local video element
    var stream = new MediaStream([track]);
    Janus.attachMediaStream(document.getElementById("Video-1"), stream);
  } catch (error) {
    console.error("Error accessing camera:", error);
    alert("Could not access the camera. Please check your permissions.");
  }
}

function stopFacecam() {
  try {
    isPublishing = false;
    const placeholder = placeholders.find((p) => p.id === "Video-1");
    if (placeholder) {
      placeholder.isOccupied = false;
      placeholder.videoTrackId = null;
      placeholder.videoTrack = null;
      placeholder.userId = null;
      placeholder.remoteFeedPugin = null;

      clearPlaceholder(placeholder.id);

      if (waitingQueue.length > 0) {
        var newId = waitingQueue[0];
        waitingQueue.splice(0, 1);
        newRemoteFeed(newId);
      } else {
        shiftPublishers(placeholders.indexOf(placeholder));
      }
    } else {
      console.log("No such placeholders!");
    }
  } catch (error) {
    console.error("Error accessing camera:", error);
    alert("Could not access the camera. Please check your permissions.");
  }
}

function newRemoteFacecam(track, userId, remoteFeedPugin) {
  try {
    console.log("placeholder", placeholders);
    const availablePlaceholder = getAvailablePlaceholder();
    if (availablePlaceholder) {
      availablePlaceholder.isOccupied = true;
      availablePlaceholder.videoTrackId = track.id;
      availablePlaceholder.videoTrack = track;
      availablePlaceholder.userId = userId;
      availablePlaceholder.remoteFeedPugin = remoteFeedPugin;

      // Attach the stream to the remote video element
      var stream = new MediaStream([track]);
      Janus.attachMediaStream(
        document.getElementById(availablePlaceholder.id),
        stream
      );
    } else {
      waitingQueue.push(userId);
    }
  } catch (error) {
    console.error("Error accessing camera:", error);
    alert("Could not access the camera. Please check your permissions.");
  }
}

function removeRemoteFacecam(userId) {
  try {
    const placeholder = placeholders.find((p) => p.userId === userId);

    if (placeholder) {
      cleanupRemoteFeed(placeholder.remoteFeedPugin);

      placeholder.isOccupied = false;
      placeholder.videoTrackId = null;
      placeholder.videoTrack = null;
      placeholder.userId = null;
      placeholder.remoteFeedPugin = null;

      clearPlaceholder(placeholder.id);

      if (waitingQueue.length > 0) {
        var newId = waitingQueue[0];
        waitingQueue.splice(0, 1);
        newRemoteFeed(newId);
      } else {
        shiftPublishers(placeholders.indexOf(placeholder));
      }
    } else if (waitingQueue.includes(userId)) {
      const index = waitingQueue.indexOf(userId); // Find the index of the element (30)
      if (index !== -1) {
        waitingQueue.splice(index, 1); // Remove one element at the found index
      }
    } else {
      console.log("No such placeholders!");
    }
  } catch (error) {
    console.error("Error accessing camera:", error);
    alert("Could not access the camera. Please check your permissions.");
  }
}

function removeTeacherFacecam() {
  try {
    if (username === teacherId) {
      console.log("Cleaning up the remote feed...");
      // Detach the remote feed from Janus
      videoRoomPlugin.detach({
        success: function () {
          console.log("Remote feed detached and cleaned up.");
        },
        error: function (error) {
          console.error("Error detaching the remote feed: ", error);
        },
      });

      const placeholderElement = document.getElementById("teacherVideo");
      placeholderElement.srcObject = null; // Clear the video or audio from the element
    } else {
      console.log("Cleaning up the remote feed...");
      // Detach the remote feed from Janus
      teacherFeedPlugin.detach({
        success: function () {
          console.log("Remote feed detached and cleaned up.");
        },
        error: function (error) {
          console.error("Error detaching the remote feed: ", error);
        },
      });

      const placeholderElement = document.getElementById("teacherVideo");
      placeholderElement.srcObject = null; // Clear the video or audio from the element
    }
  } catch (error) {
    console.error("Error accessing camera:", error);
    alert("Could not access the camera. Please check your permissions.");
  }
}

function switchRemoteFeed(placeholderIndex, oldId, newId) {
  let update = {
    request: "update",
    subscribe: [
      {
        feed: parseInt(newId),
      },
    ],
    unsubscribe: [
      {
        feed: parseInt(oldId),
      },
    ],
  };
  placeholders[placeholderIndex].remoteFeedPugin.send({ message: update });
}

function publishOwnFeed() {
  let tracks = [];
  tracks.push({ type: "video", capture: true, recv: false });
  videoRoomPlugin.createOffer({
    tracks: tracks, // Pass the tracks here
    // media: {video: videoTrack, audio: audioTrack},
    success: function (jsep) {
      let publish = {
        request: "publish",
      };

      videoRoomPlugin.send({ message: publish, jsep: jsep });
    },
    error: function (error) {
      console.error("WebRTC error:", error);
    },
  });
}

function attachCanvasPlugin() {
  janus.attach({
    plugin: "janus.plugin.videoroom",
    opaqueId: opaqueId,
    success: function (pluginHandle) {
      canvasPlugin = pluginHandle;
      console.log("Canvas plugin attached successfully.");

      canvasJoining();
      publishCanvas();
    },
    error: function (error) {
      console.error("Error attaching plugin...", error);
    },
    onmessage: async function (msg, jsep) {
      console.log("event happened in canvas plugin: ", msg);

      if (jsep) {
        canvasPlugin.handleRemoteJsep({ jsep: jsep });
      }
    },
    onlocaltrack: function (track, on) {},
    onremotetrack: function (track) {},
    oncleanup: function () {
      console.log("Cleanup done.");
    },
  });
}

function canvasJoining() {
  let join = {
    request: "join",
    room: currentRoomId,
    ptype: "publisher",
    display: username.toString(),
    id: canvasId,
  };

  console.log("join request:", join);
  canvasPlugin.send({ message: join });
}

async function publishCanvas() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true, // Capture video (screen)
    audio: false, // Optionally capture system audio
  });

  var videoTracks = stream.getVideoTracks()[0]; // Array of video tracks
  var audioTracks = stream.getAudioTracks()[0]; // Array of video tracks

  let tracks = [];
  tracks.push({ type: "video", capture: videoTracks, recv: false });
  tracks.push({ type: "audio", capture: audioTracks, recv: false });

  console.log("stream", stream);
  console.log("videoTracks", videoTracks);
  console.log("tracks", tracks);

  canvasPlugin.createOffer({
    tracks: tracks, // Pass the tracks here

    success: function (jsep) {
      let publish = {
        request: "publish",
        videocodec: "vp9",
      };

      canvasPlugin.send({ message: publish, jsep: jsep });
    },
    error: function (error) {
      console.error("WebRTC error:", error);
    },
  });
}

function unpublishOwnFeed() {
  // Unpublish our stream
  let unpublish = { request: "unpublish" };
  videoRoomPlugin.send({ message: unpublish });
}

function toggleMute() {
  isMuted = !isMuted; // Toggle the mute status

  // Send mute/unmute request to Janus
  audiobridgePlugin.send({
    message: {
      request: "configure",
      muted: isMuted,
    },
  });

  // You can also log or update the UI based on the mute state
  if (isMuted) {
    console.log("Muted");
  } else {
    console.log("Unmuted");
  }
  document.getElementById("mute").innerHTML = isMuted ? "Unmute" : "Mute";
}

function newRemoteFeed(id) {
  let remotePlugin = null;
  janus.attach({
    plugin: "janus.plugin.videoroom",
    opaqueId: opaqueId,
    success: function (pluginHandle) {
      remotePlugin = pluginHandle;
      subscribers.push(pluginHandle);
      let subscribe = {
        request: "join",
        room: currentRoomId,
        ptype: "subscriber",
        streams: [
          {
            feed: id,
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

      if (
        placeholders.some((p) => p.userId === id) ||
        waitingQueue.includes(id)
      ) {
        return;
      }
      // Add the video tracks
      if (track.kind === "video") {
        console.log("new cam id", id);
        newRemoteFacecam(track, id, remotePlugin);
      }
    },
    oncleanup: function () {
      console.log("Cleanup done for remote feed " + id);
    },
  });
}

function newTeacherRemoteFeed(id) {
  janus.attach({
    plugin: "janus.plugin.videoroom",
    opaqueId: opaqueId,
    success: function (pluginHandle) {
      teacherFeedPlugin = pluginHandle;
      subscribers.push(pluginHandle);
      let subscribe = {
        request: "join",
        room: currentRoomId,
        ptype: "subscriber",
        streams: [
          {
            feed: id,
          },
        ],
      };
      teacherFeedPlugin.send({ message: subscribe });
    },
    onmessage: function (msg, jsep) {
      console.log("event happened in new remote feed: ", msg);

      if (jsep) {
        teacherFeedPlugin.createAnswer({
          jsep: jsep,
          tracks: [{ type: "data" }],
          success: function (jsep) {
            let body = { request: "start", room: currentRoomId };
            teacherFeedPlugin.send({ message: body, jsep: jsep });
          },
          error: function (error) {
            console.error("WebRTC error:", error);
          },
        });
      }
    },
    onremotetrack: function (track, mid, on) {
      console.log("hit remote teacher", track, on);

      if (!on) {
        console.log("something something muted bs");
        return;
      }

      // Add the video tracks
      if (track.kind === "video") {
        console.log("new cam id", id);
        // Attach the stream to the remote video element
        var stream = new MediaStream([track]);
        Janus.attachMediaStream(
          document.getElementById("teacherVideo"),
          stream
        );
      }
    },
    oncleanup: function () {
      console.log("Cleanup done for remote feed " + id);
    },
  });
}

function newCanvasRemoteFeed(id) {
  janus.attach({
    plugin: "janus.plugin.videoroom",
    opaqueId: opaqueId,
    success: function (pluginHandle) {
      remoteCanvasFeedPlugin = pluginHandle;
      subscribers.push(pluginHandle);
      let subscribe = {
        request: "join",
        room: currentRoomId,
        ptype: "subscriber",
        streams: [
          {
            feed: id,
          },
        ],
      };
      remoteCanvasFeedPlugin.send({ message: subscribe });
    },
    onmessage: function (msg, jsep) {
      console.log("event happened in new remote feed: ", msg);

      if (jsep) {
        remoteCanvasFeedPlugin.createAnswer({
          jsep: jsep,
          tracks: [{ type: "data" }],
          success: function (jsep) {
            let body = { request: "start", room: currentRoomId };
            remoteCanvasFeedPlugin.send({ message: body, jsep: jsep });
          },
          error: function (error) {
            console.error("WebRTC error:", error);
          },
        });
      }
    },
    onremotetrack: function (track, mid, on) {
      console.log("hit remote canvas", track, on);

      if (!on) {
        console.log("something something muted bs");
        return;
      }

      // Add the video tracks
      if (track.kind === "video") {
        console.log("new cam id", id);
        // Attach the stream to the remote video element
        var stream = new MediaStream([track]);
        const remoteVideo = document.getElementById("remoteVideoCanvas");

        Janus.attachMediaStream(remoteVideo, stream);
        Janus.attachMediaStream(document.getElementById("Video-3"), stream);

        // Start drawing the video on the canvas
        drawVideoOnCanvas(remoteVideo);
      }
    },
    oncleanup: function () {
      console.log("Cleanup done for remote feed " + id);
    },
  });
}

function drawVideoOnCanvas(videoElement) {
  const canvas = document.getElementById("canvas_view_1");
  const ctx = canvas.getContext("2d");

  function draw() {
    // Draw the video frame on the canvas
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Use requestAnimationFrame for smooth drawing
    requestAnimationFrame(draw);
  }

  // Start the drawing loop
  draw();
}

function joinAudioRoom(roomId, plugin) {
  event.preventDefault(); // Prevent form from submitting to a new page
  username = document.getElementById("username").value;
  if (username) {
    // Join the audio room
    let register = {
      request: "join",
      room: roomId,
      display: username.toString(),
      id: parseInt(username),
    };
    plugin.send({ message: register });
  } else {
    console.log("This field is required!"); // Alert if the field is empty
  }
}

function cleanupRemoteFeed(remoteFeed) {
  if (remoteFeed) {
    console.log("Cleaning up the remote feed...");

    // Detach the remote feed from Janus
    remoteFeed.detach({
      success: function () {
        console.log("Remote feed detached and cleaned up.");
      },
      error: function (error) {
        console.error("Error detaching the remote feed: ", error);
      },
    });
  }
}

function switchAudioBridge(newRoomId, plugin) {
  let changeroom = {
    request: "changeroom",
    room: newRoomId,
    display: username.toString(),
    id: parseInt(username),
  };
  plugin.send({ message: changeroom });
}

function createVideoRoom(roomId, plugin) {
  let createVideoRoom = {
    request: "create",
    room: roomId,
    publishers: 6,
    videocodec: "vp9",
  };
  plugin.send({
    message: createVideoRoom,
    success: function (result) {},
  });
}

function createAudioBridge(roomId, plugin) {
  let createAudioBridge = {
    request: "create",
    room: roomId,
    description: "My audio room",
    audiolevel_event: true,
  };
  plugin.send({
    message: createAudioBridge,
    success: function (result) {},
  });
}

document.getElementById("createRoom").addEventListener("click", function () {
  createVideoRoom(currentRoomId, videoRoomPlugin);
  createAudioBridge(currentRoomId, audiobridgePlugin);
});

document.getElementById("joinRoom").addEventListener("click", function (event) {
  event.preventDefault(); // Prevent form from submitting to a new page
  username = document.getElementById("username").value;
  if (username) {
    let join = {
      request: "join",
      room: currentRoomId,
      ptype: "publisher",
      display: username.toString(),
      id: parseInt(username),
    };

    console.log("join request:", join);
    videoRoomPlugin.send({ message: join });
  } else {
    console.log("This field is required!"); // Alert if the field is empty
  }
});
