let video;
let poseNet;
let poses = [];

async function setupMotionDetection() {
    try {
        // Vérifier si la webcam est disponible
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length === 0) {
            throw new Error('Aucune webcam détectée');
        }

        video = document.getElementById('video');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: false
        });
        video.srcObject = stream;
        video.play();

        // Initialiser PoseNet
        poseNet = ml5.poseNet(video, modelReady);
        poseNet.on('pose', function(results) {
            poses = results;
            if (poses.length > 0) {
                handlePose(poses[0]);
            }
        });
    } catch (error) {
        console.error('Erreur d\'accès à la webcam: ', error);
        alert('Erreur d\'accès à la webcam. Veuillez vérifier que votre webcam est connectée et que vous avez donné les permissions nécessaires.');
    }
}

function modelReady() {
    console.log('PoseNet est prêt');
}

function handlePose(pose) {
    // Logique de contrôle de la carte basée sur la pose
    // À implémenter selon vos besoins
}

// Démarrer la détection de mouvement au chargement
document.addEventListener('DOMContentLoaded', setupMotionDetection);