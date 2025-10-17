// This file is responsible for integrating gesture recognition using the camera feed.
// It utilizes libraries (like MediaPipe) to detect and interpret gestures made by the user.

const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const ctx = canvasElement.getContext('2d');

// Load the MediaPipe Hands model
const hands = new Hands({ locateFile: (file) => {
    return `libs/mediapipe/hands/${file}`;
}});

hands.onResults(onResults);

// Start the camera
async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });
    videoElement.srcObject = stream;
}

// Process the video feed
function onResults(results) {
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    ctx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
            drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 2 });
        }
    }
}

// Initialize the application
async function init() {
    await startCamera();
    videoElement.play();
    hands.send({ image: videoElement });
}

// Call the init function to start the application
init();