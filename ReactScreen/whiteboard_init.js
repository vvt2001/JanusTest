const CANVAS_DESIGN_SIZE = 700;
const canvas_size = 700;
let locale = "vi";
const CONTENT_VIEW = {
  MAIN_CONTENT: 0,
  PDF: 1,
  REVIEW_CONTENT: 2,
  REVIEW_EXERCISE: 3,
};
let eldCustom = null;
let currJson;
const DrawCustom = {};
const STATES = {
  MODIFY_CANVAS: {
    UPDATE: "MODIFY_CANVAS_UPDATE",
    SWITCH_PAGE: "SWITCH_PAGE",
  },
  MODIFY_OBJECT: {
    ADD: "MODIFY_OBJECT_ADD",
    EDIT: "MODIFY_OBJECT_EDIT",
    REMOVE: "MODIFY_OBJECT_REMOVE",
  },
  QUESTION: {
    ASSIGN: "QUESTION_ASSIGN",
  },
  EXERCISE: {
    OPEN: "EXERCISE_OPEN",
    CLOSE: "EXERCISE_CLOSE",
    SCROLL: "EXERCISE_SCROLL",
    START: "EXERCISE_START",
    STOP: "EXERCISE_STOP",
    SEND_SUBMIT_EXERCISE: "SEND_SUBMIT_EXERCISE",
  },
  SLIDE: {
    OPEN: "SLIDE_OPEN",
    CLOSE: "SLIDE_CLOSE",
    START: "SLIDE_START",
    STOP: "SLIDE_STOP",
    SEND_SUBMIT_SLIDE: "SEND_SUBMIT_SLIDE",
  },
  YOUTUBE: {
    PLAY: "YOUTUBE_PLAY",
    PAUSE: "YOUTUBE_PAUSE",
    STOP: "YOUTUBE_STOP",
  },
  VIDEO: {
    PLAY: "VIDEO_PLAY",
    PAUSE: "VIDEO_PAUSE",
    STOP: "VIDEO_STOP",
  },
  AUDIO: {
    PLAY: "AUDIO_PLAY",
    PAUSE: "AUDIO_PAUSE",
    STOP: "AUDIO_STOP",
  },
  CHAT: {
    CHAT_PUBLIC: "CHAT_PUBLIC",
    CHAT_PRIVATE: "CHAT_PRIVATE",
  },
};

const extentLibPrototype = (eldraw, EldCustom, eldCustom) => {
  EldCustom.prototype.addObject = function (obj, canvas) {
    obj.scaleX = (obj.scaleX * this.size) / canvas_size;
    obj.scaleY = (obj.scaleY * this.size) / canvas_size;
    obj.left = (obj.left * this.size) / canvas_size;
    obj.top = (obj.top * this.size) / canvas_size;
    obj.setCoords();
    if (typeof canvas !== "undefined") {
      canvas.add(obj);
      canvas.requestRenderAll();
    } else {
      this.canvas.add(obj);
      this.canvas.requestRenderAll();
    }
  };
};
const initCanvasEvents = (canvas) => {
  // Initialize canvas events if needed
  canvas.on({
    "mouse:down": (e) => {
      // Check if an object is clicked
      const activeObject = canvas.getActiveObject();
      if (!activeObject) {
        // If no object is active, clear any existing selection box
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    },
    "eldraw:randomGemMore": (options) => {},
    "exerciseQuestion:previewMedia": (options) => {},
    "object:moving": (e) => {},
    "canvas:cleared": (e) => {},
    "canvas:jsonLoaded": (e) => {},
    "textboxQuestion:viewAnswer": (option) => {},
    "exerciseQuestion:showDropdownOption": (options) => {},
    "textLink:click": (options) => {},
    "before:render": () => {},
    "after:render": () => {},
    "selection:created": (e) => {},
    moved: (e) => {},
    "text:changed": (e) => {},
    "eventdata:created": async (data) => {},
    "question:performViewAnswer": (data) => {},
    "object:scaling": (e) => {},
    "object:beginDrag": (obj) => {},
    "object:modified": (e) => {},
    "object:added": (e) => {
      const obj = e.target;

      if (!obj.ObjectId) {
        obj.ObjectId = AppUtils.generateObjectId(canvas, eldCustom);
      }

      const scaleX = obj.scaleX || 0;
      const scaleY = obj.scaleY || 0;
      const left = obj.left || 0;
      const top = obj.top || 0;

      if (obj.ObjectId != "bgSlide") {
        const tempScaleX = (scaleX / eldCustom.size) * CANVAS_DESIGN_SIZE;
        const tempScaleY = (scaleY / eldCustom.size) * CANVAS_DESIGN_SIZE;
        const tempLeft = (left / eldCustom.size) * CANVAS_DESIGN_SIZE;
        const tempTop = (top / eldCustom.size) * CANVAS_DESIGN_SIZE;

        obj.scaleX = tempScaleX;
        obj.scaleY = tempScaleY;
        obj.left = tempLeft;
        obj.top = tempTop;
        obj.setCoords();
      }

      if (obj.ObjectId != "bgSlide") {
        if (canvas.saveObject && !obj.isNotSend) {
          const list = [];
          list.push(obj);

          const data = { state: STATES.MODIFY_OBJECT.ADD, content: list };

          sendModifyObject(JSON.stringify(data));
        }
        if (obj.isNotSend) {
          obj.isNotSend = false;
        }
      } else {
        canvas.sendToBack(obj);
      }

      if (obj.ObjectId != "bgSlide") {
        obj.scaleX = scaleX;
        obj.scaleY = scaleY;
        obj.left = left;
        obj.top = top;
        obj.setCoords();
      }

      // updateSVG()
      // changeStateUndoRedo()
    },
    "object:removed": (e) => {},
    "mouse:up": (e) => {},
    "mouse:down": (e) => {
      // Check if an object is clicked
      const activeObject = canvas.getActiveObject();
      if (!activeObject) {
        // If no object is active, clear any existing selection box
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    },
    "flowLine:removed": (target) => {},
    "flowLine:modified": (target) => {},
    "matchingLine:added": (target) => {},
    "matchingLine:removed": (target) => {},
  });
};
const sendModifyObject = (message) => {
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
    success: function () {},
    error: function (error) {
      console.error("Error broadcasting message:", error);
    },
  });
};

