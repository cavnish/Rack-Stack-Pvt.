import "dotenv/config";
import { hash } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db, pool } from "../src/db";
import {
  blogCategories,
  blogPosts,
  clientLogos,
  clients,
  faqs,
  gallery,
  homepageSections,
  industries,
  pages,
  productApplications,
  productFeatures,
  productImages,
  productIndustries,
  productRelatedProducts,
  productSpecifications,
  products,
  seoSettings,
  serviceFeatures,
  serviceIndustries,
  services,
  siteSettings,
  users,
} from "../src/db/schema";

const images = {
  hero: "https://images.pexels.com/photos/4487363/pexels-photo-4487363.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=2000",
  aisle: "https://images.pexels.com/photos/4170172/pexels-photo-4170172.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
  forklift: "https://images.pexels.com/photos/8760709/pexels-photo-8760709.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
  warehouse: "https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
  shelving: "https://images.pexels.com/photos/36126272/pexels-photo-36126272.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
  racks: "https://images.pexels.com/photos/36126305/pexels-photo-36126305.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
  installation: "https://images.pexels.com/photos/4483860/pexels-photo-4483860.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
  longspan: "https://images.pexels.com/photos/1797415/pexels-photo-1797415.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
};

const productSeed = [
  {
    name: "Compactor Storage Systems",
    slug: "compactor-storage-systems",
    category: "Space Optimization",
    shortDescription: "High-density movable storage engineered to recover floor area while keeping records and materials organized.",
    description: "Compactor systems consolidate storage bays onto guided mobile bases, opening an access aisle only where it is needed. Layouts are configured around room dimensions, retrieval frequency and load profile.",
    longDescription: "Suitable for records, files, components and controlled-access inventories, compactor storage helps use available floor area more deliberately. Rack & Stack plans the rail layout, bay configuration, safety features and enclosure options around your operating environment.",
    image: images.shelving,
    features: [
      ["Space utilization", "Movable bays reduce the number of permanently open aisles."],
      ["Controlled access", "Locking and enclosure options help organize sensitive inventory."],
      ["Configured layout", "Bay dimensions and internals are planned for the stored material."],
      ["Guided movement", "Rail-guided bases support smooth, aligned operation."],
    ],
    specifications: [["System type", "Manual / mechanically assisted options"], ["Bay configuration", "Single or double-sided"], ["Shelving", "Adjustable to application"], ["Finish", "Application-specific powder coating options"]],
    applications: ["Archives and records", "Office files", "Libraries", "Healthcare records", "Component storage"],
  },
  {
    name: "Mobile Shelving Racks",
    slug: "mobile-shelving-racks",
    category: "Space Optimization",
    shortDescription: "Mobile shelving layouts that increase storage density without compromising day-to-day access.",
    description: "Shelving bays mounted on mobile carriages make better use of compact rooms and controlled storage zones. Each design responds to item dimensions, access patterns and available clearances.",
    longDescription: "Mobile shelving can support records, boxed inventory, spare parts and lightweight materials. System geometry, operating method and aisle planning are selected after reviewing the room and workflow.",
    image: images.racks,
    features: [["Higher density", "Reduce fixed aisle requirements in compact storage rooms."], ["Direct retrieval", "Open the working aisle at the required bay."], ["Flexible internals", "Adjustable shelves accommodate changing storage needs."], ["Orderly operation", "Clearly structured bays improve location discipline."]],
    specifications: [["Operation", "Manual mobile carriage"], ["Shelves", "Adjustable"], ["Access", "Single working aisle"], ["Layout", "Configured to room dimensions"]],
    applications: ["Records rooms", "Libraries", "Parts stores", "Back-office storage", "Institutional storage"],
  },
  {
    name: "Heavy Duty Long Span Racks",
    slug: "heavy-duty-long-span-racks",
    category: "Industrial Racking",
    shortDescription: "Versatile hand-loaded storage for cartons, bins, tools and bulky inventory across wide shelf spans.",
    description: "Long span racking bridges the gap between light shelving and pallet racking. Beam levels and shelf media are selected around unit load, span and picking method.",
    longDescription: "Designed for manually handled goods that need clear, accessible shelf space, long span racks can be configured as single bays, continuous runs or multi-level picking systems where engineering conditions permit.",
    image: images.longspan,
    features: [["Wide clear spans", "Store bulky cartons and irregular items with fewer uprights."], ["Adjustable levels", "Reconfigure beam elevations as inventory changes."], ["Manual picking", "Clear product visibility supports piece and carton picking."], ["Expandable runs", "Add compatible bays as operational demand develops."]],
    specifications: [["Loading", "Hand-loaded; project-specific capacity"], ["Levels", "Adjustable beam levels"], ["Shelf media", "Steel panels / application-specific decking"], ["Configuration", "Single or double-sided runs"]],
    applications: ["Spare parts", "Carton storage", "Tool rooms", "Distribution picking", "Maintenance stores"],
  },
  {
    name: "Heavy Duty Pallet Racking",
    slug: "heavy-duty-pallet-racking",
    category: "Industrial Racking",
    shortDescription: "Engineered pallet storage planned around load units, handling equipment and warehouse throughput.",
    description: "Pallet racking provides direct access to palletized inventory and can be configured around aisle widths, lift heights, pallet geometry and operational selectivity.",
    longDescription: "Every pallet rack layout should start with verified load and handling data. Rack & Stack reviews pallet dimensions, unit weights, building constraints, material flow and equipment interfaces before defining the system configuration.",
    image: images.hero,
    features: [["Direct access", "Selective layouts provide clear access to stored pallets."], ["Vertical utilization", "Plan beam levels around available clear height and lift capability."], ["Operational fit", "Aisles and bays respond to the material handling workflow."], ["Future adaptability", "Adjustable beam elevations help accommodate inventory changes."], ["Defined load design", "Components are selected against declared loading conditions."], ["Safety integration", "Protection and load signage can be incorporated into the proposal."]],
    specifications: [["Unit load", "Designed from declared pallet weight and geometry"], ["Beam levels", "Project-specific and adjustable"], ["Aisle width", "Matched to handling equipment"], ["Accessories", "Protection, decking and guides as required"]],
    applications: ["Warehouse pallet storage", "Manufacturing buffer stock", "Distribution centers", "FMCG storage", "Automotive components"],
  },
  {
    name: "Medium Duty Shelving Racks",
    slug: "medium-duty-shelving-racks",
    category: "Industrial Racking",
    shortDescription: "Adjustable shelving for organized manual picking of cartons, bins, components and packaged goods.",
    description: "Medium duty shelving provides structured, accessible locations for manually handled inventory. Shelf size, spacing and loading are configured around product dimensions and picking practice.",
    longDescription: "The modular format supports storerooms, workshops and fulfillment environments where stock visibility and flexible shelf positions are important.",
    image: images.warehouse,
    features: [["Accessible picking", "Open shelf faces support quick item identification."], ["Adjustable shelves", "Level spacing can evolve with the stored inventory."], ["Modular bays", "Create orderly runs suited to the available room."], ["Application-led design", "Shelf depth and loading reflect actual stock profiles."]],
    specifications: [["Loading", "Manual handling; project-specific shelf load"], ["Levels", "Adjustable"], ["Access", "Single / double-sided"], ["Finish", "Powder-coated options"]],
    applications: ["Component storage", "Retail backrooms", "Workshop stores", "Carton picking", "E-commerce inventory"],
  },
  {
    name: "Mezzanine Floor",
    slug: "mezzanine-floor",
    category: "Space Optimization",
    shortDescription: "Engineered intermediate floors that convert usable clear height into additional operational space.",
    description: "A mezzanine can create storage, working or support space within an existing building footprint. Column grid, access, loading and interfaces must be developed from site and structural inputs.",
    longDescription: "Rack & Stack coordinates layout intent, intended use, access points and integration requirements. Final scope is developed against site measurements, declared loading and applicable project requirements.",
    image: images.forklift,
    features: [["Use available height", "Create an additional working level within suitable buildings."], ["Configured column grid", "Plan supports around ground-floor movement and storage."], ["Integrated access", "Stairs, gates and edge protection can be scoped with the platform."], ["Project-led engineering", "The structure responds to intended use and declared loads."]],
    specifications: [["Platform area", "Project-specific"], ["Design load", "Defined from intended use"], ["Access", "Stair and loading gate options"], ["Floor finish", "Application-specific options"]],
    applications: ["Additional storage", "Picking floors", "Production support areas", "Packing zones", "Maintenance stores"],
  },
  {
    name: "Slotted Angle Racks",
    slug: "slotted-angle-racks",
    category: "Workplace Storage",
    shortDescription: "Practical modular shelving for lightweight goods, records, spare parts and everyday stockrooms.",
    description: "Slotted angle construction allows flexible bay dimensions and shelf positions for straightforward storage requirements.",
    longDescription: "A dependable option for compact stockrooms and service areas, these systems can be planned as individual bays or connected runs with shelf spacing matched to the contents.",
    image: images.aisle,
    features: [["Simple modular format", "Adapt bay arrangements to practical storage rooms."], ["Adjustable spacing", "Set shelf elevations around varied item heights."], ["Easy organization", "Create clear locations for small and medium items."], ["Broad utility", "Suitable for commercial and industrial back-of-house use."]],
    specifications: [["Construction", "Slotted angle frame"], ["Shelves", "Adjustable steel panels"], ["Configuration", "Open or enclosed options"], ["Dimensions", "Project-specific"]],
    applications: ["General stores", "Records", "Spare parts", "Office supplies", "Workshop inventory"],
  },
  {
    name: "Lockers",
    slug: "lockers",
    category: "Workplace Storage",
    shortDescription: "Durable compartment storage configured for workplaces, institutions and staff facilities.",
    description: "Locker banks provide secure, assigned storage for personal items, tools, uniforms or controlled materials. Compartment layouts and locking options are selected for the use case.",
    longDescription: "From staff changing areas to equipment issue points, locker configurations can be adapted around compartment count, ventilation, identification and access control requirements.",
    image: images.shelving,
    features: [["Assigned storage", "Individual compartments keep personal or issued items organized."], ["Configuration choice", "Select door count and compartment proportions for the application."], ["Locking options", "Plan access control around workplace policy."], ["Durable finish", "Choose finishes appropriate to the operating environment."]],
    specifications: [["Compartments", "Single and multi-door options"], ["Locking", "Project-specific options"], ["Ventilation", "Available where required"], ["Finish", "Powder-coated options"]],
    applications: ["Staff facilities", "Factories", "Offices", "Institutions", "Tool control"],
  },
];

