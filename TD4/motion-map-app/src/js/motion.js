document.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('output_canvas');
    const ctx = canvas.getContext('2d');

    // Démarrer la caméra
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
    });
    
    video.srcObject = stream;
    
    // Configurer le canvas quand la vidéo est prête
    video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.play();
        animate();
    };

    // Boucle d'animation
    function animate() {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(animate);
    }
});