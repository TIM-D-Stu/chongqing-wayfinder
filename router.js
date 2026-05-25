/* =========================================================================
   router.js  —  Mountain City Wayfinder routing engine
   -------------------------------------------------------------------------
   Computational Thinking: ALGORITHMS
   This implements Dijkstra's shortest-path algorithm, but with one key
   Chongqing-specific twist: the cost of an edge isn't only horizontal
   distance — it also includes vertical effort. Climbing stairs costs more
   per floor than taking an elevator. Walking flat costs the least.
   This is what makes the routes feel realistic in a vertical city.
   ========================================================================= */

// Cost-per-floor weights, chosen so a flat 100m walk roughly equals 1 floor of stairs.
const VERTICAL_COST = {
  walk:      80,   // walking up a hill: significant effort
  stairs:    100,  // stairs are the worst
  elevator:  15,   // elevator is almost free
  skybridge: 5,    // skybridge is essentially horizontal
  monorail:  5,    // monorail handles elevation for you
  ropeway:   10,   // ropeway is comfortable
  ferry:     8,    // ferry is comfortable
};

/** Compute the cost (in "effort units") of traversing a single edge. */
function edgeCost(edge) {
  const horizontal = edge.dist || 0;             // metres
  const vertical   = (edge.floors || 0) * (VERTICAL_COST[edge.type] || 50);
  // Monorail, ropeway, and ferry are faster per metre — divide horizontal by a factor
  const speedFactor = (edge.type === "monorail" || edge.type === "ropeway" || edge.type === "ferry") ? 0.3 : 1;
  return horizontal * speedFactor + vertical;
}

/** Build an adjacency list from the EDGES dataset.  Edges are bidirectional. */
function buildGraph(edges) {
  const adj = {};
  for (const e of edges) {
    if (!adj[e.from]) adj[e.from] = [];
    if (!adj[e.to])   adj[e.to]   = [];
    adj[e.from].push({ ...e });
    // reverse edge: flip direction, keep type, invert floor sign in human text only
    adj[e.to].push({
      from:   e.to,
      to:     e.from,
      type:   e.type,
      dist:   e.dist,
      floors: e.floors,
      text:   reverseText(e),   // the human description has to be flipped too
      reversed: true,
    });
  }
  return adj;
}

/** Generate a sensible "reverse direction" description for an edge. */
function reverseText(e) {
  // For simple cases we just flip directional words. This keeps the JSON small.
  let t = e.text || "";
  t = t.replace(/\bup\b/gi, "DOWN_TMP")
       .replace(/\bdown\b/gi, "up")
       .replace(/DOWN_TMP/g, "down");
  t = t.replace(/\bnorth\b/gi, "SOUTH_TMP").replace(/\bsouth\b/gi, "north").replace(/SOUTH_TMP/g, "south");
  t = t.replace(/\beast\b/gi, "WEST_TMP").replace(/\bwest\b/gi, "east").replace(/WEST_TMP/g, "west");
  t = t.replace(/\bclimb\b/gi, "descend").replace(/\bclimbing\b/gi, "descending");
  t = t.replace(/\bdescend\b/gi, "climb").replace(/\bdescending\b/gi, "climbing");
  t = t.replace(/\bascends\b/gi, "descends").replace(/\bdescends\b/gi, "ascends");
  return t;
}

/** Dijkstra's algorithm.  Returns { distance, path } or null if unreachable. */
function dijkstra(adj, source, target) {
  const dist = {};
  const prev = {};
  const visited = new Set();
  // A naive priority queue is fine for our small graph (~10 nodes).
  // For larger graphs we'd swap in a binary heap.
  const queue = new Set();

  // Initialise
  for (const node of Object.keys(adj)) {
    dist[node] = Infinity;
    prev[node] = null;
    queue.add(node);
  }
  if (!(source in dist)) return null;
  dist[source] = 0;

  while (queue.size > 0) {
    // Find node in queue with smallest distance
    let u = null;
    let best = Infinity;
    for (const node of queue) {
      if (dist[node] < best) { best = dist[node]; u = node; }
    }
    if (u === null) break;        // remaining nodes are unreachable
    if (u === target) break;      // early termination

    queue.delete(u);
    visited.add(u);

    // Relax neighbours
    for (const edge of (adj[u] || [])) {
      if (visited.has(edge.to)) continue;
      const alt = dist[u] + edgeCost(edge);
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = { node: u, edge };
      }
    }
  }

  if (dist[target] === Infinity) return null;

  // Reconstruct the path (as a sequence of edges)
  const steps = [];
  let cur = target;
  while (prev[cur]) {
    steps.unshift(prev[cur].edge);
    cur = prev[cur].node;
  }
  return { cost: dist[target], steps };
}

/** Public API: find a route between two landmarks. */
function findRoute(startId, endId) {
  if (startId === endId) return { cost: 0, steps: [], sameStart: true };
  const adj = buildGraph(EDGES);
  return dijkstra(adj, startId, endId);
}

/** Convert a route to human-friendly statistics for the UI. */
function summariseRoute(route) {
  if (!route || !route.steps) return null;
  let totalMetres = 0;
  let totalFloors = 0;
  let timeMinutes = 0;
  for (const e of route.steps) {
    totalMetres += e.dist || 0;
    totalFloors += Math.abs(e.floors || 0);
    // Rough time model:
    //  walk:      80 m/min
    //  stairs:    40 m/min  + 6s per floor
    //  elevator:  10s per floor
    //  skybridge: 80 m/min
    //  monorail:  500 m/min
    //  ropeway:   200 m/min
    const speeds = { walk: 80, stairs: 40, skybridge: 80, monorail: 500, ropeway: 200, ferry: 300, elevator: 80 };
    const speed = speeds[e.type] || 80;
    timeMinutes += (e.dist || 0) / speed;
    if (e.type === "elevator") timeMinutes += (Math.abs(e.floors) * 10) / 60;
    if (e.type === "stairs")   timeMinutes += (Math.abs(e.floors) * 6)  / 60;
  }
  return {
    totalMetres: Math.round(totalMetres),
    totalFloors,
    timeMinutes: Math.max(1, Math.round(timeMinutes)),
    stepCount: route.steps.length,
  };
}
