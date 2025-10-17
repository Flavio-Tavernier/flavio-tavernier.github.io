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
                throw new Error('Required elements not found');
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

            await this.video.play();

            // Start camera rendering loop
            this.animate();

            // Initialize PoseNet separately
            this.initializePoseNet();

        } catch (error) {
            console.error('Camera setup error:', error);
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

    initializePoseNet() {
        try {
            this.poseNet = ml5.poseNet(this.video, () => {
                console.log('PoseNet Model Loaded');
            });

            this.poseNet.on('pose', (results) => {
                this.poses = results;
            });
        } catch (error) {
            console.error('PoseNet initialization error:', error);
        }
    }

    animate() {
        if (this.ctx && this.video) {
            this.ctx.drawImage(
                this.video, 
                0, 0, 
                this.canvas.width, 
                this.canvas.height
            );
        }

        if (this.poses.length > 0) {
            this.drawPoses();
        }

        requestAnimationFrame(() => this.animate());
    }

    drawPoses() {
        this.poses.forEach(pose => {
            if (pose.pose.score > 0.2) {
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
}

// Initialize camera manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const cameraManager = new CameraManager();
    cameraManager.initialize();
});