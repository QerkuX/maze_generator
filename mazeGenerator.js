var canvas, ctx;
var grid, gridSize;
var mazeMatrix, freeSpaces;
var start, end;
var pathId;
var oppositeDirections;
var colors;
var maze;

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    drawGrid(); // Draw the grid
    requestAnimationFrame(update); // Loop the update function at ~60fps
}

async function generateMaze(){
    canvas = document.getElementById('myCanvas');
    ctx = canvas.getContext('2d');

    // The same size as in CSS
    canvas.width = 800;
    canvas.height = 600;
    grid = {horizontal: 40, vertical: 30}; //MAZE SIZE ----------------------------------------------------------------- 
    gridSize = Math.min(Math.floor(canvas.width / grid.horizontal), Math.floor(canvas.height / grid.vertical));
    pathId = 0;
    colors = ["#000000", "#5555ff"];
    mazeMatrix = [];
    freeSpaces = [];
    for (let y = 0; y < grid.vertical; y++){
        mazeMatrix.push([]);
        for (let x = 0; x < grid.horizontal; x++){
            mazeMatrix[y].push({pathId: null,parentDirection: null,entrances: {top: false, bottom: false, left: false, right: false},possibleDirections: {top: true, bottom: true, left: true, right: true}});
            freeSpaces.push({x: x, y: y});
        }
    }
    // Ensures start and end aren't too close
    while (true){
        start = getRandomPosition();
        end = getRandomPosition();
        if (getDistance(start, end) < 10) continue;
        break;
    }

    mazeMatrix[end.y][end.x].pathId = 0;

    oppositeDirections = {
        top: { x: 0, y: 1, name: "bottom"},
        bottom: { x: 0, y: -1, name: "top"},
        left: { x: 1, y: 0, name: "right"},
        right: { x: -1, y: 0, name: "left"}
    };
    await createRandomPath(start, true);
    while (true){
        position = getRandomEmptyCell();
        if (position == null) break;
        await createRandomPath(position, false);
    }
    drawGrid();

    //Removes properties other than entrances
    maze = mazeMatrix.map(row => row.map(cell => cell.entrances));

    //Makes the "find the path" button pressable
    if (document.getElementById("disabled")) document.getElementById("disabled").removeAttribute("id");
    return;
}

function getRandomEmptyCell() {
    // Flatten the mazeMatrix into an array of cells with their row and column indices
    const nullCells = [];
    
    i = 0;
    while (true){
        if (i == freeSpaces.length) break;
        if (mazeMatrix[freeSpaces[i].y][freeSpaces[i].x].pathId != null){
            freeSpaces.splice(i, 1)
            continue
        }

        nullCells.push(freeSpaces[i]);
        i++;
    }

    // If there are no cells with pathId = null, return null
    if (nullCells.length === 0) return null;
    
    // Select a random cell
    const randomIndex = Math.floor(Math.random() * nullCells.length);
    return nullCells[randomIndex];
  }

function drawGrid() {
    ctx.strokeStyle = "white"; 
    ctx.lineWidth = 2; 

    for (let j = 0; j < grid.vertical; j++) {
        for (let i = 0; i < grid.horizontal; i++) {
            let x = i * gridSize;
            let y = j * gridSize;

            ctx.fillStyle = "gray"; 
            if (mazeMatrix[j][i].pathId != null) ctx.fillStyle = "black";//colors[mazeMatrix[j][i].pathId];
            if (arePositionsOverlapping(start, {x: i, y: j})) ctx.fillStyle = "green";
            if (arePositionsOverlapping(end, {x: i, y: j})) ctx.fillStyle = "red";

            ctx.fillRect(x, y, gridSize, gridSize);

            let borders = mazeMatrix[j][i].entrances;

            // Draw borders based on the conditions
            ctx.beginPath();
            if (!borders.top) {
                ctx.moveTo(x, y);
                ctx.lineTo(x + gridSize, y);
            }
            if (!borders.right) {
                ctx.moveTo(x + gridSize, y);
                ctx.lineTo(x + gridSize, y + gridSize);
            }
            if (!borders.bottom) {
                ctx.moveTo(x, y + gridSize);
                ctx.lineTo(x + gridSize, y + gridSize);
            }
            if (!borders.left) {
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + gridSize);
            }
            ctx.stroke();
        }
    }
}


