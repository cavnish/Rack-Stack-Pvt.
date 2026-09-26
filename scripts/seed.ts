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
  homeSliders,
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
  siteHero: "/Hero.jpeg",
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
    shortDescription: "Space-saving movable storage that frees up floor space and keeps your records tidy.",
    description: "Compactor systems place storage bays on movable bases, so an aisle opens only where you need it. We plan the layout around your room, how often you retrieve items and your load weight.",
    longDescription: "Great for records, files, components and stock that needs controlled access. Rack & Stack plans the rails, bays, safety features and enclosures to fit your space.",
    image: images.shelving,
    features: [
      ["Saves Space", "Fewer open aisles means more room for storage."],
      ["Secure Access", "Locks and enclosures help protect sensitive stock."],
      ["Custom Layout", "Bays and shelves are planned around what you store."],
      ["Smooth Movement", "Rail-guided bases make opening and closing easy."],
    ],
    specifications: [["System type", "Manual / mechanically assisted options"], ["Bay configuration", "Single or double-sided"], ["Shelving", "Adjustable to application"], ["Finish", "Application-specific powder coating options"]],
    applications: ["Archives and records", "Office files", "Libraries", "Healthcare records", "Component storage"],
  },
  {
    name: "Mobile Shelving Racks",
    slug: "mobile-shelving-racks",
    category: "Space Optimization",
    shortDescription: "Store more in less space — without making daily access harder.",
    description: "Shelving on mobile carriages makes better use of small rooms. Each design fits your item sizes, access needs and available space.",
    longDescription: "Mobile shelving works well for records, boxed stock, spare parts and light materials. We choose the layout and operating method after reviewing your room and workflow.",
    image: images.racks,
    features: [["Store More", "Needs fewer fixed aisles in small rooms."], ["Easy Access", "Open an aisle right where you need it."], ["Adjustable Shelves", "Move shelves up or down as your needs change."], ["Neat and Organized", "Clear bays make it easy to find things."]],
    specifications: [["Operation", "Manual mobile carriage"], ["Shelves", "Adjustable"], ["Access", "Single working aisle"], ["Layout", "Configured to room dimensions"]],
    applications: ["Records rooms", "Libraries", "Parts stores", "Back-office storage", "Institutional storage"],
  },
  {
    name: "Heavy Duty Long Span Racks",
    slug: "heavy-duty-long-span-racks",
    category: "Industrial Racking",
    shortDescription: "Strong hand-loaded racks for cartons, bins, tools and bulky items.",
    description: "Long span racking sits between light shelving and pallet racking. We choose beam levels and shelves based on your load, width and picking method.",
    longDescription: "Made for items you pick by hand that need clear, easy shelf space. Long span racks can be set up as single bays, long runs or multi-level picking systems.",
    image: images.longspan,
    features: [["Wide Spans", "Store big cartons and odd shapes with fewer uprights."], ["Adjustable Levels", "Change beam heights as your stock changes."], ["Easy Picking", "Clear shelves make items quick to find."], ["Easy to Expand", "Add more bays as your business grows."]],
    specifications: [["Loading", "Hand-loaded; project-specific capacity"], ["Levels", "Adjustable beam levels"], ["Shelf media", "Steel panels / application-specific decking"], ["Configuration", "Single or double-sided runs"]],
    applications: ["Spare parts", "Carton storage", "Tool rooms", "Distribution picking", "Maintenance stores"],
  },
  {
    name: "Heavy Duty Pallet Racking",
    slug: "heavy-duty-pallet-racking",
    category: "Industrial Racking",
    shortDescription: "Strong pallet racking planned around your loads, equipment and warehouse flow.",
    description: "Pallet racking gives you direct access to every pallet. We plan aisle widths, lift heights and pallet sizes around your operation.",
    longDescription: "Every pallet rack layout starts with real load and handling data. We check pallet sizes, weights, building limits, stock flow and equipment before deciding on the system.",
    image: images.hero,
    features: [["Direct Access", "Every pallet is easy to reach."], ["Uses Height Well", "Beam levels use your available height and lift equipment."], ["Fits Your Workflow", "Aisles and bays match how your team moves goods."], ["Easy to Adjust", "Move beams as your inventory changes."], ["Built for Your Load", "Every part is chosen for your declared load weights."], ["Safety Built In", "Protection and load signs can be included."]],
    specifications: [["Unit load", "Designed from declared pallet weight and geometry"], ["Beam levels", "Project-specific and adjustable"], ["Aisle width", "Matched to handling equipment"], ["Accessories", "Protection, decking and guides as required"]],
    applications: ["Warehouse pallet storage", "Manufacturing buffer stock", "Distribution centers", "FMCG storage", "Automotive components"],
  },
  {
    name: "Medium Duty Shelving Racks",
    slug: "medium-duty-shelving-racks",
    category: "Industrial Racking",
    shortDescription: "Adjustable shelving for easy hand-picking of cartons, bins and parts.",
    description: "Medium duty shelving gives your hand-picked stock a clear, organized home. Shelf size, spacing and loading fit your products and picking style.",
    longDescription: "The flexible design suits storerooms, workshops and fulfillment areas where you need to see stock clearly and move shelves easily.",
    image: images.warehouse,
    features: [["Easy Picking", "Open shelves make items quick to spot."], ["Adjustable Shelves", "Change spacing as your stock changes."], ["Modular Design", "Build neat runs that fit your room."], ["Made for Your Stock", "Shelf depth and loading match what you store."]],
    specifications: [["Loading", "Manual handling; project-specific shelf load"], ["Levels", "Adjustable"], ["Access", "Single / double-sided"], ["Finish", "Powder-coated options"]],
    applications: ["Component storage", "Retail backrooms", "Workshop stores", "Carton picking", "E-commerce inventory"],
  },
  {
    name: "Mezzanine Floor",
    slug: "mezzanine-floor",
    category: "Space Optimization",
    shortDescription: "Extra floors that turn empty height into usable space.",
    description: "A mezzanine adds storage, workspace or support areas inside your existing building. We plan columns, access and loading around your site and structure.",
    longDescription: "We plan the layout, intended use, access points and how everything fits together. The final scope is based on site measurements, declared loads and your project needs.",
    image: images.forklift,
    features: [["Use Your Height", "Add another working level in suitable buildings."], ["Smart Column Layout", "Supports are planned around ground-floor movement and storage."], ["Safe Access", "Stairs, gates and edge protection are included as needed."], ["Built for Your Use", "The structure is designed for your intended use and loads."]],
    specifications: [["Platform area", "Project-specific"], ["Design load", "Defined from intended use"], ["Access", "Stair and loading gate options"], ["Floor finish", "Application-specific options"]],
    applications: ["Additional storage", "Picking floors", "Production support areas", "Packing zones", "Maintenance stores"],
  },
  {
    name: "Slotted Angle Racks",
    slug: "slotted-angle-racks",
    category: "Workplace Storage",
    shortDescription: "Simple, practical shelving for light items, records and everyday stockrooms.",
    description: "Slotted angle design allows flexible bay sizes and shelf positions for simple storage needs.",
    longDescription: "A reliable choice for small stockrooms and service areas. Set them up as single bays or connected runs, with shelf spacing to match your items.",
    image: images.aisle,
    features: [["Simple Design", "Bays fit neatly into practical storage rooms."], ["Adjustable Shelves", "Set shelf heights for different item sizes."], ["Easy to Organize", "Clear spots for small and medium items."], ["Highly Versatile", "Works in commercial and industrial back rooms."]],
    specifications: [["Construction", "Slotted angle frame"], ["Shelves", "Adjustable steel panels"], ["Configuration", "Open or enclosed options"], ["Dimensions", "Project-specific"]],
    applications: ["General stores", "Records", "Spare parts", "Office supplies", "Workshop inventory"],
  },
  {
    name: "Lockers",
    slug: "lockers",
    category: "Workplace Storage",
    shortDescription: "Tough lockers for workplaces, staff areas and institutions.",
    description: "Locker banks give each person a secure space for personal items, tools, uniforms or controlled materials. We choose the layout and locks to suit your needs.",
    longDescription: "From staff changing rooms to equipment issue points, lockers can be adapted for compartment count, ventilation, labels and access control.",
    image: images.shelving,
    features: [["Personal Space", "Individual compartments keep everyone's items organized."], ["Flexible Setup", "Choose door counts and compartment sizes for your use."], ["Locking Options", "Locks to match your workplace rules."], ["Tough Finish", "Finishes that suit your working environment."]],
    specifications: [["Compartments", "Single and multi-door options"], ["Locking", "Project-specific options"], ["Ventilation", "Available where required"], ["Finish", "Powder-coated options"]],
    applications: ["Staff facilities", "Factories", "Offices", "Institutions", "Tool control"],
  },
];

