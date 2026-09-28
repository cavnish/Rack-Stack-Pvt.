import type { CatalogueSeoContent } from "./types";

const PROJECT = "Available as per project requirement";
const CUSTOMISED = "Specifications can be customized as per requirement.";

export const materialHandlingContent: Record<string, CatalogueSeoContent> = {
  "ms-pallet": {
    heroDescription:
      "Rack & Stack manufactures M S Pallets in mild steel or stainless steel in Mumbai for warehouses, factories and material handling users across India. These steel pallets are used as a stable base for stacked loads, drum handling and material movement, and are more durable than timber in wet or industrial conditions. Pallet size and load capacity are planned for the load and handling method used.",
    overview: [
      "An M S pallet is a steel pallet used as a base for stacked loads, drum handling and material movement inside warehouses and industrial facilities. Steel pallets are reusable, hold their shape under heavy loads and are practical where timber pallets would be exposed to moisture, oil or rough handling. Mild steel or stainless steel can be selected according to the application.",
      "Rack & Stack supplies M S pallets from Mumbai to customers across India. Pallet dimensions, material grade, load capacity and configuration are planned against the load being carried, the equipment used to move it and the storage conditions on site. Final load capacity is confirmed as per the project design.",
    ],
    features: [
      { title: "Durable steel body", description: "Steel pallets resist impact, moisture and repeated handling." },
      { title: "Reusable", description: "Designed to be used repeatedly across many handling cycles." },
      { title: "Material options", description: "Available in mild steel or stainless steel." },
      { title: "Stable base", description: "Provides a level platform for stacked loads and drums." },
      { title: "Custom size", description: "Pallet dimensions planned against the load and equipment used." },
      { title: "Easy handling", description: "Suitable for use with pallet trucks, stackers and forklifts." },
    ],
    applicationDetails: {
      "Pallet handling": "A stable base for stacked and palletized loads.",
      "Warehouse material movement": "Moving materials around a warehouse on a durable platform.",
      "Industrial storage": "Supporting stored loads in industrial and factory environments.",
    },
    imageAlts: [
      "M S steel pallet in mild steel used for warehouse load handling",
      "Stainless steel pallet supporting an industrial load",
    ],
    specificationAdditions: [
      { label: "Material", value: "Mild Steel or Stainless Steel" },
      { label: "Dimension", value: PROJECT },
      { label: "Load capacity", value: PROJECT },
      { label: "Configuration", value: CUSTOMISED },
      { label: "Finish", value: PROJECT },
    ],
    seo: {
      title: "M S Pallet Manufacturer in Mumbai",
      description:
        "Rack & Stack manufactures M S pallets in mild steel or stainless steel in Mumbai and supplies across India. Durable steel pallets for warehouse handling.",
      ogTitle: "M S Pallet Manufacturer in Mumbai",
      ogDescription:
        "Mild steel and stainless steel M S pallets for industrial load handling, manufactured in Mumbai and supplied across India.",
      ogImageAlt: "M S steel pallet in mild steel used for warehouse load handling",
    },
  },

  "wooden-pallet": {
    heroDescription:
      "Rack & Stack supplies Wooden Pallets in Mumbai for warehouses, factories and exporters across India. Timber pallets are a practical and economical base for stacked and palletized loads and are widely used where goods are stored, dispatched and moved with forklifts or pallet trucks. Pallet size, construction and load capacity are planned for the load and handling method used.",
    overview: [
      "A wooden pallet is a timber platform used to support stacked or palletized loads during storage, handling and dispatch. Timber pallets are widely used because they are economical, readily available and compatible with normal warehouse equipment such as pallet trucks and forklifts. Pallet size and construction are selected according to the load and the handling method.",
      "Rack & Stack supplies wooden pallets from Mumbai to customers across India. Pallet dimensions, timber construction, load capacity and configuration are planned against the load being carried, the storage conditions and the equipment used to move it. Final load capacity is confirmed as per the project design.",
    ],
    features: [
      { title: "Economical base", description: "A practical and cost-effective platform for stacked loads." },
      { title: "Forklift compatible", description: "Works with standard pallet trucks and forklifts." },
      { title: "Reusable", description: "Built to be used repeatedly for handling cycles." },
      { title: "Custom size", description: "Pallet dimensions planned against the load and storage layout." },
      { title: "Easy handling", description: "Standard timber pallets suit normal warehouse workflows." },
      { title: "Load planned", description: "Construction planned to suit the weight being carried." },
    ],
    applicationDetails: {
      "Pallet handling": "Supporting stacked and palletized loads during handling.",
      "Warehouse storage": "Base platform for stored goods in pallet racking and on the floor.",
      "Material movement": "Moving materials between storage, production and dispatch areas.",
    },
    imageAlts: [
      "Wooden pallet supporting a stacked load in a warehouse",
      "Timber pallet used for warehouse material movement",
    ],
    specificationAdditions: [
      { label: "Material", value: "Wood" },
      { label: "Dimension", value: PROJECT },
      { label: "Load capacity", value: PROJECT },
      { label: "Construction", value: CUSTOMISED },
      { label: "Configuration", value: PROJECT },
    ],
    seo: {
      title: "Wooden Pallet Manufacturer in Mumbai",
      description:
        "Rack & Stack supplies wooden pallets in Mumbai and across India. Timber pallets for stacked loads, warehouse storage and forklift handling.",
      ogTitle: "Wooden Pallet Manufacturer in Mumbai",
      ogDescription:
        "Wooden pallets for stacked and palletized loads, supplied from Mumbai across India.",
      ogImageAlt: "Wooden pallet supporting a stacked load in a warehouse",
    },
  },

  "hydraulic-pallet-truck": {
    heroDescription:
      "Rack & Stack supplies Hydraulic Pallet Trucks in Mumbai for warehouses, factories and loading bays across India. This hand pallet truck lifts a loaded pallet a short distance using a hydraulic pump, making it a simple and economical way to move palletized goods around a floor. Load capacity, fork length and lift height are planned for the pallets and loads used on site.",
    overview: [
      "A hydraulic pallet truck is used to move palletized goods over short distances inside a warehouse, factory or loading bay. The operator pumps the handle to raise the pallet, then steers it with the forks under the pallet. Because it is manually operated and needs no electric power, it is a practical first piece of handling equipment for a new warehouse.",
      "Rack & Stack supplies hydraulic pallet trucks from Mumbai to customers across India. Load capacity, fork length, wheel arrangement and lift height are planned against the heaviest pallet load and the floor conditions on site. Final load capacity is confirmed as per the project design.",
    ],
    features: [
      { title: "Simple operation", description: "Manual pumping raises the pallet without electric power." },
      { title: "Easy pallet handling", description: "Forks fit standard pallets for quick loading and unloading." },
      { title: "Compact size", description: "Small enough to move in narrow aisles and around racking." },
      { title: "Load planned", description: "Capacity planned against the pallet loads used on site." },
      { title: "Durable construction", description: "Steel frame and forks built for regular warehouse use." },
      { title: "Low maintenance", description: "Basic hydraulic mechanism that is simple to service." },
    ],
    applicationDetails: {
      "Pallet movement": "Moving loaded pallets between storage and dispatch areas.",
      "Warehouse handling": "Short distance movement of palletized goods by hand.",
      "Loading-bay movement": "Positioning pallets at a loading bay or truck.",
    },
    imageAlts: [
      "Hydraulic pallet truck lifting a loaded wooden pallet",
      "Hand pallet truck moving pallets inside a warehouse",
    ],
    specificationAdditions: [
      { label: "Dimension", value: "L 1150 mm X W 540 mm" },
      { label: "Lowered height", value: "85 mm" },
      { label: "Lifted height", value: "200 mm" },
      { label: "Load capacity", value: PROJECT },
      { label: "Operation", value: "Manual hydraulic" },
      { label: "Fork length", value: PROJECT },
      { label: "Wheel arrangement", value: PROJECT },
    ],
    seo: {
      title: "Hydraulic Pallet Truck Manufacturer in Mumbai",
      description:
        "Rack & Stack supplies hydraulic pallet trucks in Mumbai and across India. Hand pallet trucks for moving loaded pallets in warehouses and factories.",
      ogTitle: "Hydraulic Pallet Truck Manufacturer in Mumbai",
      ogDescription:
        "Manual hydraulic pallet trucks with L 1150 mm X W 540 mm dimensions for warehouse pallet handling, supplied from Mumbai across India.",
      ogImageAlt: "Hydraulic pallet truck lifting a loaded wooden pallet",
    },
  },

  "drum-loading-trolley": {
    heroDescription:
      "Rack & Stack supplies Drum Loading Trolleys in Mumbai for warehouses, factories and chemical plants across India. This trolley is designed to handle standard drums and cans, allowing them to be moved and positioned without tilting or lifting manually. Platform size, wheel arrangement and load capacity are planned for the drums and floor conditions on site.",
    overview: [
      "A drum loading trolley is used to move standard drums and cans around a warehouse or plant floor. The drum is held against a retaining arrangement and carried on a platform, so it can be moved and set down without being tilted by hand. This is useful where drums are filled, emptied, stored or dispatched regularly.",
      "Rack & Stack supplies drum loading trolleys from Mumbai to customers across India. Platform size, wheel arrangement, drum size and load capacity are planned against the drums used and the floor surface on site. Final load capacity is confirmed as per the project design.",
    ],
    features: [
      { title: "Drum handling", description: "Designed to carry and position standard drums and cans." },
      { title: "No manual lifting", description: "Drums are moved without being tilted or lifted by hand." },
      { title: "Stable platform", description: "Retaining arrangement keeps the drum secure while moving." },
      { title: "Maneuverable", description: "Wheel arrangement planned for smooth movement on the site floor." },
      { title: "Load planned", description: "Capacity planned against the drums and contents being handled." },
      { title: "Durable build", description: "Steel construction for regular industrial use." },
    ],
    applicationDetails: {
      "Drum loading": "Loading drums onto a platform or handling station.",
      "Drum movement": "Moving drums between storage, filling and dispatch areas.",
      "Warehouse handling": "Positioning drums safely within a warehouse or plant.",
    },
    imageAlts: [
      "Drum loading trolley carrying a standard industrial drum",
      "Trolley used to move steel drums inside a factory",
    ],
    specificationAdditions: [
      { label: "Dimension", value: PROJECT },
      { label: "Load capacity", value: PROJECT },
      { label: "Platform size", value: PROJECT },
      { label: "Wheel configuration", value: CUSTOMISED },
      { label: "Drum size", value: PROJECT },
      { label: "Finish", value: PROJECT },
    ],
    seo: {
      title: "Drum Loading Trolley Manufacturer in Mumbai",
      description:
        "Rack & Stack supplies drum loading trolleys in Mumbai and across India. Trolleys for moving and positioning standard industrial drums safely.",
      ogTitle: "Drum Loading Trolley Manufacturer in Mumbai",
      ogDescription:
        "Drum loading trolleys for standard drums and cans, supplied from Mumbai across India.",
      ogImageAlt: "Drum loading trolley carrying a standard industrial drum",
    },
  },

  "dock-leveler": {
    heroDescription:
      "Rack & Stack supplies Dock Levelers in Mumbai for factories, warehouses and distribution centres across India. A dock leveler bridges the height difference between a warehouse floor and a truck, making loading and unloading safer and faster for pallet trucks and forklifts. Leveler length, pit size and capacity are planned for the loading bay and the vehicles used.",
    overview: [
      "A dock leveler bridges the gap and height difference between a warehouse floor and a truck bed, so material handling equipment can move between the two without a step. This makes pallet trucks and forklifts safer to use at the loading bay and speeds up loading and unloading. Levers can be planned for the pit size, vehicle bed height and the equipment used.",
      "Rack & Stack supplies and installs dock levelers from Mumbai to customers across India. Leveler length, pit dimensions, capacity and operation are planned against the loading bay, the vehicles being served and the handling equipment in use. Final capacity is confirmed as per the project design.",
    ],
    features: [
      { title: "Safe loading", description: "Bridges the floor and vehicle height to reduce lifting risk." },
      { title: "Faster handling", description: "Pallet trucks and forklifts move smoothly between floor and truck." },
      { title: "Capacity planned", description: "Leveler capacity selected against the handling equipment used." },
      { title: "Custom pit size", description: "Length and pit dimensions planned for the loading bay." },
      { title: "Durable steel deck", description: "Steel deck and frame built for repeated loading cycles." },
      { title: "Bespoke installation", description: "Fitted to the loading bay and the vehicles it serves." },
    ],
    applicationDetails: {
      "Factory loading bay": "Level interface between the factory floor and truck beds.",
      "Loading and unloading": "Safer, quicker transfer of goods into and out of vehicles.",
      "Vehicle loading interface": "A stable bridge for handling equipment at the vehicle edge.",
    },
    imageAlts: [
      "Dock leveler bridging a warehouse floor and a truck",
      "Dock leveler installed in a factory loading bay",
    ],
    specificationAdditions: [
      { label: "Maximum capacity", value: "9000 kg" },
      { label: "Dimension", value: PROJECT },
      { label: "Application", value: "Factory loading bay" },
      { label: "Operation", value: CUSTOMISED },
      { label: "Leveler length", value: PROJECT },
      { label: "Pit size", value: PROJECT },
      { label: "Finish", value: PROJECT },
    ],
    seo: {
      title: "Dock Leveler Manufacturer in Mumbai",
      description:
        "Rack & Stack supplies dock levelers in Mumbai and across India. Loading bay levelers up to 9000 kg capacity for factories, warehouses and trucks.",
      ogTitle: "Dock Leveler Manufacturer in Mumbai",
      ogDescription:
        "Dock levelers with capacity up to 9000 kg for safe warehouse and factory loading bays, supplied from Mumbai across India.",
      ogImageAlt: "Dock leveler bridging a warehouse floor and a truck",
    },
  },

  "high-level-front-dumper": {
    heroDescription:
      "Rack & Stack supplies High Level Front Dumpers in Mumbai for factories, warehouses and material handling units across India. This unit tilts and dumps drums, bins and containers from the front, so stored material can be emptied into a process or a skip without manual lifting. Tilt arrangement and load capacity are planned for the containers and the material handled.",
    overview: [
      "A high level front dumper is used to tilt and empty drums, bins and containers from the front. The load is carried at a height where it can be positioned in line with a machine or skip, then tilted forward to discharge the contents. This removes the need to lift and tip heavy containers by hand during emptying and dosing operations.",
      "Rack & Stack supplies high level front dumpers from Mumbai to customers across India. Tilt arrangement, load capacity, fork or platform mounting and dimensions are planned against the containers used and the process they feed. Final load capacity is confirmed as per the project design.",
    ],
    features: [
      { title: "Front discharge", description: "Tilts forward to empty the container from the front." },
      { title: "No manual lifting", description: "Heavy containers are emptied without lifting or tipping by hand." },
      { title: "High level handling", description: "Carries the load at a height suited to the process or skip." },
      { title: "Tilt control", description: "Controlled tilt angle for controlled discharge of material." },
      { title: "Load planned", description: "Capacity planned against the container and its contents." },
      { title: "Durable build", description: "Steel construction for regular industrial use." },
    ],
    applicationDetails: {
      "Drum tilting": "Tilting drums for controlled emptying at a process point.",
      "Drum dumping": "Emptying drums and containers into a skip or hopper.",
      "Material handling": "Moving and discharging bulk material between areas.",
    },
    imageAlts: [
      "High level front dumper tilting a drum to empty its contents",
      "Front dumper unit used to discharge material into a skip",
    ],
    specificationAdditions: [
      { label: "Tilt angle", value: "180 degrees" },
      { label: "Load capacity", value: PROJECT },
      { label: "Dimension", value: PROJECT },
      { label: "Operation", value: CUSTOMISED },
      { label: "Mounting", value: PROJECT },
      { label: "Finish", value: PROJECT },
    ],
    seo: {
      title: "High Level Front Dumper Manufacturer in Mumbai",
      description:
        "Rack & Stack supplies high level front dumpers in Mumbai and across India. Front tilting units for drums, bins and containers with a 180 degree tilt.",
      ogTitle: "High Level Front Dumper Manufacturer in Mumbai",
      ogDescription:
        "High level front dumpers with 180 degree tilt for drum and container discharge, supplied from Mumbai across India.",
      ogImageAlt: "High level front dumper tilting a drum to empty its contents",
    },
  },

  "manual-mechanical-stacker": {
    heroDescription:
      "Rack & Stack supplies Manual Mechanical Stackers in Mumbai for warehouses, factories and loading areas across India. This hand operated stacker lifts a pallet or load using a mechanical ratchet mechanism and needs no electric power, which makes it a practical low cost choice for short distance lifting. Load capacity, lift height and fork size are planned for the loads handled on site.",
    overview: [
      "A manual mechanical stacker lifts pallets and loads using a hand operated ratchet mechanism rather than hydraulics or electric power. The operator pumps the handle to raise the forks, so it can be used where power is not available or where only occasional lifting is needed. It is normally used for short distance lifting and positioning within a warehouse.",
      "Rack & Stack supplies manual mechanical stackers from Mumbai to customers across India. Load capacity, lift height, fork size and wheel arrangement are planned against the loads handled and the working height required. Final load capacity is confirmed as per the project design.",
    ],
    features: [
      { title: "No power needed", description: "Hand operated mechanism, so no electricity or fuel is required." },
      { title: "Simple lifting", description: "Ratchet mechanism raises the load in small steps." },
      { title: "Cost effective", description: "An economical option where lifting is occasional." },
      { title: "Load planned", description: "Capacity planned against the pallets and loads handled." },
      { title: "Portable", description: "Can be moved to wherever lifting is needed on the floor." },
      { title: "Durable build", description: "Steel forks and frame for regular warehouse use." },
    ],
    applicationDetails: {
      "Manual load lifting": "Raising pallets and loads a short distance by hand.",
      "Warehouse handling": "Lifting loads where powered equipment is not required.",
      "Pallet movement": "Positioning pallets at height for loading or stacking.",
    },
    imageAlts: [
      "Manual mechanical stacker lifting a pallet by hand",
      "Hand operated stacker raising a load inside a warehouse",
    ],
    specificationAdditions: [
      { label: "Load Capacity", value: "100-500 kg" },
      { label: "Lifted height", value: "2000 mm" },
      { label: "Operation", value: "Manual operation" },
      { label: "Electrical Power", value: "Not required" },
      { label: "Fork size", value: PROJECT },
      { label: "Wheel arrangement", value: PROJECT },
    ],
    seo: {
      title: "Manual Mechanical Stacker Manufacturer in Mumbai",
      description:
        "Rack & Stack supplies manual mechanical stackers in Mumbai and across India. Hand operated stackers with 100-500 kg capacity and 2000 mm lift height.",
      ogTitle: "Manual Mechanical Stacker Manufacturer in Mumbai",
      ogDescription:
        "Manual mechanical stackers with 100-500 kg load capacity and 2000 mm lifted height, supplied from Mumbai across India.",
      ogImageAlt: "Manual mechanical stacker lifting a pallet by hand",
    },
  },

  "battery-hydraulic-stacker": {
    heroDescription:
      "Rack & Stack supplies Battery Hydraulic Stackers in Mumbai for warehouses, factories and distribution centres across India. This self propelled stacker raises loads using a battery powered hydraulic pump, giving the operator better visibility and a longer lifting reach without needing to push the load. Load capacity, lift height and mast arrangement are planned for the loads and working height on site.",
    overview: [
      "A battery hydraulic stacker uses a battery powered hydraulic pump to raise the forks, and is driven by the operator rather than pushed. Because the operator stands behind the load, visibility is better and the load can be lifted to a greater height with less effort. This makes it suitable for pallet handling in medium to high rack positions.",
      "Rack & Stack supplies battery hydraulic stackers from Mumbai to customers across India. Load capacity, lift height, mast arrangement and battery type are planned against the loads handled, the rack levels in use and the working shifts on site. Final load capacity is confirmed as per the project design.",
    ],
    features: [
      { title: "Battery powered", description: "Battery operation with no exhaust and indoor use." },
      { title: "Self propelled", description: "Operator drives the unit, giving better visibility over the load." },
      { title: "Higher lift", description: "Lift height planned for medium to high level rack positions." },
      { title: "Reduced operator effort", description: "Powered lifting removes the need to pump the handle manually." },
      { title: "Load planned", description: "Capacity planned against the loads and rack levels used." },
      { title: "Durable build", description: "Steel mast and forks for regular warehouse duty." },
    ],
    applicationDetails: {
      "Battery-powered load lifting": "Lifting pallets and loads where powered lifting is needed.",
      "Warehouse handling": "Moving and stacking pallets in warehouse aisles.",
      "Pallet movement": "Positioning pallets at higher rack levels.",
    },
    imageAlts: [
      "Battery hydraulic stacker raising a pallet inside a warehouse",
      "Self propelled stacker lifting a load to a higher rack level",
    ],
    specificationAdditions: [
      { label: "Load Capacity", value: "500-1200 kg" },
      { label: "Lifted height", value: "up to 4000 mm" },
      { label: "Power source", value: "Battery Power" },
      { label: "Operation", value: "Battery operated" },
      { label: "Mast arrangement", value: PROJECT },
      { label: "Battery type", value: PROJECT },
    ],
    seo: {
      title: "Battery Hydraulic Stacker Manufacturer in Mumbai",
      description:
        "Rack & Stack supplies battery hydraulic stackers in Mumbai and across India. Self propelled stackers with 500-1200 kg capacity and lift height up to 4000 mm.",
      ogTitle: "Battery Hydraulic Stacker Manufacturer in Mumbai",
      ogDescription:
        "Battery hydraulic stackers with 500-1200 kg load capacity and up to 4000 mm lift height, supplied from Mumbai across India.",
      ogImageAlt: "Battery hydraulic stacker raising a pallet inside a warehouse",
    },
  },

  "floor-crane": {
    heroDescription:
      "Rack & Stack supplies Floor Cranes in Mumbai for factories, warehouses and workshops across India. A floor crane lifts and moves heavy or awkward loads at floor level using a lifting arm and a wheeled base, so loads can be raised and positioned without a forklift. Load capacity, lift height and arm length are planned for the heaviest load and the working area.",
    overview: [
      "A floor crane is used to lift and move heavy or awkward loads at floor level. A lifting arm raises the load from a wheeled base, allowing the operator to position it without driving a forklift underneath. It is commonly used for loading machines, handling dies and moving components where a forklift is not practical.",
      "Rack & Stack supplies floor cranes from Mumbai to customers across India. Load capacity, lift height, arm length and operating mode are planned against the loads handled and the working area available. Final load capacity is confirmed as per the project design.",
    ],
    features: [
      { title: "Floor level lifting", description: "Lifts loads without driving a forklift underneath the load." },
      { title: "Heavy load handling", description: "Planned capacity for heavy, awkward or non-palletized loads." },
      { title: "Flexible operation", description: "Available in manual and electric hydraulic modes." },
      { title: "Positioning", description: "Wheeled base allows the load to be moved and set down accurately." },
      { title: "Custom lift height", description: "Lift height planned against the working height required." },
      { title: "Durable build", description: "Steel arm and base for regular industrial use." },
    ],
    applicationDetails: {
      "Floor-based load lifting": "Raising heavy or awkward loads at floor level.",
      "Material movement": "Moving components and dies between work areas.",
      "Warehouse handling": "Handling loads where forklift access is not possible.",
    },
    imageAlts: [
      "Floor crane lifting a heavy load inside a factory",
      "Wheeled floor crane positioning an industrial component",
    ],
    specificationAdditions: [
      { label: "Load capacity", value: "up to 2000 kg" },
      { label: "Operation", value: "Manual and Electric Hydraulic modes" },
      { label: "Lift height", value: PROJECT },
      { label: "Dimension", value: CUSTOMISED },
      { label: "Arm length", value: PROJECT },
    ],
    seo: {
      title: "Floor Crane Manufacturer in Mumbai",
      description:
        "Rack & Stack supplies floor cranes in Mumbai and across India. Floor level load lifting cranes with capacity up to 2000 kg for factories and warehouses.",
      ogTitle: "Floor Crane Manufacturer in Mumbai",
      ogDescription:
        "Floor cranes with load capacity up to 2000 kg in manual and electric hydraulic modes, supplied from Mumbai across India.",
      ogImageAlt: "Floor crane lifting a heavy load inside a factory",
    },
  },

  "multi-scissors-lift-platform": {
    heroDescription:
      "Rack & Stack supplies Multi Scissors Lift Platforms in Mumbai for factories, warehouses and loading areas across India. This electro hydraulic platform raises a load through stacked scissor legs, giving a stable raised surface for loading, positioning or access at height. Platform size, lift height and load capacity are planned for the load and the working height required.",
    overview: [
      "A multi scissor lift platform raises a load using more than one set of scissor legs stacked together. The stacked arrangement gives a greater lift height than a single scissor platform while keeping a stable, level deck. It is used where loads need to be raised to a working or loading height, such as onto a machine bed or a vehicle.",
      "Rack & Stack supplies multi scissor lift platforms from Mumbai to customers across India. Platform size, lift height and load capacity are planned against the load, the lift height required and the space available on site. Final load capacity is confirmed as per the project design.",
    ],
    features: [
      { title: "Greater lift height", description: "Stacked scissor legs give more lift than a single scissor platform." },
      { title: "Stable platform", description: "Level deck for loading and positioning at height." },
      { title: "Electro hydraulic", description: "Powered lift and lowering for controlled movement." },
      { title: "Load planned", description: "Capacity planned against the load being raised." },
      { title: "Custom platform size", description: "Deck size planned against the load dimensions and access." },
      { title: "Durable build", description: "Steel platform and legs for regular industrial use." },
    ],
    applicationDetails: {
      "Platform lifting": "Raising loads to a working or loading height.",
      "Material handling": "Positioning heavy material at a raised level.",
      "Warehouse elevation": "Bringing items up to a higher working level.",
    },
    imageAlts: [
      "Multi scissor lift platform raised to a working height",
      "Scissor lift platform lifting a load inside a warehouse",
    ],
    specificationAdditions: [
      { label: "Maximum load capacity", value: "2500 kg" },
      { label: "Operation", value: "Electro hydraulic" },
      { label: "Platform size", value: PROJECT },
      { label: "Lift height", value: CUSTOMISED },
      { label: "Number of scissor stages", value: PROJECT },
    ],
    seo: {
      title: "Multi Scissors Lift Platform Manufacturer in Mumbai",
      description:
        "Rack & Stack supplies multi scissor lift platforms in Mumbai and across India. Electro hydraulic lift platforms with capacity up to 2500 kg for warehouses and factories.",
      ogTitle: "Multi Scissors Lift Platform Manufacturer in Mumbai",
      ogDescription:
        "Multi scissor lift platforms with capacity up to 2500 kg, supplied from Mumbai across India.",
      ogImageAlt: "Multi scissor lift platform raised to a working height",
    },
  },

  "hydraulic-stacker": {
    heroDescription:
      "Rack & Stack supplies Hydraulic Stackers in Mumbai for warehouses, factories and loading areas across India. This manually pumped stacker raises a pallet using a hydraulic pump, giving a practical way to lift loads where powered equipment is not required. Load capacity, lift height and fork size are planned for the loads and working height on site.",
    overview: [
      "A hydraulic stacker lifts pallets and loads using a manually operated hydraulic pump. The operator pumps the handle to raise the forks, so no electricity or fuel is needed, and the unit can be used in areas where powered equipment is impractical. It is normally used for short distance lifting and positioning within a warehouse.",
      "Rack & Stack supplies hydraulic stackers from Mumbai to customers across India. Load capacity, lift height, fork size and wheel arrangement are planned against the loads handled and the working height required. Final load capacity is confirmed as per the project design.",
    ],
    features: [
      { title: "Hydraulic lifting", description: "Manually pumped hydraulic lift raises the load smoothly." },
      { title: "No power needed", description: "Operates without electricity or fuel." },
      { title: "Simple handling", description: "Forks fit standard pallets for quick positioning." },
      { title: "Load planned", description: "Capacity planned against the pallets and loads handled." },
      { title: "Compact size", description: "Moves easily in narrow aisles and around racking." },
      { title: "Durable build", description: "Steel forks and frame for regular warehouse use." },
    ],
    applicationDetails: {
      "Hydraulic load lifting": "Raising pallets and loads by manual pumping.",
      "Warehouse handling": "Lifting loads where powered equipment is not available.",
      "Material movement": "Positioning material at height for stacking or loading.",
    },
    imageAlts: [
      "Hydraulic stacker lifting a pallet by hand pumping",
      "Manual hydraulic stacker raising a load in a warehouse",
    ],
    specificationAdditions: [
      { label: "Operation", value: "Hydraulic" },
      { label: "Load capacity", value: PROJECT },
      { label: "Lifted height", value: PROJECT },
      { label: "Dimension", value: CUSTOMISED },
      { label: "Fork size", value: PROJECT },
      { label: "Wheel arrangement", value: PROJECT },
    ],
    seo: {
      title: "Hydraulic Stacker Manufacturer in Mumbai",
      description:
        "Rack & Stack supplies hydraulic stackers in Mumbai and across India. Manually pumped stackers for lifting pallets and loads in warehouses and factories.",
      ogTitle: "Hydraulic Stacker Manufacturer in Mumbai",
      ogDescription:
        "Manual hydraulic stackers for warehouse pallet lifting, supplied from Mumbai across India.",
      ogImageAlt: "Hydraulic stacker lifting a pallet by hand pumping",
    },
  },

  "scissors-lift-platform": {
    heroDescription:
      "Rack & Stack supplies Scissors Lift Platforms in Mumbai for factories, warehouses and loading bays across India. This platform raises a load through a scissor mechanism to give a stable working level for loading, positioning or access at height. Platform size, lift height, operation and load capacity are planned for the load and the height required.",
    overview: [
      "A scissor lift platform raises a load using a scissor mechanism that extends vertically as the platform rises. The result is a stable, level deck at height, which is useful for loading equipment, positioning material or working at a raised level. The scissor arrangement takes up little floor space compared with a platform that lifts vertically.",
      "Rack & Stack supplies scissor lift platforms from Mumbai to customers across India. Platform size, lift height, operation and load capacity are planned against the load being raised, the working height required and the space available. Final load capacity is confirmed as per the project design.",
    ],
    features: [
      { title: "Level working deck", description: "Stable platform for loading and working at height." },
      { title: "Compact footprint", description: "Scissor mechanism uses little floor space when lowered." },
      { title: "Planned lift height", description: "Lift height planned against the working height required." },
      { title: "Custom platform size", description: "Deck size planned against the load dimensions and access." },
      { title: "Flexible operation", description: "Operation mode planned as required." },
      { title: "Durable build", description: "Steel platform and legs for regular industrial use." },
    ],
    applicationDetails: {
      "Platform lifting": "Raising loads to a working or loading height.",
      "Material elevation": "Bringing material up to a higher level for handling.",
      "Warehouse handling": "Lifting loads where raised access is needed.",
    },
    imageAlts: [
      "Scissors lift platform raised to a working level",
      "Scissor lift platform elevating a load inside a factory",
    ],
    specificationAdditions: [
      { label: "Load capacity", value: PROJECT },
      { label: "Platform size", value: PROJECT },
      { label: "Lift height", value: PROJECT },
      { label: "Operation", value: CUSTOMISED },
      { label: "Platform type", value: PROJECT },
    ],
    seo: {
      title: "Scissors Lift Platform Manufacturer in Mumbai",
      description:
        "Rack & Stack supplies scissor lift platforms in Mumbai and across India. Lift platforms for raising loads to working height in warehouses and factories.",
      ogTitle: "Scissors Lift Platform Manufacturer in Mumbai",
      ogDescription:
        "Scissor lift platforms for raising loads to working height, supplied from Mumbai across India.",
      ogImageAlt: "Scissors lift platform raised to a working level",
    },
  },

  "porter-goods-lifting-platform": {
    heroDescription:
      "Rack & Stack supplies Porter Goods Lifting Platforms in Mumbai for warehouses, factories and multi level buildings across India. This stationary goods lift carries loads between one level and another using two vertical guide masts, so material can be moved vertically where a ramp or lift shaft is not available. Capacity, travel height and platform size are planned for the load and the levels served.",
    overview: [
      "A porter goods lifting platform is a stationary goods lift that carries loads between two levels using two vertical guide masts. The load sits on a platform and is raised along the guides, so material can be moved between a floor and a mezzanine or raised level without building a full lift shaft. It is used where goods need regular vertical movement.",
      "Rack & Stack supplies porter goods lifting platforms from Mumbai to customers across India. Capacity, travel height, platform size and drive arrangement are planned against the load, the levels being served and the available floor space. Final capacity is confirmed as per the project design.",
    ],
    features: [
      { title: "Moves between levels", description: "Carries loads from one level to another along guide masts." },
      { title: "High capacity", description: "Capacity planned against the load being carried." },
      { title: "No lift shaft", description: "Guide mast arrangement avoids building a full lift shaft." },
      { title: "Stationary unit", description: "Fixed position with a platform for regular goods movement." },
      { title: "Custom travel height", description: "Travel distance planned against the levels being served." },
      { title: "Durable build", description: "Steel platform and masts for regular industrial use." },
    ],
    applicationDetails: {
      "Goods lift between levels": "Moving goods between a floor and a raised level.",
      "Stationary material lifting": "Regular vertical movement of material at a fixed position.",
      "Warehouse handling": "Raising loads to a mezzanine or upper working level.",
    },
    imageAlts: [
      "Porter goods lifting platform carrying a load between two levels",
      "Stationary goods lift with two vertical guide masts in a warehouse",
    ],
    specificationAdditions: [
      { label: "Capacity", value: "1000-5000 kg" },
      { label: "Platform type", value: "Stationary goods lift" },
      { label: "Movement", value: "One level to another level" },
      { label: "Guide system", value: "Two vertical guide masts" },
      { label: "Platform size", value: PROJECT },
      { label: "Travel height", value: PROJECT },
    ],
    seo: {
      title: "Porter Goods Lifting Platform Manufacturer in Mumbai",
      description:
        "Rack & Stack supplies porter goods lifting platforms in Mumbai and across India. Stationary goods lifts with 1000-5000 kg capacity for moving loads between levels.",
      ogTitle: "Porter Goods Lifting Platform Manufacturer in Mumbai",
      ogDescription:
        "Stationary porter goods lifting platforms with 1000-5000 kg capacity, supplied from Mumbai across India.",
      ogImageAlt: "Porter goods lifting platform carrying a load between two levels",
    },
  },
};