function getRandomPosition(){
    let x = Math.floor(Math.random() * grid.horizontal);
    let y = Math.floor(Math.random() * grid.vertical);
    return {x: x, y: y};
}

function arePositionsOverlapping(first, second){
    return first.x == second.x && first.y == second.y;
}

function getDistance(first, second){
    return Math.sqrt(Math.pow(second.x - first.x, 2) + Math.pow(second.y - first.y, 2));
}

async function createRandomPath(start){
    var direction = {};
    var possibleDirections = {}
    var currentPosition = {x: start.x, y: start.y};
    pathId += 1;

    //Generates a random color in hex corresponding to a given id
    colors.push("#" + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'))

    while (true){
        mazeMatrix[currentPosition.y][currentPosition.x].pathId = pathId;
        possibleDirections = removeImpossibleDirections(currentPosition);
        // Removes impossible directions
        if (possibleDirections.top == undefined) mazeMatrix[currentPosition.y][currentPosition.x].possibleDirections.top = false;
        if (possibleDirections.bottom == undefined) mazeMatrix[currentPosition.y][currentPosition.x].possibleDirections.bottom = false;
        if (possibleDirections.left == undefined) mazeMatrix[currentPosition.y][currentPosition.x].possibleDirections.left = false;
        if (possibleDirections.right == undefined) mazeMatrix[currentPosition.y][currentPosition.x].possibleDirections.right = false;

        // If no direction is possible, go back
        if (Object.values(mazeMatrix[currentPosition.y][currentPosition.x].possibleDirections).every(value => value === false)){
            parentDirection = mazeMatrix[currentPosition.y][currentPosition.x].parentDirection;
            currentPosition = {x: currentPosition.x + parentDirection.x, y: currentPosition.y + parentDirection.y};
            mazeMatrix[currentPosition.y][currentPosition.x].possibleDirections[oppositeDirections[parentDirection.name].name] = false;

            continue;
        }
        
        direction = getRandomElement(possibleDirections)
        nextPosition = {x: currentPosition.x + direction.x, y: currentPosition.y + direction.y};
        // Opens a path in the current and the next position
        mazeMatrix[currentPosition.y][currentPosition.x].entrances[direction.name] = true;
        mazeMatrix[nextPosition.y][nextPosition.x].entrances[oppositeDirections[direction.name].name] = true;

        // Sets the parent direction
        mazeMatrix[nextPosition.y][nextPosition.x].parentDirection = oppositeDirections[direction.name];

        // Removes the parent from possible directions
        mazeMatrix[nextPosition.y][nextPosition.x].possibleDirections[oppositeDirections[direction.name].name] = false;

        // Stops when reaching a goal (either reaching the end or any other pathj)
        if (mazeMatrix[nextPosition.y][nextPosition.x].pathId != null){
            break;
        }

        currentPosition = nextPosition;

        //Comment these 2 lines to remove visualization
        //drawGrid();
        //await new Promise(r => setTimeout(r, 1));
    }
}

function removeImpossibleDirections(currentPosition){
    let possibleDirections = {
        top: { x: 0, y: -1, name: "top"},
        bottom: { x: 0, y: 1, name: "bottom"},
        left: { x: -1, y: 0, name: "left"},
        right: { x: 1, y: 0, name: "right"}
    };
    
    // Create an array of the directions' keys to loop through
    let directionsKeys = Object.keys(possibleDirections);
    
    // Loop through the directions and remove the invalid ones
    directionsKeys.forEach(directionKey => {
        let direction = possibleDirections[directionKey];
    
        // Check if next position is out of bounds
        if (currentPosition.x + direction.x < 0 || currentPosition.x + direction.x >= grid.horizontal ||
            currentPosition.y + direction.y < 0 || currentPosition.y + direction.y >= grid.vertical) {
            delete possibleDirections[directionKey];  // Remove the direction if out of bounds
            return;
        }
    
        // Check if next position is already part of the path
        if (mazeMatrix[currentPosition.y + direction.y][currentPosition.x + direction.x].pathId == pathId) {
            delete possibleDirections[directionKey];  // Remove the direction if itss already part of the path
            return;
        }
    });

    return possibleDirections
}

function getRandomElement(elements) {

    const keys = Object.keys(elements);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return elements[randomKey];
}

//Onload function for js placed in <body>
// document.addEventListener("DOMContentLoaded", function() {
//     generate_maze();
// });