const serviceSeed = [
  ["Storage Planning", "storage-planning", "A clear storage plan before you buy anything.", "We look at your stock, space and growth plans, then suggest the right storage approach.", "ClipboardList"],
  ["Site Survey", "site-survey", "Accurate site details for a layout that fits.", "We measure your space and note columns, doors and access so the layout works on site.", "ScanLine"],
  ["Rack Design", "rack-design", "Rack designs made for your loads.", "We plan bay sizes, levels and accessories around your actual loads and handling method.", "DraftingCompass"],
  ["Warehouse Layout Planning", "warehouse-layout-planning", "A warehouse layout that flows well.", "We plan receiving, storage, picking and dispatch so goods move smoothly through your warehouse.", "Workflow"],
  ["Installation", "installation", "Clean, safe installation on site.", "Our team installs your system on schedule and hands it over ready to use.", "HardHat"],
  ["Warehouse Optimization", "warehouse-optimization", "Get more from your current warehouse.", "We review your space and storage habits, then suggest practical ways to improve.", "ChartNoAxesCombined"],
  ["Customized Storage Solutions", "customized-storage-solutions", "Custom storage for tricky spaces.", "If standard racks don't fit, we design a solution around your items, loads and site.", "Settings2"],
  ["After-Sales Support", "after-sales-support", "Support even after setup.", "We stay available for questions, changes and follow-up needs after installation.", "Headset"],
] as const;