const serviceSeed = [
  ["Storage Planning", "storage-planning", "Turn operational requirements into a clear storage strategy before equipment is specified.", "We review inventory profiles, access frequency, growth needs and facility constraints to define an appropriate storage approach.", "ClipboardList"],
  ["Site Survey", "site-survey", "Capture the dimensions, constraints and interfaces that shape a dependable storage layout.", "A site review helps establish usable space, access, columns, services and operational conditions relevant to system planning.", "ScanLine"],
  ["Rack Design", "rack-design", "Configure storage geometry around declared loads, units and handling practices.", "The design process aligns bay dimensions, levels, accessories and protection with the intended storage operation.", "DraftingCompass"],
  ["Warehouse Layout Planning", "warehouse-layout-planning", "Coordinate storage, aisles and workflows for clear, efficient material movement.", "Layout planning considers receiving, put-away, picking, replenishment and dispatch instead of treating racks in isolation.", "Workflow"],
  ["Installation", "installation", "Structured on-site assembly and handover coordinated with the project environment.", "Installation planning covers sequencing, access, interfaces and basic handover information for the agreed system scope.", "HardHat"],
  ["Warehouse Optimization", "warehouse-optimization", "Review existing space and storage practices to identify practical improvement opportunities.", "We examine capacity, accessibility and movement patterns to recommend system or layout changes aligned with operations.", "ChartNoAxesCombined"],
  ["Customized Storage Solutions", "customized-storage-solutions", "Develop configurations for inventory or spaces that do not fit a standard catalogue answer.", "Custom work begins with dimensions, loads, retrieval needs and site conditions, followed by a considered system proposal.", "Settings2"],
  ["After-Sales Support", "after-sales-support", "Practical support for questions and agreed follow-up requirements after handover.", "Support scope is coordinated around the supplied system and may include operational guidance or review of change requirements.", "Headset"],
] as const;

