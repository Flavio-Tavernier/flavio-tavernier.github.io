class CameraManager {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('output_canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    async start() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            this.video.srcObject = stream;
            this.video.onloadedmetadata = () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.video.play();
                this.animate();
            };

        } catch (error) {
            console.log('Erreur camera:', error);
        }
    }

    animate() {
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        requestAnimationFrame(() => this.animate());
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    const camera = new CameraManager();
    camera.start();
});