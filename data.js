/* =========================================================================
   data.js  —  Mountain City Wayfinder dataset
   -------------------------------------------------------------------------
   Computational Thinking: DATA + ABSTRACTION
   The real city is too complicated to model fully. Here we abstract Chongqing
   into a weighted graph: each landmark or decision point is a NODE with an
   elevation, and each walkable connection is an EDGE with a type, a distance
   in metres, and an optional vertical change in floors.
   ========================================================================= */

// ---- LANDMARKS (the "nodes" tourists actually choose from) ---------------
const LANDMARKS = [
  { id: "jiefangbei",  name: "Jiefangbei Square",        cn: "解放碑",     elevation: 0,  blurb: "Chongqing's central pedestrian shopping district. Ground level, but everything around it goes up." },
  { id: "hongyadong",  name: "Hongyadong Stilt Houses",  cn: "洪崖洞",     elevation: 7,  blurb: "Cliff-side complex of layered stilt houses. Entry on Floor 1, exit on Floor 11 — same building." },
  { id: "liziba",      name: "Liziba Monorail Station",  cn: "李子坝",     elevation: 8,  blurb: "Line 2 passes through floors 6–8 of a residential tower. The train station is also someone's address." },
  { id: "chaotianmen", name: "Chaotianmen Docks",        cn: "朝天门",     elevation: 0,  blurb: "Where the Yangtze and Jialing rivers meet. Ground level on the water; high cliffs immediately behind." },
  { id: "eling",       name: "Eling Park & Ropeway",     cn: "鹅岭公园",   elevation: 22, blurb: "Hill-top park with a cable car descending to the Yangtze. The summit sits 22 floors above the riverside road." },
  { id: "ciqikou",     name: "Ciqikou Old Town",         cn: "磁器口",     elevation: 3,  blurb: "Preserved Ming/Qing dynasty market town. Cobbled streets climb gently from the riverbank." },
];

// ---- INTERNAL DECISION NODES (not user-selectable, but used for routing) -
// These represent transfer points: a parking-garage elevator, a skybridge, etc.
const NODES = [
  ...LANDMARKS,
  { id: "garage_top",    name: "Parking Garage Roof",   cn: "停车场顶",  elevation: 11, internal: true },
  { id: "skybridge_n",   name: "North Skybridge",       cn: "北天桥",    elevation: 11, internal: true },
  { id: "hongya_top",    name: "Hongyadong Top Deck",   cn: "洪崖洞顶",  elevation: 11, internal: true },
  { id: "eling_base",    name: "Ropeway Lower Station", cn: "索道下站",  elevation: 0,  internal: true },
  { id: "ciqikou_pier",  name: "Ciqikou Pier",          cn: "磁器口码头", elevation: 0,  internal: true },
];

// ---- EDGES (the "graph") -------------------------------------------------
// type:  "walk" | "stairs" | "elevator" | "skybridge" | "monorail" | "ropeway"
// dist:  horizontal metres
// floors: vertical floors changed (absolute)
const EDGES = [
  // From Jiefangbei
  { from: "jiefangbei",  to: "garage_top",   type: "walk",      dist: 350, floors: 0,  text: "Walk 350m north past the Liberation Monument, toward the river." },
  { from: "garage_top",  to: "skybridge_n",  type: "elevator",  dist: 0,   floors: 11, text: "Enter the parking garage and take the elevator up 11 floors to the rooftop." },
  { from: "skybridge_n", to: "hongya_top",   type: "skybridge", dist: 80,  floors: 0,  text: "Cross the 80m skybridge into the Hongyadong top entrance. Stay on L+11." },
  { from: "hongya_top",  to: "hongyadong",   type: "stairs",    dist: 40,  floors: 4,  text: "Descend through the stilt-house galleries down 4 floors to the L+7 observation deck." },

  // From Jiefangbei direct walk to Liziba (long, surface route)
  { from: "jiefangbei",  to: "liziba",       type: "walk",      dist: 1900, floors: 8, text: "Walk west along the ridge for 1.9km, climbing roughly 8 floors of elevation along the way." },

  // From Jiefangbei to Chaotianmen
  { from: "jiefangbei",  to: "chaotianmen",  type: "walk",      dist: 1300, floors: 0, text: "Walk 1.3km northeast along Minzu Road to reach the dock plaza." },
  { from: "chaotianmen", to: "hongyadong",   type: "walk",      dist: 800,  floors: 7, text: "Walk 800m along the riverbank promenade, then climb 7 floors up the cliff staircase." },

  // Monorail connections
  { from: "liziba",      to: "jiefangbei",   type: "monorail",  dist: 2400, floors: 8, text: "Board Line 2 at Liziba. The train exits the building and descends 8 floors over 2.4km to Jiefangbei." },
  { from: "liziba",      to: "eling",        type: "monorail",  dist: 1100, floors: 14, text: "Board Line 2 at Liziba and ride 1.1km north to Eling, climbing 14 floors of elevation." },

  // Eling
  { from: "eling",       to: "eling_base",   type: "ropeway",   dist: 1100, floors: 22, text: "Take the cable car down 22 floors from Eling summit to the Yangtze riverside." },
  { from: "eling_base",  to: "chaotianmen",  type: "walk",      dist: 1600, floors: 0,  text: "Follow the riverside boardwalk 1.6km east to Chaotianmen Docks." },

  // Ciqikou
  { from: "ciqikou",     to: "ciqikou_pier", type: "stairs",    dist: 120,  floors: 3,  text: "Descend the old market staircase 3 floors to the Ciqikou pier." },
  { from: "ciqikou_pier", to: "chaotianmen", type: "ferry",     dist: 8500, floors: 0,  text: "Take the river ferry 8.5km east along the Jialing River to Chaotianmen." },
];

// ---- ICONS & LABELS for each edge type -----------------------------------
const EDGE_STYLE = {
  walk:      { icon: "↗",  label: "WALK",      colour: "#c8b890" },
  stairs:    { icon: "↓",  label: "STAIRS",    colour: "#d9a13a" },
  elevator:  { icon: "↑",  label: "ELEVATOR",  colour: "#f7d57a" },
  skybridge: { icon: "→",  label: "SKYBRIDGE", colour: "#f7d57a" },
  monorail:  { icon: "▭",  label: "MONORAIL",  colour: "#5fa8b0" },
  ropeway:   { icon: "⇣",  label: "ROPEWAY",   colour: "#5fa8b0" },
  ferry:     { icon: "≈",  label: "FERRY",     colour: "#5fa8b0" },
};
