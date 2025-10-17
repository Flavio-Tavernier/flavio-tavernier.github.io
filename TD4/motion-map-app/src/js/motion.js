let handpose;
let predictions = [];
let lastZoomTime = 0;
const ZOOM_COOLDOWN = 500; // ms entre chaque zoom

class HandDetector {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('output_canvas');
        this.ctx = this.canvas.getContext('2d');
        this.handpose = null;
    }

    async init() {
        try {
            // Configuration de la caméra
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            this.video.srcObject = stream;
            await this.video.play();

            // Configuration du canvas
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            // Initialisation de handpose
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
        // Démarrer la détection des mains
        this.handpose.on('predict', (results) => {
            predictions = results;
            this.handlePredictions(results);
        });

        // Démarrer la boucle d'animation
        this.animate();
    }

    handlePredictions(predictions) {
        if (predictions.length > 0 && window.map) {
            const hand = predictions[0];
            
            if (this.isPalmVisible(hand) && this.canZoom()) {
                const currentZoom = window.map.getZoom();
                window.map.setZoom(currentZoom + 0.5);
                lastZoomTime = Date.now();
            }
        }
    }

    isPalmVisible(hand) {
        const palm = hand.annotations.palmBase[0];
        const middleFinger = hand.annotations.middleFinger[0];
        
        // Calculer la distance entre la paume et le doigt du milieu
        const distance = Math.sqrt(
            Math.pow(palm[0] - middleFinger[0], 2) + 
            Math.pow(palm[1] - middleFinger[1], 2)
        );

        return distance > 40; // Seuil de détection
    }

    canZoom() {
        return Date.now() - lastZoomTime > ZOOM_COOLDOWN;
    }

    animate() {
        // Dessiner la vidéo
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        // Dessiner les points de la main si détectés
        if (predictions.length > 0) {
            this.drawHand(predictions[0]);
        }

        requestAnimationFrame(() => this.animate());
    }

    drawHand(hand) {
        // Dessiner les points de la main
        for (let keypoint of hand.landmarks) {
            const [x, y] = keypoint;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
            this.ctx.fillStyle = 'red';
            this.ctx.fill();
        }
    }
}

// Initialisation quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    const detector = new HandDetector();
    detector.init();
});