// packages/backend-engine/src/services/routingService.ts

export type Graph = Record<string, string[]>;

/**
 * A mock 2D representation of a hotel floor for the hackathon.
 * In a production scenario, this would be loaded dynamically from a mapping database 
 * or GeoJSON representing the hotel's indoor graph.
 */
export const mockHotelFloor: Graph = {
    'Room_410': ['Hallway_West'],
    'Room_411': ['Hallway_West'],
    'Room_412': ['Hallway_West'],
    'Room_414': ['Hallway_East'],
    'Room_415': ['Hallway_East'],
    'Hallway_West': ['Room_410', 'Room_411', 'Room_412', 'Stairwell_A', 'Lobby_Center'],
    'Hallway_East': ['Room_414', 'Room_415', 'Stairwell_B', 'Lobby_Center'],
    // Note: We deliberately exclude 'Main_Elevators' from Lobby_Center as they are disabled during fire alarms.
    'Lobby_Center': ['Hallway_West', 'Hallway_East'], 
    'Stairwell_A': ['Hallway_West', 'Safe_Zone_Outside'],
    'Stairwell_B': ['Hallway_East', 'Safe_Zone_Outside'],
    'Safe_Zone_Outside': [] // The ultimate safe destination
};

// Nodes designated as valid emergency exits.
const EXIT_NODES = new Set(['Safe_Zone_Outside']);

/**
 * Calculates the shortest safe route using a Breadth-First Search (BFS) algorithm.
 * Dynamically prunes the graph by treating the `hazardNode` as impassable.
 * 
 * @param startNode Where the guest is located (e.g., 'Room_412')
 * @param hazardNode The node currently marked as dangerous (e.g., 'Hallway_West')
 * @returns An array of node IDs representing the safe path, or an empty array if trapped.
 */
export const calculateEvacuationRoute = (
    startNode: string,
    hazardNode: string | null
): string[] => {
    // If the guest is already at an exit or the start node doesn't exist, return early
    if (EXIT_NODES.has(startNode)) return [startNode];
    if (!mockHotelFloor[startNode]) return [];

    // Queue for BFS traversal. Stores tuples of [CurrentNode, PathTakenToGetHere]
    const queue: [string, string[]][] = [[startNode, [startNode]]];
    
    // Track visited nodes to prevent infinite loops (cycles)
    const visited = new Set<string>();
    visited.add(startNode);
    
    // The trick to avoiding the danger: mark the hazard node as "visited" immediately 
    // so the algorithm never attempts to traverse it.
    if (hazardNode) {
        visited.add(hazardNode);
    }

    while (queue.length > 0) {
        const [currentNode, currentPath] = queue.shift()!;

        // Check if we've reached a designated exit
        if (EXIT_NODES.has(currentNode)) {
            return currentPath;
        }

        const neighbors = mockHotelFloor[currentNode] || [];

        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                // Push the neighbor into the queue along with the accumulated path
                queue.push([neighbor, [...currentPath, neighbor]]);
            }
        }
    }

    // Trapped scenario (e.g., hazard blocks the only way out)
    // In our system, this should trigger the "Stay in place & seal door" AI protocol.
    return [];
};
