class CameraManager {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.poseNet = null;
        this.poses = [];
    }

    async initialize() {
        try {
            // Initialize DOM elements
            this.video = document.getElementById('video');
            this.canvas = document.getElementById('output_canvas');
            
            if (!this.video || !this.canvas) {
                throw new Error('Required video or canvas elements not found');
            }

            this.ctx = this.canvas.getContext('2d');
            
            // Set up camera stream
            const stream = await this.setupCamera();
            this.video.srcObject = stream;

            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.canvas.width = this.video.videoWidth;
                    this.canvas.height = this.video.videoHeight;
                    resolve();
                };
            });

            // Start video playback
            await this.video.play();

            // Initialize ML5 PoseNet
            this.poseNet = ml5.poseNet(this.video, () => {
                console.log('PoseNet Model Loaded');
            });

            // Set up pose detection callback
            this.poseNet.on('pose', (results) => {
                this.poses = results;
            });

            // Start animation loop
            this.animate();

        } catch (error) {
            this.handleError(error);
        }
    }

    async setupCamera() {
        const constraints = {
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        try {
            return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
            throw error;
        }
    }

    animate() {
        this.drawVideoFrame();
        this.drawPoses();
        requestAnimationFrame(() => this.animate());
    }

    drawVideoFrame() {
        if (this.ctx && this.video) {
            this.ctx.drawImage(
                this.video, 
                0, 0, 
                this.canvas.width, 
                this.canvas.height
            );
        }
    }

    drawPoses() {
        if (!this.ctx || this.poses.length === 0) return;

        // Draw detected poses
        this.poses.forEach(pose => {
            if (pose.pose.score > 0.2) {
                // Draw keypoints
                pose.pose.keypoints.forEach(keypoint => {
                    if (keypoint.score > 0.2) {
                        this.ctx.beginPath();
                        this.ctx.arc(
                            keypoint.position.x, 
                            keypoint.position.y, 
                            5, 0, 2 * Math.PI
                        );
                        this.ctx.fillStyle = 'red';
                        this.ctx.fill();
                    }
                });
            }
        });
    }

    handleError(error) {
        console.error('Camera Error:', error);
        
        let message = 'Une erreur est survenue lors de l\'accès à la caméra.';
        
        switch (error.name) {
            case 'NotAllowedError':
                message = 'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.';
                break;
            case 'NotFoundError':
                message = 'Aucune caméra n\'a été trouvée sur votre appareil.';
                break;
            case 'NotReadableError':
                message = 'La caméra est peut-être utilisée par une autre application.';
                break;
            case 'OverconstrainedError':
                message = 'Les paramètres demandés pour la caméra ne sont pas supportés.';
                break;
        }

        // Add error message to DOM
        const cameraArea = document.querySelector('.camera-area');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'camera-error';
        errorDiv.textContent = message;
        cameraArea.appendChild(errorDiv);
    }
}

// Initialize camera manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const cameraManager = new CameraManager();
    cameraManager.initialize();
});