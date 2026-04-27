// packages/backend-engine/src/services/routingService.ts

export type Graph = Record<string, string[]>;

/**
 * A mock 2D representation of a hotel floor for the hackathon.
 * In a production scenario, this would be loaded dynamically from a mapping database 
 * or GeoJSON representing the hotel's indoor graph.
 */
export const mockHotelFloor: Graph = {
    // FLOOR 1
    'Room_111': ['Hallway_1_West'],
    'Room_112': ['Hallway_1_West'],
    'Room_113': ['Hallway_1_East'],
    'Hallway_1_West': ['Room_111', 'Room_112', 'Stairwell_A', 'Lobby_Center', 'Hallway_1_East'],
    'Hallway_1_East': ['Room_113', 'Stairwell_B', 'Lobby_Center', 'Hallway_1_West'],
    
    // FLOOR 2
    'Room_211': ['Hallway_2_West'],
    'Room_212': ['Hallway_2_West'],
    'Room_213': ['Hallway_2_East'],
    'Hallway_2_West': ['Room_211', 'Room_212', 'Stairwell_A', 'Hallway_2_East'],
    'Hallway_2_East': ['Room_213', 'Stairwell_B', 'Hallway_2_West'],

    // FLOOR 3
    'Room_311': ['Hallway_3_West'],
    'Room_312': ['Hallway_3_West'],
    'Room_333': ['Hallway_3_East'],
    'Hallway_3_West': ['Room_311', 'Room_312', 'Stairwell_A', 'Hallway_3_East'],
    'Hallway_3_East': ['Room_333', 'Stairwell_B', 'Hallway_3_West'],

    // EXITS & LOBBY
    'Lobby_Center': ['Hallway_1_West', 'Hallway_1_East', 'Safe_Zone_Outside'], 
    'Stairwell_A': ['Hallway_3_West', 'Hallway_2_West', 'Hallway_1_West', 'Safe_Zone_Outside'],
    'Stairwell_B': ['Hallway_3_East', 'Hallway_2_East', 'Hallway_1_East', 'Safe_Zone_Outside'],
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