const industrySeed = [
  ["Warehousing", "warehousing", "Storage systems that coordinate pallet capacity, picking access and material movement."],
  ["Manufacturing", "manufacturing", "Organized storage for raw materials, work-in-progress, tools and finished goods."],
  ["Automotive", "automotive", "Flexible locations for components, assemblies, spares and line-side inventory."],
  ["Pharmaceuticals", "pharmaceuticals", "Structured storage layouts supporting organized inventory handling and controlled workflows."],
  ["E-commerce", "ecommerce", "Pick-facing storage for broad SKU ranges and changing order profiles."],
  ["Retail", "retail", "Accessible back-of-house storage for cartons, replenishment stock and supplies."],
  ["FMCG", "fmcg", "Pallet and carton storage planned around inventory movement and selectivity."],
  ["Logistics", "logistics", "Adaptable storage layouts for receiving, staging, picking and dispatch operations."],
  ["Engineering", "engineering", "Storage for tools, components, consumables and irregular industrial items."],
  ["Office & Corporate", "office-corporate", "Compact records, locker and workplace storage systems."],
  ["Archives & Records", "archives-records", "High-density, organized retrieval for files, documents and record boxes."],
  ["Distribution Centers", "distribution-centers", "Coordinated pallet and picking systems for multi-stage fulfillment workflows."],
] as const;

