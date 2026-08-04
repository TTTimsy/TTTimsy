const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARTWORKS = [
  { id: 'calling-of-saint-matthew', title: 'The Calling of Saint Matthew', sourcePath: path.join(ROOT, 'picture.png'), focalY: 0.36 },
  { id: 'denial-of-saint-peter', title: 'The Denial of Saint Peter', sourcePath: path.join(ROOT, 'assets', 'baroque', 'caravaggio-denial-of-saint-peter.jpg'), focalY: 0.42 },
  { id: 'jewish-bride', title: 'The Jewish Bride', sourcePath: path.join(ROOT, 'assets', 'baroque', 'rembrandt-jewish-bride.jpg'), focalY: 0.31 },
  { id: 'syndics', title: 'The Syndics', sourcePath: path.join(ROOT, 'assets', 'baroque', 'rembrandt-syndics.jpg'), focalY: 0.37 },
];

module.exports = { ARTWORKS };
