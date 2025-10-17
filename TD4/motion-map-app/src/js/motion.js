let handpose;
let predictions = [];
let lastZoomTime = 0;
const ZOOM_COOLDOWN = 500;

class HandDetector {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('output_canvas');
        this.gestureDisplay = document.getElementById('gesture-display');
        this.ctx = this.canvas.getContext('2d');
        this.handpose = null;
    }

    async init() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            this.video.srcObject = stream;
            await this.video.play();

            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            this.handpose = ml5.handpose(this.video, {
                flipHorizontal: true
            }, () => {
                console.log('Handpose model loaded');
                this.startDetection();
            });
        } catch (error) {
            console.log('Camera initialization error:', error);
        }
    }

    startDetection() {
        this.handpose.on('predict', (results) => {
            predictions = results;
            this.handlePredictions(results);
        });
        this.animate();
    }

    handlePredictions(predictions) {
        if (predictions.length > 0) {
            const hand = predictions[0];
            const gesture = this.recognizeGesture(hand);
            this.displayGesture(gesture);

            if (gesture === 'palm' && this.canZoom() && window.map) {
                const currentZoom = window.map.getZoom();
                window.map.setZoom(currentZoom + 0.5);
                lastZoomTime = Date.now();
            }
        } else {
            this.displayGesture('Aucun geste détecté');
        }
    }

    recognizeGesture(hand) {
        const palm = hand.annotations.palmBase[0];
        const fingers = {
            thumb: hand.annotations.thumb,
            indexFinger: hand.annotations.indexFinger,
            middleFinger: hand.annotations.middleFinger,
            ringFinger: hand.annotations.ringFinger,
            pinky: hand.annotations.pinky
        };

        // Détecter la paume ouverte
        if (this.isPalmVisible(hand)) {
            return 'palm';
        }

        // Détecter le poing fermé
        const allFingersClosed = Object.values(fingers).every(finger => 
            this.isFingerClosed(finger, palm)
        );
        if (allFingersClosed) {
            return 'fist';
        }

        // Détecter le pointage
        const indexPointing = !this.isFingerClosed(fingers.indexFinger, palm) &&
            Object.entries(fingers).every(([name, finger]) => 
                name === 'indexFinger' || this.isFingerClosed(finger, palm)
            );
        if (indexPointing) {
            return 'pointing';
        }

        return 'autre';
    }

    isFingerClosed(finger, palm) {
        const tipToPalmDistance = Math.sqrt(
            Math.pow(finger[3][0] - palm[0], 2) + 
            Math.pow(finger[3][1] - palm[1], 2)
        );
        return tipToPalmDistance < 50;
    }

    isPalmVisible(hand) {
        const palm = hand.annotations.palmBase[0];
        const middleFinger = hand.annotations.middleFinger[0];
        
        const distance = Math.sqrt(
            Math.pow(palm[0] - middleFinger[0], 2) + 
            Math.pow(palm[1] - middleFinger[1], 2)
        );

        return distance > 40;
    }

    displayGesture(gesture) {
        const gestureMessages = {
            'palm': 'Paume ouverte ✋',
            'fist': 'Poing fermé ✊',
            'pointing': 'Doigt pointé ☝️',
            'autre': 'Geste non reconnu 🤔',
            'Aucun geste détecté': 'Aucun geste détecté 👀'
        };

        if (this.gestureDisplay) {
            this.gestureDisplay.textContent = gestureMessages[gesture] || gesture;
        }
    }

    canZoom() {
        return Date.now() - lastZoomTime > ZOOM_COOLDOWN;
    }

    animate() {
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        if (predictions.length > 0) {
            this.drawHand(predictions[0]);
        }

        requestAnimationFrame(() => this.animate());
    }

    drawHand(hand) {
        for (let keypoint of hand.landmarks) {
            const [x, y] = keypoint;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
            this.ctx.fillStyle = 'red';
            this.ctx.fill();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const detector = new HandDetector();
    detector.init();
});