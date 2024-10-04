const CANVAS_DESIGN_SIZE = 700;
const canvas_size = 700;
let locale = 'vi';
const CONTENT_VIEW = {
  MAIN_CONTENT: 0,
  PDF: 1,
  REVIEW_CONTENT: 2,
  REVIEW_EXERCISE: 3,
};
let eldCustom = null;
const a4_size = 210 / 297;

let jsonList = [];

const extentLibPrototype = (eldraw, EldCustom, eldCustom) => {
  // Your implementation
};
const initCanvasEvents = canvas => {
  // Initialize canvas events if needed
  canvas.on('mouse:down', e => {
    // Check if an object is clicked
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      // If no object is active, clear any existing selection box
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  });
};

const calcMainSize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const canvas_height = getCanvasHeight(width);

  // return canvas_height < height ? width : parseInt((width * height) / canvas_height);
  return width;
};

const getCanvasHeight = (width = window.innerWidth) => {
  let sw = 210;
  let sh = 297;

  if (eldCustom && eldCustom.canvas && eldCustom.canvas._slideMaster) {
    sw = eldCustom.canvas._slideMaster.swr;
    sh = eldCustom.canvas._slideMaster.shr;
  }

  return parseInt(width * (sh / sw));
};

const initEldcustom = () => {
  return new Promise(async resolve => {
    extentLibPrototype(eldraw, EldCustom, eldCustom);

    const canvasMainSize = calcMainSize();

    eldCustom = new EldCustom('canvas_view_1', canvasMainSize);
    eldCustom.name = 'eldCustom';

    eldCustom.canvas.renderOnAddRemove = false;
    eldCustom.canvas.set({
      designMode: false,
    });

    eldCustom.setSize(canvasMainSize);
    eldCustom.canvas.setIsPlayer(true);
    eldCustom.canvas.isTeacher = true;
    eldCustom.canvas.setWidth(canvasMainSize);
    eldCustom.canvas.setHeight(getCanvasHeight(canvasMainSize));

    eldCustom.canvas2 = new eldraw.Canvas('canvas_view_2', {
      renderOnAddRemove: false,
      designMode: false,
    });
    eldCustom.canvas2.setIsPlayer(true);
    eldCustom.canvas2.isTeacher = true;
    eldCustom.canvas2.preserveObjectStacking = true;
    eldCustom.canvas2.setWidth(canvasMainSize);
    eldCustom.canvas2.setHeight(getCanvasHeight(canvasMainSize));
    eldCustom.canvas2.tabIndex = 1000;
    eldCustom.canvas2.hoverCursor = 'auto';
    eldCustom.canvas2.saveObject = true;
    eldCustom.canvas2.freeDrawingCursor =
      'url("/assets/images/svg/toolbar/toolbar_ico-cursor-pen.svg") 0 25, auto';

    eldCustom.canvas3 = new eldraw.Canvas('canvas_view_3', {
      renderOnAddRemove: false,
      designMode: false,
    });
    eldCustom.canvas3.setIsPlayer(true);
    eldCustom.canvas3.isTeacher = true;
    eldCustom.canvas3.preserveObjectStacking = true;
    eldCustom.canvas3.setWidth(canvasMainSize);
    eldCustom.canvas3.setHeight(getCanvasHeight(canvasMainSize));
    eldCustom.canvas3.tabIndex = 1000;
    eldCustom.canvas3.hoverCursor = 'auto';
    eldCustom.canvas3.saveObject = true;
    eldCustom.canvas3.freeDrawingCursor =
      'url("/assets/images/svg/toolbar/toolbar_ico-cursor-pen.svg") 0 25, auto';

    eldCustom.init();
    initCanvasEvents(eldCustom.canvas);
    initCanvasEvents(eldCustom.canvas2);
    initCanvasEvents(eldCustom.canvas3);

    if (locale === 'vi') {
      eldraw.language = eldraw.util.lang.LOCATION.VI;
    } else if (locale === 'en') {
      eldraw.language = eldraw.util.lang.LOCATION.EN;
    }

    eldCustom.canvas.currentViewState = CONTENT_VIEW.MAIN_CONTENT;

    resolve();
  });
};