const industrySeed = [
  ["Warehousing", "warehousing", "Storage that balances pallet space, picking access and smooth movement."],
  ["Manufacturing", "manufacturing", "Organized storage for raw materials, tools, work in progress and finished goods."],
  ["Automotive", "automotive", "Flexible storage for parts, spares and stock kept near the line."],
  ["Pharmaceuticals", "pharmaceuticals", "Well-organized storage that supports clean, controlled workflows."],
  ["E-commerce", "ecommerce", "Easy picking storage for large product ranges and changing orders."],
  ["Retail", "retail", "Easy back-of-house storage for cartons, restock items and supplies."],
  ["FMCG", "fmcg", "Pallet and carton storage planned around fast stock movement."],
  ["Logistics", "logistics", "Flexible storage for receiving, staging, picking and dispatch."],
  ["Engineering", "engineering", "Storage for tools, parts, consumables and odd-sized items."],
  ["Office & Corporate", "office-corporate", "Compact storage for records, lockers and office supplies."],
  ["Archives & Records", "archives-records", "Dense, organized storage for files, documents and record boxes."],
  ["Distribution Centers", "distribution-centers", "Pallet and picking systems that keep orders moving."],
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
      footerContent: "Strong, reliable storage systems planned around your space, loads and the way you work.",
      copyright: "Rack & Stack Storage Systems Pvt. Ltd. All rights reserved.",
      socialLinks: {},
    });
  }

  if (Number((await db.select({ count: sql<number>`count(*)` }).from(seoSettings))[0].count) === 0) {
    await db.insert(seoSettings).values({
      siteTitle: "Rack & Stack Storage Systems",
      defaultMetaDescription: "Racking, shelving, mezzanine floors and custom storage systems planned around your space and workflow.",
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
        process: [{ title: "Understand", description: "We learn your needs and limits." }, { title: "Develop", description: "We prepare the right system or layout." }, { title: "Coordinate", description: "We align the scope and plan the setup." }],
        deliverables: ["Review of your requirements", "A recommended approach", "A clear project plan"],
        metaTitle: `${name} | Rack & Stack`, metaDescription: shortDescription,
      }).returning();
      await db.insert(serviceFeatures).values([
        { serviceId: service.id, title: "Based on Your Needs", description: "We start with how you work — not a one-size-fits-all answer.", displayOrder: 0 },
        { serviceId: service.id, title: "Clear Planning", description: "Everything is agreed before work begins.", displayOrder: 1 },
        { serviceId: service.id, title: "Practical Results", description: "Our advice fits your real space and workflow.", displayOrder: 2 },
      ]);
    }
    serviceRows = await db.select().from(services);
  }

  if (Number((await db.select({ count: sql<number>`count(*)` }).from(industries))[0].count) === 0) {
    await db.insert(industries).values(industrySeed.map(([name, slug, shortDescription], displayOrder) => ({
      name, slug, shortDescription, description: `${name} businesses have unique storage needs. We plan around your stock, how often you access it, how you handle it and the space you have.`,
      challenges: ["Getting enough storage without losing easy access", "Keeping stock moving smoothly", "Adjusting to changing inventory"],
      benefits: ["Everything has its place", "Better use of your space", "Layouts that match how you work"],
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
    { sectionKey: "hero", title: "SMART STORAGE. BUILT TO LAST.", subtitle: "Smart storage systems that help you save space, work faster and grow with ease.", displayOrder: 0, content: { eyebrow: "Industrial storage systems", highlight: "BUILT TO LAST.", primaryCta: "View Our Products", secondaryCta: "Request a Quote", tertiaryCta: "Talk to Us", image: images.siteHero, badge: "Planned around your operation" } },
    { sectionKey: "trust", title: "What You Can Count On", subtitle: "Every plan starts with your space, your loads and the way your team works.", displayOrder: 2, content: { metrics: [{ value: "Site-Based", label: "Planning" }, { value: "Load-Based", label: "Configuration" }, { value: "Workflow-Based", label: "Layout" }, { value: "End-to-End", label: "Support" }] } },
    { sectionKey: "about", title: "About Rack & Stack", subtitle: "Rack & Stack designs and installs complete storage systems — industrial racking, shelving, mezzanine floors, material handling and workplace storage. We start from how you actually operate, then plan the space, the system and the setup as one connected solution.\n\nWe plan around what you store, how you access it and how your team moves it — so the result handles capacity, safety and growth without making daily work harder.", displayOrder: 1, content: { image: images.aisle, cta: "Explore Our Solutions" } },
    { sectionKey: "why", title: "The Rack & Stack Difference", subtitle: "A simple, honest approach to space, load, access and setup.", displayOrder: 4, content: { cards: [{ title: "Built Around You", description: "We start with what you store and how you move it." }, { title: "Makes Best Use of Space", description: "We plan around your building, services and clearances." }, { title: "Right Load Capacity", description: "We design based on your actual load data." }, { title: "Smooth Execution", description: "We plan installation and site needs from day one." }] } },
    { sectionKey: "process", title: "How We Work", subtitle: "A simple, clear process from the first call to final handover.", displayOrder: 8, content: { steps: [{ number: "01", title: "Discover", description: "We learn your needs, stock and workflow" }, { number: "02", title: "Survey", description: "We measure your site and note limits" }, { number: "03", title: "Design", description: "We pick the system and plan the layout" }, { number: "04", title: "Deliver", description: "We supply and coordinate installation" }] } },
    { sectionKey: "manufacturing", title: "Built for Your Needs", subtitle: "Materials, build and finish all match the design we agree with you.", displayOrder: 9, content: { image: images.installation, cta: "Discuss Your Requirement" } },
    { sectionKey: "cta", title: "Setting Up a New Warehouse or Improving an Old One?", subtitle: "Tell us about your space and storage needs. We'll help you take the next step.", displayOrder: 14, content: { primaryCta: "Request a Quote", secondaryCta: "Call +91 97692 67792" } },
  ];
  for (const section of sections) await db.insert(homepageSections).values(section).onConflictDoNothing();

  if (Number((await db.select({ count: sql<number>`count(*)` }).from(homeSliders))[0].count) === 0) {
    await db.insert(homeSliders).values([
      { eyebrow: "Industrial storage systems", title: "Industrial Storage Systems,", highlightedText: "MANUFACTURER. SUPPLY. INSTALLATION.", description: "Manufacturing-grade pallet racking, heavy duty shelving and mezzanine floors engineered for heavy loads, tight floorspace and continuous production output.", imageUrl: images.siteHero, mobileImageUrl: images.siteHero, imageAlt: "Industrial racking and storage systems installed across a manufacturing facility", primaryButtonText: "View Products", primaryButtonUrl: "/products", secondaryButtonText: "Request a Quote", secondaryButtonUrl: "/request-a-quote", tertiaryButtonText: "Talk to Us", tertiaryButtonUrl: "/contact", trustPoints: ["Site-based planning", "Load-based configuration", "Installation included"], overlayOpacity: 72, textAlignment: "left", autoplay: true, duration: 3500, sortOrder: 0, status: "PUBLISHED" },
      { eyebrow: "Space optimization", title: "Maximize Manufacturing Floor Space with Vertical Storage", highlightedText: "FROM FLOOR TO FULL.", description: "Racking, mezzanines and material handling systems that turn wasted ceiling height and floor area into organised, high-density manufacturing storage.", imageUrl: images.warehouse, mobileImageUrl: images.warehouse, imageAlt: "Wide warehouse layout with organised industrial storage", primaryButtonText: "Explore Solutions", primaryButtonUrl: "/products", secondaryButtonText: "Request a Quote", secondaryButtonUrl: "/request-a-quote", tertiaryButtonText: "Talk to Us", tertiaryButtonUrl: "/contact", trustPoints: ["Custom layouts", "Mezzanine & racking experts", "End-to-end support"], overlayOpacity: 72, textAlignment: "left", autoplay: true, duration: 3500, sortOrder: 1, status: "PUBLISHED" },
      { eyebrow: "Industrial racking & shelving", title: "Heavy Duty Racking Built for High-Output Manufacturing", highlightedText: "BUILT FOR YOUR OPERATION.", description: "Pallet racking, cantilever racks and reinforced shelving configured around your forklifts, loads and daily throughput for safe, efficient operation.", imageUrl: images.forklift, mobileImageUrl: images.forklift, imageAlt: "Forklift working alongside industrial pallet racking", primaryButtonText: "See Our Products", primaryButtonUrl: "/products", secondaryButtonText: "Request a Quote", secondaryButtonUrl: "/request-a-quote", tertiaryButtonText: "Talk to Us", tertiaryButtonUrl: "/contact", trustPoints: ["Engineered for your loads", "Fitted to your workflow", "Safety built in"], overlayOpacity: 72, textAlignment: "left", autoplay: true, duration: 3500, sortOrder: 2, status: "PUBLISHED" },
    ]);
  }

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

  const aboutContent = "Rack & Stack Storage Systems provides industrial racking, shelving, mezzanine floors, material handling and workplace storage solutions. We start with your site, your stock, your loads and the way your team works. From there, we plan the layout, supply the system, coordinate installation and support you afterwards.\n\nWe believe the best storage plans make room for capacity, easy access, safety and future growth — all at the same time.";
  const pageSeed = [
    { title: "About Rack & Stack", slug: "about", heroTitle: "Storage Built Around Your Business", heroDescription: "From the first site visit to final setup, we turn your storage needs into practical solutions.", heroImage: images.racks, content: aboutContent, metaTitle: "About Rack & Stack Storage Systems", metaDescription: "Learn about Rack & Stack's practical approach to storage planning and setup." },
    { title: "Privacy Policy", slug: "privacy-policy", heroTitle: "Privacy Policy", heroDescription: "How we handle information sent through this website.", content: "We use the information you send through our forms to reply to you, send what you requested and run this website. We never sell your personal information. For any privacy questions, email us at info@rackandstack.in.", metaTitle: "Privacy Policy | Rack & Stack", metaDescription: "Rack & Stack website privacy policy." },
    { title: "Terms and Conditions", slug: "terms-and-conditions", heroTitle: "Terms and Conditions", heroDescription: "General terms for using this website.", content: "The content on this website is for general information only. Product details, loading and project scope are confirmed in a formal proposal. Images may be for illustration only. Please don't treat website content as engineering approval for a specific installation.", metaTitle: "Terms and Conditions | Rack & Stack", metaDescription: "Terms governing use of the Rack & Stack website." },
    { title: "Cookie Policy", slug: "cookie-policy", heroTitle: "Cookie Policy", heroDescription: "Information about cookies on this website.", content: "This website uses essential cookies to keep the site working and remember your preferences. Optional analytics are only enabled if you allow them.", metaTitle: "Cookie Policy | Rack & Stack", metaDescription: "Rack & Stack website cookie policy." },
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
      { title: "Getting Ready for a Pallet Racking Layout", slug: "prepare-for-pallet-racking-layout", excerpt: "The details that help us create a better first plan for you.", content: "A good racking plan starts with a few key details: pallet size, maximum weight, what you store and how much, your handling equipment, building drawings and how your team works. The clearer these are, the better the layout will fit your operation.\n\nAlso note sprinklers, lighting, columns, doors and any other building limits. The final design should be checked against all of this.", categoryId: cats[0].id, featuredImage: images.hero, status: "PUBLISHED", featured: true, publishedAt: new Date(), metaTitle: "Getting Ready for a Pallet Racking Layout", metaDescription: "Key details to gather before requesting a pallet racking layout." },
      { title: "Storage Density vs. Easy Access: Finding the Balance", slug: "storage-density-versus-accessibility", excerpt: "Why the layout with the most spaces isn't always the best one.", content: "More storage space is good — but so is easy access, short travel times and the right handling equipment. High-density storage works well for reserve stock, while direct-access shelving suits fast-moving items.\n\nA good plan sorts your inventory into groups and picks the right storage method for each — instead of forcing everything into one system.", categoryId: cats[1].id, featuredImage: images.aisle, status: "PUBLISHED", publishedAt: new Date(), metaTitle: "Storage Density vs Easy Access", metaDescription: "How to balance warehouse storage capacity with easy inventory access." },
    ]);
  }

  if (Number((await db.select({ count: sql<number>`count(*)` }).from(faqs))[0].count) === 0) {
    await db.insert(faqs).values([
      { question: "What do you need to prepare a quote?", answer: "Share any dimensions you have, item or pallet sizes, maximum loads, quantities, how often you access them, your handling equipment and any building limits. A site survey can help fill the gaps.", entityType: "GLOBAL", displayOrder: 0 },
      { question: "Can you set up a system in an existing warehouse?", answer: "Yes. We review your columns, clear height, doors, services, movement paths and current operations before proposing a layout.", entityType: "GLOBAL", displayOrder: 1 },
      { question: "How do you calculate storage capacity?", answer: "Capacity depends on item size, declared loads, system type, aisle space, handling equipment and the usable building area. We calculate it from your specific inputs.", entityType: "GLOBAL", displayOrder: 2 },
      { question: "Do you handle installation?", answer: "Yes. Installation is included as part of the agreed project scope. We check site readiness before scheduling.", entityType: "GLOBAL", displayOrder: 3 },
    ]);
  }

  console.log(`Seed complete. Admin email: ${adminEmail}${process.env.ADMIN_PASSWORD ? "" : " (development password fallback was used)"}`);
}

seed().catch((error) => { console.error("Seed failed", error); process.exitCode = 1; }).finally(async () => { await pool.end(); });
