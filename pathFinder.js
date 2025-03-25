path = [];

function findPath(){
    // If no maze was generated, exit
    if (start == undefined) return;
    var currentPosition = start;
    var directions;
    var direction;
    while (true){
        directions = validateDirections(currentPosition);
        direction = calculateClosestRoute(currentPosition, directions);

        console.log(direction);

        break;
    }
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
        if (path.some(cell => cell.x == currentPosition.x + direction.x && cell.y == currentPosition.y + direction.y)) {
            delete possibleDirections[directionKey];
            return;
        }
    });

    return possibleDirections;
}

function calculateClosestRoute(currentPosition, directions){
    let directionsKeys = Object.keys(directions);
    var distances = [];

    // Calculates the distance from every direction to the end
    directionsKeys.forEach(directionKey => {
        let direction = directions[directionKey];
        distances.push(getDistance({x: currentPosition.x + direction.x, y: currentPosition.y + direction.y}, end))
    });

    // Returns the direction closest to the end
    return directions[directionsKeys[distances.indexOf(Math.min(...distances))]];
}