# Interactive Globe Explorer

A 3D interactive globe visualization that allows users to manually rotate and select countries.

## Overview

This project provides a 3D globe visualization built with D3.js and TopoJSON. Users can manually rotate the globe, select countries, and view basic country information.

## Features

- Interactive 3D globe with manual rotation controls
- Country selection on click
- Country highlighting on hover
- Basic country information display
- Responsive design for various screen sizes

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

## Running the Project

1. Start the server:
   ```
   node server.js
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Technical Details

The project is built using:
- Node.js for the server
- Express.js for serving static files
- D3.js for globe visualization
- TopoJSON for geographic data
- JavaScript for interactivity
- CSS for styling

## Configuration

The `config` object in `script.js` can be modified to adjust:
- Color schemes
- Scale factors
- Animation speeds
- Sound settings

## Known Issues

- Some countries may be missing from the dataset
- Performance may vary on less powerful devices

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/feature-name`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature/feature-name`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Data Sources

- World map data from [TopoJSON](https://github.com/topojson/topojson)
- Country data from various geographic databases 
