// Add any resources you want to load here
// You will then be able to reference them in initialise_scene
// e.g. as "resources.vert_shader"
RESOURCES = [
  // format is:
  // ["name", "path-to-resource"]
  ["vert_shader", "shaders/default.vert"],
  ["frag_shader", "shaders/default.frag"],
  ["vertl_shader", "shaders/light.vert"],
  ["fragl_shader", "shaders/light.frag"]
];

/* 
    
    Procedural Three.js city generator with custom shader
    made for first 2019-2020 Computer Graphics Practical

*/

/* 
Main function 
Receives loaded shaders from server
Creates the procedurally generated city and handles the rendering
*/
const main = function (resources) {


  // Constants
  const near = 0.1;
  const far = 10000;
  const repeatCount = 20;
  const cellSize = 200;
  const height = 1000;
  const streetWidth = 20;
  const groundColor = new THREE.Vector3(0, 0.5, 0);
  const streetColor = new THREE.Vector3(0, 0, 0);
  const lightColor = new THREE.Vector3(0.5, 0.2, 1);
  const carColor = new THREE.Vector3(1, 0.3, 0);
  const carSpeed = 3;
  const carRadius = 8;
  const cameraDist = 2200;
  const cameraHeight = 1800;

  // Three.js init

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, near, far);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Light direction angle, will be passed as uniform to shaders
  const light_dir = {
    value: Math.PI
  };

  // Will contain an array with all the lights (cars)
  let lights = null;

  init();

  function init() {

    // generate city
    addSkyBox();
    const map = generateMap();
    const base = createBaseGeometry(map);
    makeCity(map.cells);
    lights = createLights(500);
    addLightsToGroup(lights, base);
    scene.add(base);

    // camera controls
    camera.position.set(cameraDist, cameraHeight, cameraDist);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minDistance = near;
    controls.maxDistance = far;

    animate();
  }

  function animate(timestamp) {

    requestAnimationFrame(animate);

    light_dir.value += 0.05; // move light direction
    moveLights(lights); // moves cars

    renderer.render(scene, camera);
  }

  function addSkyBox() {
    const loader = new THREE.CubeTextureLoader();
    loader.setPath('img/');

    // for skybox
    const textureCube = loader.load([
      'sky.jpg', 'sky.jpg',
      'sky.jpg', 'sky.jpg',
      'sky.jpg', 'sky.jpg'
    ]);

    scene.background = textureCube;
    // scene.fog = new THREE.FogExp2(0xcccccc, 0.2);
  }

  // shader for everything besides the moving lights (cars)
  function getColoredShader(color) {
    return new THREE.ShaderMaterial({
      uniforms: {
        light_dir,
        color: {
          value: color
        },
        light_color: {
          value: lightColor
        },
        camera_pos: {
          value: camera.position
        }
      },
      vertexShader: resources.vert_shader,
      fragmentShader: resources.frag_shader,
    });
  }

  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
  }

  // basically a step function
  function getRandWithLimits(low, high) {
    const rand = Math.random();
    if (rand < low) return low;
    if (rand > high) return high;
    return rand;
  }

  // mimic of Python range function
  function createRange(n) {
    return [...Array(n).keys()];
  }

  // given the index of a flattened 2D array and the no. of columns, returns 2D index
  function convert1DIndexTo2D(index, repeatCount) {
    return {
      row: Math.floor(index / repeatCount),
      col: index % repeatCount
    };
  }

  // generates the base of the city with the cells which will hold the buidlings
  function generateMap() {

    const baseSize = {
      width: repeatCount * cellSize + (repeatCount - 1) * streetWidth,
      depth: repeatCount * cellSize + (repeatCount - 1) * streetWidth
    };

    const cellPositions = createRange(repeatCount * repeatCount).map(i => convert1DIndexTo2D(i, repeatCount));

    const cells = cellPositions.map(pos =>
      createCell(
        pos.col * (cellSize + streetWidth),
        0,
        -(pos.row * (cellSize + streetWidth))
      )
    );

    return {
      baseSize,
      cells
    };

  }

  function createCell(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    return group;
  }

  // generates geometries for base of the city (grid with cells and streets)
  function createBaseGeometry(map) {

    const {
      baseSize,
      cells
    } = map;

    const base = new THREE.Group();
    base.position.x -= baseSize.width / 2; // center
    base.position.z += baseSize.depth / 2;

    cells.forEach(cell => {
      const square = generateRectShape(cellSize, cellSize);
      const mesh = generateShapeMesh(square, groundColor, 0, 0, 0, -Math.PI / 2, 0, 0, 1);
      cell.add(mesh);
      base.add(cell);
    });

    // generate streets
    for (let i = 0; i < repeatCount - 1; ++i) {
      const streetShapes = [generateRectShape(streetWidth, baseSize.depth), generateRectShape(baseSize.width, streetWidth)];
      const zAxisStreet = generateShapeMesh(streetShapes[0], streetColor, (i + 1) * cellSize + i * streetWidth, 0.1, 0, -Math.PI / 2, 0, 0, 1);
      const xAxisStreet = generateShapeMesh(streetShapes[1], streetColor, 0, 0.1, -((i + 1) * cellSize + i * streetWidth), -Math.PI / 2, 0, 0, 1);
      base.add(xAxisStreet, zAxisStreet);
    }

    return base;

  }

  function generateShapeMesh(shape, color, x, y, z, rx, ry, rz, s) {
    const geometry = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geometry, getColoredShader(color));
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.scale.set(s, s, s);
    return mesh;
  }

  function generateRectShape(width, height) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(width, 0);
    shape.lineTo(width, height);
    shape.lineTo(0, height);
    shape.lineTo(0, 0);
    return shape;
  }

  function createBlock(width, depth) {
    const grayShade = 0.15 + Math.random() / 5;
    const geometry = new THREE.BoxGeometry(width, height * getRandWithLimits(0.2, 1), depth);
    const material = getColoredShader(new THREE.Vector3(grayShade, grayShade, grayShade));
    const block = new THREE.Mesh(geometry, material);
    return block;
  }

  function divideSquareIntoRegions() {
    return {
      x: getRandWithLimits(0.2, 0.8),
      y: getRandWithLimits(0.2, 0.8)
    };
  }

  // puts four randomly generated blocks in a given cell
  function fillCellWithRandomBlocks(cell) {

    const getHeight = block => block.geometry.parameters.height;
    const innerMargin = cellSize / 20;
    const margin = cellSize / 10;
    const innerSize = cellSize - 2 * margin - innerMargin;

    const {
      x,
      y
    } = divideSquareIntoRegions();

    const dimX1 = innerSize * x;
    const dimX2 = innerSize - dimX1;

    const dimY1 = innerSize * y;
    const dimY2 = innerSize - dimY1;

    const block1 = createBlock(dimX1, dimY1);
    const block2 = createBlock(dimX2, dimY1);
    const block3 = createBlock(dimX1, dimY2);
    const block4 = createBlock(dimX2, dimY2);

    block1.position.set(
      margin + dimX1 / 2,
      getHeight(block1) / 2,
      -dimY1 / 2 - margin);

    block2.position.set(
      innerMargin + margin + dimX1 + dimX2 / 2,
      getHeight(block2) / 2,
      -dimY1 / 2 - margin);

    block3.position.set(
      margin + dimX1 / 2,
      getHeight(block3) / 2,
      -dimY1 - dimY2 / 2 - margin - innerMargin);

    block4.position.set(
      innerMargin + margin + dimX1 + dimX2 / 2,
      getHeight(block4) / 2,
      -dimY1 - dimY2 / 2 - margin - innerMargin);

    cell.add(block1, block2, block3, block4);

  }

  function makeCity(cells) {
    cells.forEach(fillCellWithRandomBlocks);
  }

  /* 
    Lights section
  */

  // separate shader for moving lights (they have a texture)
  function getLigtShader(center) {
    return new THREE.ShaderMaterial({
      uniforms: {
        texture: {
          type: "t",
          value: (new THREE.TextureLoader()).load( "img/light.png" )
        },
        center: {
          value: center
        }
      },
      vertexShader: resources.vertl_shader,
      fragmentShader: resources.fragl_shader,
    });
  }

  // creates four collections of moving lights (one collection for each NESW orientation)
  function createLights(count) {

    const lights = {
      xpos: [],
      xneg: [],
      zpos: [],
      zneg: []
    };

    const collectionKeys = Object.keys(lights);

    for (let l = 0; l < count; ++l) {
      const streetNo = getRandomIntInclusive(1, repeatCount - 1);
      const direction = getRandomIntInclusive(1, 4);
      const collectionName = collectionKeys[direction-1];
      lights[collectionName].push(createLight(streetNo, direction));
    }

    return lights;

  }

  // create cars with random initial positions (on generated streets) and moving directions 
  function createLight(no, direction) {

    let x,
      y = carRadius, // they float above the ground
      z;

    const streetLength = repeatCount * cellSize + (repeatCount - 1) * streetWidth;

    // center car on lane and put into a random position on the given street
    switch (direction) {
      case 1:
        z = -(no * cellSize + (no - 1) * streetWidth + streetWidth / 4);
        x = getRandomIntInclusive(0, streetLength);
        break;
      case 2:
        z = -(no * cellSize + (no - 1) * streetWidth + streetWidth * 3 / 4);
        x = getRandomIntInclusive(0, streetLength);
        break;
      case 3:
        x = no * cellSize + (no - 1) * streetWidth + streetWidth / 4;
        z = -getRandomIntInclusive(0, streetLength);
        break;
      case 4:
        x = no * cellSize + (no - 1) * streetWidth + streetWidth * 3 / 4;
        z = -getRandomIntInclusive(0, streetLength);
        break;
      default:
        break;
    }

    const centerPos = new THREE.Vector3(x, y, z);

    const geometry = new THREE.CircleGeometry(carRadius, 32);
    const material = getLigtShader(carColor, centerPos);
    const circle = new THREE.Mesh(geometry, material);

    circle.position.set(x, y, z);
    circle.rotation.x -= Math.PI / 2;

    return circle;

  }

  function addLightsToGroup(lights, group) {
    for (let collection in lights) {
      lights[collection].forEach(light => group.add(light));
    }
  }

  function moveLights(lights) {

    const streetLength = repeatCount * cellSize + (repeatCount - 1) * streetWidth;

    lights.xpos.forEach(l => {
      const pos = l.position.x;
      l.position.x = pos + carSpeed > streetLength ? 0 : pos + carSpeed;
    });

    lights.xneg.forEach(l => {
      const pos = l.position.x;
      l.position.x = pos - carSpeed < 0 ? streetLength : pos - carSpeed;
    });

    lights.zpos.forEach(l => {
      const pos = l.position.z;
      l.position.z = pos - carSpeed < -streetLength ? 0 : pos - carSpeed;
    });

    lights.zneg.forEach(l => {
      const pos = l.position.z;
      l.position.z = pos + carSpeed > 0 ? -streetLength : pos + carSpeed;
    });

  }

};




/*  Asynchronously load resources

    You shouldn't need to change this - you can add
    more resources by changing RESOURCES above */

function load_resources() {
  const promises = [];

  for (let r of RESOURCES) {
    promises.push(fetch(r[1])
      .then(res => res.text()));
  }

  return Promise.all(promises).then(function (res) {
    let resources = {};
    for (let i in RESOURCES) {
      resources[RESOURCES[i][0]] = res[i];
    }
    return resources;
  });
}

// Load the resources and then create the scene when resources are loaded
load_resources().then(res => main(res));