async function handleIncomingMessage(msg) {
  if (msg["textroom"] === "message") {
    let data = JSON.parse(msg["text"]);

    const objectList = data.content;
    let objNew, objOld;

    switch (data.type) {
      case STATES.MODIFY_CANVAS.UPDATE:
        objectList.data.forEach(async (objectItem, index) => {
          const obj = objectItem.json;
          const object = JSON.parse(obj);
          switch (objectList.state) {
            case STATES.MODIFY_OBJECT.ADD:
              objNew = await DrawCustom.getObject(object);

              objNew.needFillAnswer = true;

              eldCustom.addObject(objNew);

              eldCustom.canvas.saveObject = true;

              break;
            case STATES.MODIFY_OBJECT.EDIT:
              objOld = eldCustom.canvas.findObjectById(objectItem.objectId);

              if (objOld) {
                objectItem.ObjectId = objOld.ObjectId;

                eldCustom.canvas.remove(objOld);
              }

              objNew = await DrawCustom.getObject(object);

              objNew.needFillAnswer = true;

              eldCustom.addObject(objNew);
              eldCustom.canvas.saveObject = true;

              break;
            case STATES.MODIFY_OBJECT.REMOVE:
              objOld = eldCustom.canvas.findObjectById(objectItem.objectId);

              if (objOld) {
                eldCustom.canvas.remove(objOld);
              }
              eldCustom.canvas.saveObject = true;

              break;
          }
        });
    }
  } else {
    console.warn("Unexpected message format:", msg);
  }
}

DrawCustom.getObject = (object, canvas = false) => {
  return new Promise(function (rs) {
    let klass = eldraw.util.getKlass(object.type, null);

    if (canvas) {
      klass.fromObject(canvas, object, function (data) {
        rs(data);
      });
    } else {
      klass.fromObject(object, function (data) {
        rs(data);
      });
    }
  });
};

const calcMainSize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const canvas_height = getCanvasHeight(width);

  return canvas_height < height
    ? width
    : parseInt((width * height) / canvas_height);
};

const getCanvasHeight = (width = window.innerWidth) => {
  let sw = 16;
  let sh = 9;

  if (eldCustom && eldCustom.canvas && eldCustom.canvas._slideMaster) {
    sw = eldCustom.canvas._slideMaster.swr;
    sh = eldCustom.canvas._slideMaster.shr;
  }

  return parseInt(width * (sh / sw));
};