async function seed() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@rackandstack.in").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe!RackStack2026";
  const passwordHash = await hash(adminPassword, 12);
  await db.insert(users).values({ name: "Rack & Stack Administrator", email: adminEmail, passwordHash, role: "SUPER_ADMIN" }).onConflictDoUpdate({ target: users.email, set: { passwordHash, isActive: true, updatedAt: new Date() } });

  if (Number((await db.select({ count: sql<number>`count(*)` }).from(siteSettings))[0].count) === 0) {
    await db.insert(siteSettings).values({
      companyName: "Rack & Stack Storage Systems Pvt. Ltd.",
      primaryPhone: "+91 97692 67792",
      secondaryPhone: "+91 81698 26744",
      whatsapp: "+91 97692 67792",
      email: "info@rackandstack.in",
      address: "Sr. No. 94/1, Umar Compound, Sopara Phata, Vasai-Virar, Maharashtra 401208",
      workingHours: "Monday–Friday, 9:00 AM–6:00 PM",
      footerContent: "Engineered storage systems designed around space, load requirements and operational workflow.",
      copyright: "Rack & Stack Storage Systems Pvt. Ltd. All rights reserved.",
      socialLinks: {},
    });
  }

  if (Number((await db.select({ count: sql<number>`count(*)` }).from(seoSettings))[0].count) === 0) {
    await db.insert(seoSettings).values({
      siteTitle: "Rack & Stack Storage Systems",
      defaultMetaDescription: "Industrial racking, shelving, mezzanine and customized storage systems planned around your facility and workflow.",
      keywords: "industrial storage systems, warehouse racking, pallet racking, shelving systems, mezzanine floor",
      canonicalBaseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      organizationSchema: { "@type": "Organization", name: "Rack & Stack Storage Systems Pvt. Ltd." },
      socialLinks: {},
    });
  }

  let productRows = await db.select().from(products);
  if (productRows.length === 0) {
    for (let i = 0; i < productSeed.length; i++) {
      const item = productSeed[i];
      const [product] = await db.insert(products).values({
        name: item.name, slug: item.slug, category: item.category, shortDescription: item.shortDescription,
        description: item.description, longDescription: item.longDescription, featured: i < 6, status: "PUBLISHED",
        displayOrder: i, heroImage: item.image, thumbnail: item.image,
        metaTitle: `${item.name} | Rack & Stack`, metaDescription: item.shortDescription,
        keywords: `${item.name}, industrial storage systems`, focusKeyword: item.name.toLowerCase(),
      }).returning();
      await db.insert(productFeatures).values(item.features.map(([title, description], displayOrder) => ({ productId: product.id, title, description, displayOrder })));
      await db.insert(productSpecifications).values(item.specifications.map(([specificationName, specificationValue], displayOrder) => ({ productId: product.id, specificationName, specificationValue, displayOrder })));
      await db.insert(productApplications).values(item.applications.map((application, displayOrder) => ({ productId: product.id, application, displayOrder })));
      await db.insert(productImages).values([
        { productId: product.id, imageUrl: item.image, altText: `${item.name} storage system`, displayOrder: 0 },
        { productId: product.id, imageUrl: images.installation, altText: `Warehouse team working with ${item.name.toLowerCase()}`, displayOrder: 1 },
      ]);
    }
    productRows = await db.select().from(products);
  }

  let serviceRows = await db.select().from(services);
  if (serviceRows.length === 0) {
    for (let i = 0; i < serviceSeed.length; i++) {
      const [name, slug, shortDescription, description, icon] = serviceSeed[i];
      const [service] = await db.insert(services).values({
        name, slug, shortDescription, description, icon, heroImage: i % 2 ? images.installation : images.racks,
        featured: i < 6, status: "PUBLISHED", displayOrder: i,
        process: [{ title: "Understand", description: "Capture the operating requirement and constraints." }, { title: "Develop", description: "Prepare the appropriate system or layout response." }, { title: "Coordinate", description: "Align scope, interfaces and implementation." }],
        deliverables: ["Requirement review", "Recommended approach", "Defined project scope"],
        metaTitle: `${name} | Rack & Stack`, metaDescription: shortDescription,
      }).returning();
      await db.insert(serviceFeatures).values([
        { serviceId: service.id, title: "Requirement-led", description: "The work starts with your operating context, not a preset answer.", displayOrder: 0 },
        { serviceId: service.id, title: "Clear coordination", description: "Scope and important interfaces are defined before execution.", displayOrder: 1 },
        { serviceId: service.id, title: "Practical outcome", description: "Recommendations are shaped around real space and workflow constraints.", displayOrder: 2 },
      ]);
    }
    serviceRows = await db.select().from(services);
  }

  if (Number((await db.select({ count: sql<number>`count(*)` }).from(industries))[0].count) === 0) {
    await db.insert(industries).values(industrySeed.map(([name, slug, shortDescription], displayOrder) => ({
      name, slug, shortDescription, description: `${name} environments need storage decisions based on inventory profile, access frequency, material handling and available space. We develop appropriate configurations from these operational inputs.`,
      challenges: ["Balancing capacity with accessibility", "Maintaining clear material flow", "Adapting to changing inventory profiles"],
      benefits: ["Better organized locations", "More deliberate use of space", "Layouts aligned with handling workflows"],
      heroImage: displayOrder % 2 ? images.warehouse : images.hero, status: "PUBLISHED" as const, featured: displayOrder < 8, displayOrder,
      metaTitle: `Storage Solutions for ${name} | Rack & Stack`, metaDescription: shortDescription,
    })));
  }

  const industryRows = await db.select().from(industries);
  const productBySlug = new Map(productRows.map((row) => [row.slug, row]));
  const industryBySlug = new Map(industryRows.map((row) => [row.slug, row]));
  const relatedMap: Record<string, string[]> = {
    "compactor-storage-systems": ["mobile-shelving-racks", "medium-duty-shelving-racks"],
    "mobile-shelving-racks": ["compactor-storage-systems", "slotted-angle-racks"],
    "heavy-duty-long-span-racks": ["heavy-duty-pallet-racking", "medium-duty-shelving-racks", "mezzanine-floor"],
    "heavy-duty-pallet-racking": ["heavy-duty-long-span-racks", "mezzanine-floor", "medium-duty-shelving-racks"],
    "medium-duty-shelving-racks": ["heavy-duty-long-span-racks", "slotted-angle-racks"],
    "mezzanine-floor": ["heavy-duty-pallet-racking", "heavy-duty-long-span-racks"],
    "slotted-angle-racks": ["medium-duty-shelving-racks", "lockers"],
    lockers: ["slotted-angle-racks", "mobile-shelving-racks"],
  };
  for (const [sourceSlug, relatedSlugs] of Object.entries(relatedMap)) {
    const source = productBySlug.get(sourceSlug);
    if (!source) continue;
    for (let displayOrder = 0; displayOrder < relatedSlugs.length; displayOrder++) {
      const related = productBySlug.get(relatedSlugs[displayOrder]);
      if (related) await db.insert(productRelatedProducts).values({ productId: source.id, relatedProductId: related.id, displayOrder }).onConflictDoNothing();
    }
  }

  const productIndustryMap: Record<string, string[]> = {
    "compactor-storage-systems": ["archives-records", "office-corporate", "pharmaceuticals"],
    "mobile-shelving-racks": ["archives-records", "office-corporate", "retail"],
    "heavy-duty-long-span-racks": ["manufacturing", "automotive", "engineering", "ecommerce"],
    "heavy-duty-pallet-racking": ["warehousing", "logistics", "fmcg", "distribution-centers", "manufacturing"],
    "medium-duty-shelving-racks": ["ecommerce", "retail", "engineering", "manufacturing"],
    "mezzanine-floor": ["warehousing", "manufacturing", "logistics", "ecommerce"],
    "slotted-angle-racks": ["engineering", "retail", "office-corporate"],
    lockers: ["manufacturing", "office-corporate", "engineering"],
  };
  for (const [productSlug, industrySlugs] of Object.entries(productIndustryMap)) {
    const product = productBySlug.get(productSlug);
    if (!product) continue;
    for (let displayOrder = 0; displayOrder < industrySlugs.length; displayOrder++) {
      const industry = industryBySlug.get(industrySlugs[displayOrder]);
      if (industry) await db.insert(productIndustries).values({ productId: product.id, industryId: industry.id, displayOrder }).onConflictDoNothing();
    }
  }

  const defaultServiceIndustries = ["warehousing", "manufacturing", "logistics", "ecommerce", "engineering"];
  for (const service of serviceRows) {
    for (const industrySlug of defaultServiceIndustries) {
      const industry = industryBySlug.get(industrySlug);
      if (industry) await db.insert(serviceIndustries).values({ serviceId: service.id, industryId: industry.id }).onConflictDoNothing();
    }
  }

  const sections = [
    { sectionKey: "hero", title: "SMART STORAGE. ENGINEERED FOR PERFORMANCE.", subtitle: "Designing and delivering intelligent storage systems that help businesses maximize space, improve workflow and scale efficiently.", displayOrder: 0, content: { eyebrow: "Industrial storage systems", highlight: "ENGINEERED FOR PERFORMANCE.", primaryCta: "Explore Solutions", secondaryCta: "Request a Quote", tertiaryCta: "Talk to an Expert", image: images.hero, badge: "Planned around your operation" } },
    { sectionKey: "trust", title: "Capability, without unsupported claims", subtitle: "Every recommendation begins with the space, load and workflow information you provide.", displayOrder: 1, content: { metrics: [{ value: "Site-led", label: "Planning" }, { value: "Load-led", label: "Configuration" }, { value: "Workflow-led", label: "Layout" }, { value: "End-to-end", label: "Coordination" }] } },
    { sectionKey: "about", title: "Storage is an operational system—not just steel.", subtitle: "Rack & Stack supports storage requirements from site review and layout planning through supply, installation coordination and after-sales support.", displayOrder: 2, content: { image: images.aisle, cta: "How we work" } },
    { sectionKey: "why", title: "Designed around real constraints", subtitle: "A disciplined approach to space, load, access and implementation.", displayOrder: 4, content: { cards: [{ title: "Application-first", description: "We start with what is stored and how it moves." }, { title: "Space-aware", description: "Layouts respond to the building, services and handling clearances." }, { title: "Defined loading", description: "System selection is informed by declared load data." }, { title: "Coordinated execution", description: "Site interfaces and installation requirements are considered early." }] } },
    { sectionKey: "process", title: "From requirement to working system", subtitle: "A clear path keeps decisions aligned from first conversation to handover.", displayOrder: 8, content: { steps: [{ number: "01", title: "Discover", description: "Requirement, inventory and workflow review" }, { number: "02", title: "Survey", description: "Site dimensions and constraints" }, { number: "03", title: "Design", description: "System selection and layout development" }, { number: "04", title: "Deliver", description: "Supply and installation coordination" }] } },
    { sectionKey: "manufacturing", title: "Built for the specified application", subtitle: "Material selection, fabrication and finish are coordinated with the agreed system design and project scope.", displayOrder: 9, content: { image: images.installation, cta: "Discuss your requirement" } },
    { sectionKey: "cta", title: "Planning a new warehouse or improving an existing one?", subtitle: "Share your space, inventory and handling requirements. Our team will help identify the right next step.", displayOrder: 14, content: { primaryCta: "Request a Quote", secondaryCta: "Call +91 97692 67792" } },
  ];
  for (const section of sections) await db.insert(homepageSections).values(section).onConflictDoNothing();

  if (Number((await db.select({ count: sql<number>`count(*)` }).from(gallery))[0].count) === 0) {
    await db.insert(gallery).values([
      ["Pallet storage aisle", "Racking", images.hero, "Palletized inventory stored in a warehouse racking aisle"],
      ["Industrial shelving", "Shelving", images.shelving, "Industrial metal shelving in a clean warehouse"],
      ["Warehouse layout", "Warehouse", images.warehouse, "Wide warehouse layout with organized storage"],
      ["Storage installation", "Installation", images.installation, "Warehouse team coordinating storage installation"],
      ["Long-span storage", "Racking", images.longspan, "Wide-span industrial storage for long materials"],
      ["Material handling", "Warehouse", images.forklift, "Forklift in an industrial warehouse environment"],
    ].map(([title, category, imageUrl, altText], displayOrder) => ({ title, category, imageUrl, altText, displayOrder, status: "PUBLISHED" as const })));
  }

  if (Number((await db.select({ count: sql<number>`count(*)` }).from(clients))[0].count) === 0) {
    await db.insert(clients).values(["Bank of America", "Knight Frank", "Jaslok Hospital", "Mumbai Metro", "Eaton", "IDBI Bank", "Allcargo Logistics", "Schindler"].map((name, displayOrder) => ({ name, featured: true, displayOrder })));
  }

  if (Number((await db.select({ count: sql<number>`count(*)` }).from(clientLogos))[0].count) === 0) {
    await db.insert(clientLogos).values(["Bank of America", "Knight Frank", "Jaslok Hospital", "Mumbai Metro", "Eaton", "IDBI Bank", "Allcargo Logistics", "Schindler"].map((name, index) => ({ name, imageUrl: "", altText: `${name} logo`, sortOrder: index + 1, isActive: true })));
  }

  const aboutContent = "Rack & Stack Storage Systems works across industrial storage, shelving, mezzanine, material handling and workplace storage requirements. Our approach begins with the site, stored items, declared loads and operational workflow. From there, we coordinate an appropriate layout and system scope, followed by supply, installation coordination and after-sales support.\n\nWe believe storage performs best when capacity, accessibility, safety considerations and future change are considered together.";
  const pageSeed = [
    { title: "About Rack & Stack", slug: "about", heroTitle: "Storage expertise shaped around your operation.", heroDescription: "From site review to system implementation, we help translate storage requirements into practical solutions.", heroImage: images.racks, content: aboutContent, metaTitle: "About Rack & Stack Storage Systems", metaDescription: "Learn about Rack & Stack's requirement-led approach to industrial storage planning and implementation." },
    { title: "Privacy Policy", slug: "privacy-policy", heroTitle: "Privacy Policy", heroDescription: "How information submitted through this website is handled.", content: "Information submitted through our forms is used to respond to enquiries, prepare requested communications and operate this website. We do not sell personal information. Contact us at info@rackandstack.in for privacy questions or requests.", metaTitle: "Privacy Policy | Rack & Stack", metaDescription: "Rack & Stack website privacy policy." },
    { title: "Terms and Conditions", slug: "terms-and-conditions", heroTitle: "Terms and Conditions", heroDescription: "General terms governing use of this website.", content: "Website content is provided for general information. Product configuration, loading and project scope must be confirmed in a formal proposal. Images may be illustrative. Do not rely on website content as engineering approval for a specific installation.", metaTitle: "Terms and Conditions | Rack & Stack", metaDescription: "Terms governing use of the Rack & Stack website." },
    { title: "Cookie Policy", slug: "cookie-policy", heroTitle: "Cookie Policy", heroDescription: "Information about essential and optional website storage.", content: "This website uses essential storage for secure sessions and preference storage. Optional analytics should only be enabled after consent where configured.", metaTitle: "Cookie Policy | Rack & Stack", metaDescription: "Rack & Stack website cookie policy." },
  ];
  for (const page of pageSeed) await db.insert(pages).values({ ...page, status: "PUBLISHED" }).onConflictDoNothing();

  if (Number((await db.select({ count: sql<number>`count(*)` }).from(blogCategories))[0].count) === 0) {
    const cats = await db.insert(blogCategories).values([
      { name: "Warehouse Optimization", slug: "warehouse-optimization" },
      { name: "Storage Systems", slug: "storage-systems" },
      { name: "Safety", slug: "safety" },
      { name: "Space Planning", slug: "space-planning" },
      { name: "Industry Guides", slug: "industry-guides" },
    ]).returning();
    await db.insert(blogPosts).values([
      { title: "What to prepare before requesting a pallet racking layout", slug: "prepare-for-pallet-racking-layout", excerpt: "The information that helps a storage partner develop a more relevant first proposal.", content: "A useful pallet racking brief starts with pallet dimensions, maximum unit weight, SKU and quantity data, handling equipment, building drawings and expected workflows. Clear inputs reduce assumptions and help the proposed layout reflect actual operations.\n\nAlso record sprinkler, lighting, column, door and service constraints. Final designs should be reviewed against the complete project context.", categoryId: cats[0].id, featuredImage: images.hero, status: "PUBLISHED", featured: true, publishedAt: new Date(), metaTitle: "Preparing for a Pallet Racking Layout", metaDescription: "Key information to gather before requesting a warehouse pallet racking layout." },
      { title: "Storage density versus accessibility: finding the right balance", slug: "storage-density-versus-accessibility", excerpt: "Why the layout with the most positions is not automatically the best operational answer.", content: "Storage capacity matters, but so do selectivity, replenishment, travel distance and handling equipment. A high-density format may suit reserve stock while direct-access shelving may be better for fast-moving items.\n\nA sound plan segments inventory and chooses storage methods for each movement profile rather than forcing every item into one system.", categoryId: cats[1].id, featuredImage: images.aisle, status: "PUBLISHED", publishedAt: new Date(), metaTitle: "Storage Density vs Accessibility", metaDescription: "How to balance warehouse storage capacity with practical inventory access." },
    ]);
  }

  if (Number((await db.select({ count: sql<number>`count(*)` }).from(faqs))[0].count) === 0) {
    await db.insert(faqs).values([
      { question: "What information is needed for a storage system proposal?", answer: "Share available dimensions, item or pallet sizes, maximum loads, quantities, access frequency, handling equipment and any building constraints. A site survey can help confirm important details.", entityType: "GLOBAL", displayOrder: 0 },
      { question: "Can a system be configured for an existing warehouse?", answer: "Yes. Existing columns, clear height, doors, services, circulation and current operations are reviewed before a suitable layout is proposed.", entityType: "GLOBAL", displayOrder: 1 },
      { question: "How is storage capacity determined?", answer: "Capacity depends on item geometry, declared load, system type, aisle requirements, handling equipment and the usable building envelope. It should be calculated from project-specific inputs.", entityType: "GLOBAL", displayOrder: 2 },
      { question: "Do you support installation?", answer: "Installation coordination is available as part of the agreed project scope. Site readiness and interfaces are reviewed before scheduling.", entityType: "GLOBAL", displayOrder: 3 },
    ]);
  }

  console.log(`Seed complete. Admin email: ${adminEmail}${process.env.ADMIN_PASSWORD ? "" : " (development password fallback was used)"}`);
}

seed().catch((error) => { console.error("Seed failed", error); process.exitCode = 1; }).finally(async () => { await pool.end(); });
