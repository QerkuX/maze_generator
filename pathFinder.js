path = [];

function findPath(){
    // If no maze was generated, exit
    if (start == undefined) return;
    var currentPosition = start;
    var directions;
    var i = 0;
    while (i < 1000){
        i++;
        directions = validateDirections(currentPosition);

        if (createNewPaths(currentPosition, directions)) break;
        currentPosition = chooseNextMove();
        
    }
    console.log(path);
    drawGrid();
}

function chooseNextMove(){
    var smallestDistance = 999999;
    var smallestDistanceIndex = 0;
    path.forEach(function(cell, index){
        if (cell.distance < smallestDistance && cell.new){
            smallestDistance = cell.distance;
            smallestDistanceIndex = index;
        }
    });

    path[smallestDistanceIndex].new = false;
    return path[smallestDistanceIndex].position;
}

function validateDirections(currentPosition){
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
        
        // Check if there is a wall
        if (!maze[currentPosition.y][currentPosition.x][direction.name]){
            delete possibleDirections[directionKey];
            return;
        }

        // Check if next position is already part of the path
        if (path.some(cell => cell.position.x == currentPosition.x + direction.x && cell.position.y == currentPosition.y + direction.y)) {
            delete possibleDirections[directionKey];
            return;
        }
    });

    return possibleDirections;
}

function createNewPaths(currentPosition, directions){
    let directionsKeys = Object.keys(directions);
    var direction;
    var distance;
    var position;
    var parentDirection;
    var found = false;

    // Calculates the distance from every direction to the end

    directionsKeys.forEach(directionKey => {
        direction = directions[directionKey];
        distance = getDistance({x: currentPosition.x + direction.x, y: currentPosition.y + direction.y}, end);
        parentDirection = oppositeDirections[direction.name].name;
        position = {x: currentPosition.x + direction.x, y: currentPosition.y + direction.y};
        path.push({distance: distance, position: position, parentDirection: parentDirection, new: true});

        if (!found) found = distance == 0;
    });

    return found;
}