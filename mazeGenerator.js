var canvas, ctx;
var grid, gridSize;
var mazeGrid, availableSpaces;
var startPosition, endPosition;
var currentPathId;
var oppositeDirectionMappings;
var maze;

async function generateMaze() {
    canvas = document.getElementById('myCanvas');
    ctx = canvas.getContext('2d');

    // Set canvas size (same as defined in CSS)
    canvas.width = 800;
    canvas.height = 600;
    grid = { horizontal: 32, vertical: 24 }; // MAZE SIZE (use 4:3 ratio and even numbers for correct scaling)
    gridSize = Math.min(Math.floor(canvas.width / grid.horizontal), Math.floor(canvas.height / grid.vertical));
    currentPathId = 0;
    mazeGrid = [];
    availableSpaces = [];

    // Reset the pathfinding algorithm variables
    path = [];
    finalPath = [];

    // Initialize maze grid with default values
    for (let y = 0; y < grid.vertical; y++) {
        mazeGrid.push([]);
        for (let x = 0; x < grid.horizontal; x++) {
            mazeGrid[y].push({
                pathId: null,
                parentDirection: null,
                entrances: { top: false, bottom: false, left: false, right: false },
                possibleDirections: { top: true, bottom: true, left: true, right: true }
            });
            availableSpaces.push({ x: x, y: y });
        }
    }

    // Ensure that start and end positions are not too close to each other
    while (true) {
        startPosition = getRandomPosition();
        endPosition = getRandomPosition();
        if (getDistance(startPosition, endPosition) < 10) continue;
        break;
    }

    mazeGrid[endPosition.y][endPosition.x].pathId = 0;

    oppositeDirectionMappings = {
        top: { x: 0, y: 1, name: "bottom" },
        bottom: { x: 0, y: -1, name: "top" },
        left: { x: 1, y: 0, name: "right" },
        right: { x: -1, y: 0, name: "left" }
    };

    await createRandomPath(startPosition, true);

    // Continue creating paths until no available empty cells
    while (true) {
        let position = getRandomEmptyCell();
        if (position == null) break;
        await createRandomPath(position, false);
    }

    drawGrid();

    // Removes all properties other than entrances from the maze
    maze = mazeGrid.map(row => row.map(cell => cell.entrances));

    return;
}

function getRandomEmptyCell() {
    // Uses a different array to store only empty cells, which makes the search faster
    const nullCells = [];
    let i = 0;

    while (true) {
        if (i == availableSpaces.length) break;
        if (mazeGrid[availableSpaces[i].y][availableSpaces[i].x].pathId != null) {
            availableSpaces.splice(i, 1);
            continue;
        }

        nullCells.push(availableSpaces[i]);
        i++;
    }

    // Return a random empty cell, or null if no empty cells are found
    if (nullCells.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * nullCells.length);
    return nullCells[randomIndex];
}