const initEldcustom = () => {
  return new Promise(async (resolve) => {
    extentLibPrototype(eldraw, EldCustom, eldCustom);

    const canvasMainSize = calcMainSize();

    eldCustom = new EldCustom("canvas_view_1", canvasMainSize);
    eldCustom.name = "eldCustom";

    eldCustom.canvas.renderOnAddRemove = false;
    eldCustom.canvas.set({
      designMode: false,
    });

    eldCustom.setSize(canvasMainSize);
    eldCustom.canvas.setIsPlayer(true);
    eldCustom.canvas.isTeacher = true;
    eldCustom.canvas.setWidth(canvasMainSize);
    eldCustom.canvas.setHeight(getCanvasHeight(canvasMainSize));

    eldCustom.canvas2 = new eldraw.Canvas("canvas_view_2", {
      renderOnAddRemove: false,
      designMode: false,
    });
    eldCustom.canvas2.setIsPlayer(true);
    eldCustom.canvas2.isTeacher = true;
    eldCustom.canvas2.preserveObjectStacking = true;
    eldCustom.canvas2.setWidth(canvasMainSize);
    eldCustom.canvas2.setHeight(getCanvasHeight(canvasMainSize));
    eldCustom.canvas2.tabIndex = 1000;
    eldCustom.canvas2.hoverCursor = "auto";
    eldCustom.canvas2.saveObject = true;
    eldCustom.canvas2.freeDrawingCursor =
      'url("/assets/images/svg/toolbar/toolbar_ico-cursor-pen.svg") 0 25, auto';

    eldCustom.canvas3 = new eldraw.Canvas("canvas_view_3", {
      renderOnAddRemove: false,
      designMode: false,
    });
    eldCustom.canvas3.setIsPlayer(true);
    eldCustom.canvas3.isTeacher = true;
    eldCustom.canvas3.preserveObjectStacking = true;
    eldCustom.canvas3.setWidth(canvasMainSize);
    eldCustom.canvas3.setHeight(getCanvasHeight(canvasMainSize));
    eldCustom.canvas3.tabIndex = 1000;
    eldCustom.canvas3.hoverCursor = "auto";
    eldCustom.canvas3.saveObject = true;
    eldCustom.canvas3.freeDrawingCursor =
      'url("/assets/images/svg/toolbar/toolbar_ico-cursor-pen.svg") 0 25, auto';

    eldCustom.init();
    initCanvasEvents(eldCustom.canvas);
    initCanvasEvents(eldCustom.canvas2);
    initCanvasEvents(eldCustom.canvas3);

    if (locale === "vi") {
      eldraw.language = eldraw.util.lang.LOCATION.VI;
    } else if (locale === "en") {
      eldraw.language = eldraw.util.lang.LOCATION.EN;
    }

    eldCustom.canvas.currentViewState = CONTENT_VIEW.MAIN_CONTENT;

    currJson = eldCustom.canvas.toJSON();

    resolve();
  });
};

const setDrawingMode = (enable) => {
  eldCustom.canvas.isDrawingMode = enable;
  eldCustom.canvas2.isDrawingMode = enable;
  eldCustom.canvas3.isDrawingMode = enable;
};

const setPenType = (thickness) => {
  eldCustom.canvas.freeDrawingBrush.width = thickness;
  eldCustom.canvas2.freeDrawingBrush.width = thickness;
  eldCustom.canvas3.freeDrawingBrush.width = thickness;
};

const toggleDrawMode = () => {
  const drawBtn = document.getElementById("drawBtn");
  const exitDrawBtn = document.getElementById("exitDrawBtn");

  if (eldCustom.canvas.isDrawingMode) {
    setDrawingMode(false);
    drawBtn.classList.remove("hidden");
    exitDrawBtn.classList.add("hidden");
  } else {
    setDrawingMode(true);
    drawBtn.classList.add("hidden");
    exitDrawBtn.classList.remove("hidden");
  }
};

window.addEventListener("load", () => {
  initEldcustom().then(() => {
    // Add event listeners for draw button and pen type buttons
    document.getElementById("drawBtn").addEventListener("click", () => {
      toggleDrawMode();
    });

    document.getElementById("exitDrawBtn").addEventListener("click", () => {
      toggleDrawMode();
    });

    document.getElementById("normalPen").addEventListener("click", () => {
      setPenType(2); // Set thickness for normal pen
    });

    document.getElementById("highlightPen").addEventListener("click", () => {
      setPenType(10); // Set thickness for highlight pen
    });

    document.getElementById("check").addEventListener("click", () => {
      console.log("checking param", jsonList);
    });
  });
});

// Resize canvas on window resize
window.addEventListener("resize", () => {});
