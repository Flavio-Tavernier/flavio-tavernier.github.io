class HandDetector {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('output_canvas');
        this.gestureDisplay = document.getElementById('gesture-display');
        this.ctx = this.canvas.getContext('2d');
        this.handpose = null;
        this.predictions = [];
    }

    async init() {
        try {
            // Initialiser la caméra
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });

            this.video.srcObject = stream;
            await this.video.play();

            // Configurer le canvas
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            // Initialiser handpose
            this.handpose = ml5.handpose(this.video, () => {
                console.log('Handpose prêt');
                this.startDetection();
            });
        } catch (error) {
            console.error('Erreur:', error);
            this.updateGestureDisplay('Erreur caméra');
        }
    }

    startDetection() {
        this.handpose.on('predict', predictions => {
            this.predictions = predictions;
            this.updateGestureDisplay(this.getGestureName(predictions));
        });

        this.animate();
    }

    getGestureName(predictions) {
        if (!predictions || predictions.length === 0) {
            return 'Aucune main détectée 👋';
        }

        const hand = predictions[0];
        if (this.isPalmVisible(hand)) {
            return 'Paume détectée ✋';
        }

        return 'Main détectée 🤚';
    }

    isPalmVisible(hand) {
        const palm = hand.annotations.palmBase[0];
        const middle = hand.annotations.middleFinger[0];
        
        const distance = Math.sqrt(
            Math.pow(palm[0] - middle[0], 2) + 
            Math.pow(palm[1] - middle[1], 2)
        );

        return distance > 40;
    }

    updateGestureDisplay(text) {
        if (this.gestureDisplay) {
            this.gestureDisplay.textContent = text;
        }
    }

    animate() {
        // Dessiner la vidéo
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        // Dessiner les points de la main
        if (this.predictions.length > 0) {
            const hand = this.predictions[0];
            for (let keypoint of hand.landmarks) {
                const [x, y] = keypoint;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
                this.ctx.fillStyle = 'red';
                this.ctx.fill();
            }
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Démarrer la détection quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    const detector = new HandDetector();
    detector.init();
});