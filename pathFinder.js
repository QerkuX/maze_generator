var path;
var finalPath;

async function findPath() {
    // If no maze has been generated or start position is undefined, exit the function
    if (startPosition == undefined) return;

    var currentPosition = startPosition;
    var directions;
    path = [];

    // Loop to explore the maze and create new paths
    while (true) {
        directions = validateDirections(currentPosition);

        if (createNewPaths(currentPosition, directions)) break;
        currentPosition = chooseNextMove();

        //VISUALIZATION
        drawGrid();
        await new Promise(r => setTimeout(r, 1));
    }

    // Trace back the final path from end to start
    finalPath = [];
    var currentPath = path[path.length - 1];
    while (true) {
        finalPath.push(currentPath.position);
        currentPath = path.find(cell =>
            cell.position.x == currentPath.position.x + currentPath.parentDirection.x &&
            cell.position.y === currentPath.position.y + currentPath.parentDirection.y
        );

        if (currentPath === undefined || (startPosition.x == currentPath.position.x && startPosition.y == currentPath.position.y)) break;

        //VISUALIZATION
        drawGrid();
        await new Promise(r => setTimeout(r, 1));
    }

    drawGrid(); // Draw the final path
}

function chooseNextMove() {
    var smallestDistance = 999;
    var smallestDistanceIndex = 0;

    // Find the cell with the smallest distance to the end
    path.forEach(function (cell, index) {
        if (cell.distance < smallestDistance && cell.new) {
            smallestDistance = cell.distance;
            smallestDistanceIndex = index;
        }
    });

    // Mark the chosen cell as not new anymore
    path[smallestDistanceIndex].new = false;
    return path[smallestDistanceIndex].position;
}

function validateDirections(currentPosition) {
    let possibleDirections = {
        top: { x: 0, y: -1, name: "top" },
        bottom: { x: 0, y: 1, name: "bottom" },
        left: { x: -1, y: 0, name: "left" },
        right: { x: 1, y: 0, name: "right" }
    };

    // Create an array of the directions keys to loop through
    let directionsKeys = Object.keys(possibleDirections);

    // Loop through the directions and remove the invalid ones
    directionsKeys.forEach(directionKey => {
        let direction = possibleDirections[directionKey];

        // Check if there is a wall in the current direction
        if (!maze[currentPosition.y][currentPosition.x][direction.name]) {
            delete possibleDirections[directionKey];
            return;
        }

        // Check if the next position is already part of the path
        if (path.some(cell => cell.position.x == currentPosition.x + direction.x && cell.position.y == currentPosition.y + direction.y)) {
            delete possibleDirections[directionKey];
            return;
        }
    });

    return possibleDirections;
}

function createNewPaths(currentPosition, directions) {
    let directionsKeys = Object.keys(directions);
    var direction;
    var distance;
    var position;
    var parentDirection;
    var directionKey;

    // Calculate the distance from each possible direction to the end position
    for (let i = 0; i < directionsKeys.length; i++) {
        directionKey = directionsKeys[i];
        direction = directions[directionKey];
        position = { x: currentPosition.x + direction.x, y: currentPosition.y + direction.y };
        distance = getDistance(position, endPosition);
        parentDirection = oppositeDirectionMappings[direction.name];
    
        path.push({ distance: distance, position: position, parentDirection: parentDirection, new: true });
    
        // If we reached the end position, stop searching
        if (distance == 0) return true;
    }
    

    return false;
}
