import React, { useRef } from 'react';
import { WebView } from 'react-native-webview';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image, StyleSheet,
     Dimensions, 
     PanResponder,
     Animated
} from 'react-native';
const { width, height } = Dimensions.get('window');
import Video from 'react-native-video';

const HtmlContent = ({ navigation }) => {
    const pan = useRef(new Animated.ValueXY()).current;

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: () => {
          // Optional: Snap back to original position or any other logic
        },
      })
    ).current;
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Canvas Draw and Erase Demo</title>
    <style>
        canvas {
            border: 1px solid #000;
        }
        .controls {
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="controls">
        <button id="drawMode">Draw</button>
        <button id="eraseMode">Erase</button>
        <button id="clearCanvas">Clear</button>
    </div>
    <canvas id="myCanvas" width="960" height="1000"></canvas>
    <script>
        var canvas = document.getElementById('myCanvas');
        var context = canvas.getContext('2d');

        var isDrawing = false;
        var isErasing = false;

        function startDrawing(event) {
            isDrawing = true;
            context.beginPath();
            context.moveTo(event.offsetX, event.offsetY);
        }

        function draw(event) {
            if (!isDrawing) return;
            context.lineTo(event.offsetX, event.offsetY);
            context.stroke();
        }

        function stopDrawing() {
            if (!isDrawing) return;
            isDrawing = false;
            context.closePath();
        }

        function startErasing(event) {
            isErasing = true;
            context.globalCompositeOperation = 'destination-out';
        }

        function erase(event) {
            if (!isErasing) return;
            context.beginPath();
            context.arc(event.offsetX, event.offsetY, 10, 0, 2 * Math.PI);
            context.fill();
        }

        function stopErasing() {
            if (!isErasing) return;
            isErasing = false;
            context.globalCompositeOperation = 'source-over';
        }

        function clearCanvas() {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }

        document.getElementById('drawMode').addEventListener('click', function() {
            isDrawing = true;
            isErasing = false;
            context.globalCompositeOperation = 'source-over';
        });

        document.getElementById('eraseMode').addEventListener('click', function() {
            isDrawing = false;
            isErasing = true;
            context.globalCompositeOperation = 'destination-out';
        });

        document.getElementById('clearCanvas').addEventListener('click', clearCanvas);

        canvas.addEventListener('mousedown', function(event) {
            if (isDrawing) startDrawing(event);
            if (isErasing) startErasing(event);
        });

        canvas.addEventListener('mousemove', function(event) {
            if (isDrawing) draw(event);
            if (isErasing) erase(event);
        });

        canvas.addEventListener('mouseup', function() {
            stopDrawing();
            stopErasing();
        });

        canvas.addEventListener('mouseleave', function() {
            stopDrawing();
            stopErasing();
        });
    </script>
</body>
</html>


`;

    return (
        // <SafeAreaView style={{ flex: 1 }}>
        //     <View
        //         style={{
        //             flexDirection: 'row',
        //             justifyContent: 'center',
        //             marginBottom: 30,
        //         }}>
        //         <TouchableOpacity onPress={() => navigation.goBack()}>
        //             <Text style={{ color: '#AD40AF', fontWeight: '700' }}> Back</Text>
        //         </TouchableOpacity>
        //     </View>
        //     <View style={{
        //             flex: 1,
        //             justifyContent: 'center',
        //             alignItems: 'center',
        //     }}>
        //         <Video
        //             source={{ uri: 'https://www.youtube.com/watch?v=xbdJf9MRL7A&list=PLN0tvDAN1yvSNbkHAwPzJ5O4pP_e2vyme&index=8' }} // Thay bằng URL video của bạn
        //             ref={(ref) => { this.player = ref }}
        //             onBuffer={this.onBuffer}
        //             onError={this.videoError}
        //             style={{
        //                 // width: Dimensions.get('window').width,
        //                 // height: Dimensions.get('window').height,
        //             }}
        //             controls={true} // Hiển thị điều khiển video
        //             resizeMode="contain" // Chế độ co giãn video
        //         />
        //     </View>
        //     <WebView
        //         originWhitelist={['*']}
        //         source={{ html: htmlContent }}
        //         style={{ flex: 1 }}
        //     />
        // </SafeAreaView>
                <SafeAreaView style={{ flex: 1 }}>
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
                       <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={{ flex: 1 }}
            />
        <View style={styles.container}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[pan.getLayout(), styles.videoContainer]}
        >
          <Video
            source={{ uri: 'https://www.w3schools.com/html/mov_bbb.mp4' }}
            style={styles.video}
            controls={true}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
      </SafeAreaView>
    );
};
const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    videoContainer: {
      width: width * 0.6, // Chiều rộng video
      height: height * 0.3, // Chiều cao video
      backgroundColor: 'black',
      position: 'absolute',
      top: height * 0.35, // Vị trí ban đầu của video
      left: width * 0.2,
    },
    video: {
      width: '100%',
      height: '100%',
    },
})

export default HtmlContent;