function drawGrid() {
    ctx.strokeStyle = "white"; 
    ctx.lineWidth = 2;

    // Loop through each cell in the maze and draw it
    for (let j = 0; j < grid.vertical; j++) {
        for (let i = 0; i < grid.horizontal; i++) {
            let x = i * gridSize;
            let y = j * gridSize;

            ctx.fillStyle = "black"; 
            if (path.some(cell => cell.position.x === i && cell.position.y === j)) ctx.fillStyle = "#7B9EC6";
            if (finalPath.some(cell => cell.x === i && cell.y === j)) ctx.fillStyle = "#8E44AD";
            if (arePositionsOverlapping(startPosition, { x: i, y: j })) ctx.fillStyle = "#27AE60";
            if (arePositionsOverlapping(endPosition, { x: i, y: j })) ctx.fillStyle = "#C0392B";

            ctx.fillRect(x, y, gridSize, gridSize);

            let borders = mazeGrid[j][i].entrances;

            // Draw borders for the current cell based on its entrances
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

function getRandomPosition() {
    let x = Math.floor(Math.random() * grid.horizontal);
    let y = Math.floor(Math.random() * grid.vertical);
    return { x: x, y: y };
}

function arePositionsOverlapping(first, second) {
    return first.x == second.x && first.y == second.y;
}

function getDistance(first, second) {
    return Math.sqrt(Math.pow(second.x - first.x, 2) + Math.pow(second.y - first.y, 2));
}

async function createRandomPath(startPosition, isInitialPath) {
    let direction = {};
    let possibleDirections = {};
    let currentPosition = { x: startPosition.x, y: startPosition.y };
    currentPathId += 1;

    while (true) {
        mazeGrid[currentPosition.y][currentPosition.x].pathId = currentPathId;
        possibleDirections = removeImpossibleDirections(currentPosition);

        // Mark impossible directions
        if (possibleDirections.top == undefined) mazeGrid[currentPosition.y][currentPosition.x].possibleDirections.top = false;
        if (possibleDirections.bottom == undefined) mazeGrid[currentPosition.y][currentPosition.x].possibleDirections.bottom = false;
        if (possibleDirections.left == undefined) mazeGrid[currentPosition.y][currentPosition.x].possibleDirections.left = false;
        if (possibleDirections.right == undefined) mazeGrid[currentPosition.y][currentPosition.x].possibleDirections.right = false;

        // If no directions are possible, backtrack
        if (Object.values(mazeGrid[currentPosition.y][currentPosition.x].possibleDirections).every(value => value === false)) {
            let parentDirection = mazeGrid[currentPosition.y][currentPosition.x].parentDirection;
            currentPosition = { x: currentPosition.x + parentDirection.x, y: currentPosition.y + parentDirection.y };
            mazeGrid[currentPosition.y][currentPosition.x].possibleDirections[oppositeDirectionMappings[parentDirection.name].name] = false;
            continue;
        }

        direction = getRandomElement(possibleDirections);
        let nextPosition = { x: currentPosition.x + direction.x, y: currentPosition.y + direction.y };

        // Create paths between current and next position
        mazeGrid[currentPosition.y][currentPosition.x].entrances[direction.name] = true;
        mazeGrid[nextPosition.y][nextPosition.x].entrances[oppositeDirectionMappings[direction.name].name] = true;

        // Set parent direction for the next cell
        mazeGrid[nextPosition.y][nextPosition.x].parentDirection = oppositeDirectionMappings[direction.name];

        // Remove the opposite direction from possible directions
        mazeGrid[nextPosition.y][nextPosition.x].possibleDirections[oppositeDirectionMappings[direction.name].name] = false;

        // Stop if we reach a goal (end point or another path)
        if (mazeGrid[nextPosition.y][nextPosition.x].pathId != null) {
            break;
        }

        currentPosition = nextPosition;

        //VISUALIZATION
        drawGrid();
        await new Promise(r => setTimeout(r, 1));
    }
}

function removeImpossibleDirections(currentPosition) {
    let possibleDirections = {
        top: { x: 0, y: -1, name: "top" },
        bottom: { x: 0, y: 1, name: "bottom" },
        left: { x: -1, y: 0, name: "left" },
        right: { x: 1, y: 0, name: "right" }
    };

    // Loop through directions and remove invalid ones
    let directionsKeys = Object.keys(possibleDirections);

    directionsKeys.forEach(directionKey => {
        let direction = possibleDirections[directionKey];

        // Check for out of bounds
        if (currentPosition.x + direction.x < 0 || currentPosition.x + direction.x >= grid.horizontal ||
            currentPosition.y + direction.y < 0 || currentPosition.y + direction.y >= grid.vertical) {
            delete possibleDirections[directionKey]; // Remove out of bounds direction
            return;
        }

        // Check if the next position is part of the current path
        if (mazeGrid[currentPosition.y + direction.y][currentPosition.x + direction.x].pathId == currentPathId) {
            delete possibleDirections[directionKey]; // Remove already visited direction
            return;
        }
    });

    return possibleDirections;
}

function getRandomElement(elements) {
    const keys = Object.keys(elements);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return elements[randomKey];
}

function resetWebsite() {
    window.location.reload(); // Reload the page to reset the maze
}

// On page load, generate the maze
document.addEventListener("DOMContentLoaded", generateMaze)
