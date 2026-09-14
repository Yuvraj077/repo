// Verification test script for Khet2Tech Engine
const { PUNJAB_NODES, PUNJAB_EDGES, DEFAULT_CROP_LOT } = require('../src/lib/data/punjabData');
const { solveSupplyChainOptimization, DEFAULT_SIMULATION_CONDITIONS } = require('../src/lib/engine/optimizer');

console.log('Testing Khet2Tech deterministic engine:');
console.log('Nodes count:', PUNJAB_NODES.length);
console.log('Edges count:', PUNJAB_EDGES.length);