el_scroll.preloadContentView = function (view) {
  loadSlideExercise(view);
};

const loadSlideExercise = viewer => {
  let canvas;

  switch (viewer.viewId) {
    case '#canvas_section_1':
      canvas = eldCustom.canvas;
      break;
    case '#canvas_section_2':
      canvas = eldCustom.canvas2;
      break;
    case '#canvas_section_3':
      canvas = eldCustom.canvas3;
      break;
  }

  const json = jsonList[viewer.currentPage];

  canvas.loadFromJSON(
    json,
    () => {
      viewer.statusLoad = true;

      // if (ReviewExercise.role == USER_ROLES.LEARNER) {
      //     if (ReviewExercise.dataExerciseReview.length > 0) {
      //         let result = ReviewExercise.dataExerciseReview.find((item) => {
      //             return item.SlideExerciseId === canvas.currentSlideExerciseId
      //         })

      //         if (result) {
      //             canvas.importExerciseQuestionAnswer(result.answers)
      //         }
      //     } else {
      //         if (
      //             typeof ReviewExercise.exerciseAnswered[canvas.currentSlideExerciseId] !==
      //             'undefined'
      //         ) {
      //             canvas.importExerciseQuestionAnswer(
      //                 ReviewExercise.exerciseAnswered[canvas.currentSlideExerciseId]
      //             )
      //         }
      //     }

      //     if (ReviewExercise.isDoExercise && !ReviewExercise.doExerciseEnded) {
      //         canvas.setSubmitExercise(false)
      //     } else {
      //         canvas.setSubmitExercise(true)
      //     }
      // }
    },
    (o, object) => {
      object.objectLocked = true;
      object.isNotSend = true;
      object.isBGSlide = true;
      if (typeof playVideoStream !== 'undefined') {
        if (object.videoId) {
          if (object.videoUrl) {
            // clickPlayVideo(object);
          }
        } else {
          if (object.videoUrl) {
            // clickPlayYoutube(object);
          }
        }
      }
      if (typeof playAudioStream !== 'undefined') {
        if (object.audioUrl) {
          // clickPlayAudio(object);
        }
      }
      object.scaleX = (object.scaleX * eldCustom.size) / CANVAS_DESIGN_SIZE;
      object.scaleY = (object.scaleY * eldCustom.size) / CANVAS_DESIGN_SIZE;
      object.left = (object.left * eldCustom.size) / CANVAS_DESIGN_SIZE;
      object.top = (object.top * eldCustom.size) / CANVAS_DESIGN_SIZE;

      object.setCoords();

      // if (object.type === 'gifuct') {
      // 	object.loopAnimation = true;
      // 	if (typeof live_params !== 'undefined' && !live_params.isLearner) {
      // 		object.on('mousedblclick', function () {
      // 			if (object.isPlaying) {
      // 				object.stop();
      // 				if (typeof sendStopAnimationObject !== 'undefined') {
      // 					sendStopAnimationObject(object.ObjectId);
      // 				}
      // 			} else {
      // 				object.play();
      // 				if (typeof sendPlayAnimationObject !== 'undefined') {
      // 					sendPlayAnimationObject(object.ObjectId);
      // 				}
      // 			}
      // 		});
      // 	}
      // }
    },
  );
};

const setDrawingMode = enable => {
  eldCustom.canvas.isDrawingMode = enable;
  eldCustom.canvas2.isDrawingMode = enable;
  eldCustom.canvas3.isDrawingMode = enable;
};

const setPenType = thickness => {
  eldCustom.canvas.freeDrawingBrush.width = thickness;
  eldCustom.canvas2.freeDrawingBrush.width = thickness;
  eldCustom.canvas3.freeDrawingBrush.width = thickness;
};

