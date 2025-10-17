# Motion Map App

## Overview
The Motion Map App is a web application that utilizes Leaflet for interactive mapping and ml5.js for motion recognition through the webcam. Users can control the map using their movements, creating an engaging and dynamic experience.

## Project Structure
```
motion-map-app
├── src
│   ├── index.html          # Main HTML document
│   ├── css
│   │   └── style.css       # Styles for the web application
│   ├── js
│   │   ├── main.js         # Entry point for JavaScript code
│   │   ├── map.js          # Leaflet map functionality
│   │   └── motion.js       # Motion recognition functionality
│   └── lib
│       ├── leaflet         # Leaflet library files
│       └── ml5            # ml5.js library files
├── package.json            # npm configuration file
├── .gitignore              # Git ignore file
└── README.md               # Project documentation
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd motion-map-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
1. Open `src/index.html` in a web browser.
2. Allow webcam access when prompted.
3. Use your movements to interact with the map.

## Dependencies
- Leaflet: A JavaScript library for interactive maps.
- ml5.js: A friendly high-level interface to TensorFlow.js for machine learning in the browser.

## License
This project is licensed under the MIT License.