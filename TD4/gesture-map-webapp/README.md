# Gesture Map Web Application

## Overview
This project is a web application that displays an interactive map on one half of the screen while utilizing the camera to recognize gestures made by the user on the other half. The application is built using HTML, CSS, and JavaScript, and leverages the MediaPipe library for gesture recognition.

## Project Structure
```
gesture-map-webapp
├── src
│   ├── index.html          # Main HTML document
│   ├── css
│   │   └── styles.css      # Styles for the web application
│   ├── js
│   │   ├── main.js         # Entry point for JavaScript functionality
│   │   ├── map.js          # Logic for the interactive map
│   │   └── gesture.js      # Gesture recognition logic
│   └── libs
│       └── mediapipe      # MediaPipe library files for gesture recognition
├── .gitignore              # Files and directories to ignore in version control
└── README.md               # Documentation for the project
```

## Setup Instructions
1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Open `src/index.html` in a web browser to view the application.

## Usage
- The left half of the screen displays an interactive map. You can interact with it by clicking or tapping.
- The right half of the screen uses your camera to detect gestures. Make sure to allow camera access when prompted.

## Dependencies
- MediaPipe library for gesture recognition. Ensure that the necessary files are included in the `src/libs/mediapipe` directory.

## Contributing
Feel free to submit issues or pull requests if you have suggestions for improvements or new features.

## License
This project is open-source and available under the MIT License.