const toggleDrawMode = () => {
  const drawBtn = document.getElementById('drawBtn');
  const exitDrawBtn = document.getElementById('exitDrawBtn');

  if (eldCustom.canvas.isDrawingMode) {
    setDrawingMode(false);
    drawBtn.classList.remove('hidden');
    exitDrawBtn.classList.add('hidden');
  } else {
    setDrawingMode(true);
    drawBtn.classList.add('hidden');
    exitDrawBtn.classList.remove('hidden');
  }

  if (eldCustom.canvas2.isDrawingMode) {
    setDrawingMode(false);
    drawBtn.classList.remove('hidden');
    exitDrawBtn.classList.add('hidden');
  } else {
    setDrawingMode(true);
    drawBtn.classList.add('hidden');
    exitDrawBtn.classList.remove('hidden');
  }

  if (eldCustom.canvas3.isDrawingMode) {
    setDrawingMode(false);
    drawBtn.classList.remove('hidden');
    exitDrawBtn.classList.add('hidden');
  } else {
    setDrawingMode(true);
    drawBtn.classList.add('hidden');
    exitDrawBtn.classList.remove('hidden');
  }
};

const initCanvasScreen = async () => {
  await initEldcustom();
  console.log('Canvases are ready!');

  // Add event listeners for draw button and pen type buttons
  document.getElementById('drawBtn').addEventListener('click', () => {
    toggleDrawMode();
  });

  document.getElementById('exitDrawBtn').addEventListener('click', () => {
    toggleDrawMode();
  });

  document.getElementById('normalPen').addEventListener('click', () => {
    setPenType(2); // Set thickness for normal pen
  });

  document.getElementById('highlightPen').addEventListener('click', () => {
    setPenType(10); // Set thickness for highlight pen
  });

  eldCustom.canvas.setHeight(eldCustom.size / a4_size);
  eldCustom.canvas2.setHeight(eldCustom.size / a4_size);
  eldCustom.canvas3.setHeight(eldCustom.size / a4_size);
  eldCustom.canvas2.setWidth(eldCustom.size);
  eldCustom.canvas3.setWidth(eldCustom.size);

  const ReviewExerciseHeight =
    (Object.keys(jsonList).length * eldCustom.size) / a4_size;

  document.getElementById('Wrapper').style.height =
    String(
      // (ReviewExerciseHeight * eldCustom.size) / CANVAS_DESIGN_SIZE
      ReviewExerciseHeight,
    ) + 'px';

  document.getElementById('canvas_section_1').style.top = '0px';

  document.getElementById('canvas_section_2').style.top =
    String(eldCustom.size / a4_size) + 'px';
  document.getElementById('canvas_section_2').style.display = 'block';

  document.getElementById('canvas_section_3').style.top =
    String((eldCustom.size / a4_size) * 2) + 'px';
  document.getElementById('canvas_section_3').style.display = 'block';

  var scrollableElement = document.getElementById('Wrapper').parentNode;
  // scrollableElement.scrollable = true;
  el_scroll.totalPage = Object.keys(jsonList).length;
  // el_scroll.viewPortHeight = window.innerHeight;
  // el_scroll.pageHeight = eldCustom.size / a4_size;

  el_scroll.currentViewIndex = 0;
  el_scroll.pageHeight = eldCustom.size / a4_size;
  el_scroll.viewPortHeight = scrollableElement.clientHeight;
  el_scroll.currentPage = 0;

  scrollableElement.addEventListener('scroll', () => {
    el_scroll.onScroll(scrollableElement.scrollTop);
  });

  el_scroll.onPageChange(0);
};

// document.addEventListener("DOMContentLoaded", async () => {
//   await initCanvasScreen();
// });

// window.addEventListener('load', async () => {
//   await initCanvasScreen();
// });

// Resize canvas on window resize
window.addEventListener('resize', () => {
  // initEldcustom();
});
