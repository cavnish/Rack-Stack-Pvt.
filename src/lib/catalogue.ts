export const catalogueCategorySlugs = [
  "office-storage",
  "industrial-storage",
  "material-handling",
] as const;

export type CatalogueCategorySlug = (typeof catalogueCategorySlugs)[number];

export type CatalogueSeo = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
};

export type CatalogueCategory = {
  slug: CatalogueCategorySlug;
  name: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  productCount: number;
  order: number;
  seo: CatalogueSeo;
};

export type CatalogueFeature = {
  title: string;
  description: string;
};

export type CatalogueSpecification = {
  label: string;
  value: string;
};

export type CatalogueImage = {
  url: string;
  alt: string;
  caption: string;
};

export type CatalogueProduct = {
  id: string;
  name: string;
  slug: string;
  category: CatalogueCategorySlug;
  shortDescription: string;
  longDescription: string;
  applications: string[];
  industries: string[];
  features: CatalogueFeature[];
  specifications: CatalogueSpecification[];
  variants: string[];
  images: CatalogueImage[];
  featured: boolean;
  order: number;
  seo: CatalogueSeo;
};

const AVAILABLE_SPECIFICATION = "Available as per project requirement";
const CUSTOM_SPECIFICATION = "Specifications can be customized as per requirement.";

const images = {
  aisle: "https://images.pexels.com/photos/4170172/pexels-photo-4170172.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
  forklift: "https://images.pexels.com/photos/8760709/pexels-photo-8760709.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
  warehouse: "https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
  shelving: "https://images.pexels.com/photos/36126272/pexels-photo-36126272.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
  racks: "https://images.pexels.com/photos/36126305/pexels-photo-36126305.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
  installation: "https://images.pexels.com/photos/4483860/pexels-photo-4483860.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
  longspan: "https://images.pexels.com/photos/1797415/pexels-photo-1797415.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
  hero: "https://images.pexels.com/photos/4487363/pexels-photo-4487363.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=2000",
} as const;

const catalogueImage = (url: string, alt: string, caption: string): CatalogueImage => {
  void url;
  return {
    url: "",
    alt: `${alt} image placeholder`,
    caption: `${caption} image placeholder`,
  };
};

const catalogueSeo = (title: string, description: string, ogImage: string): CatalogueSeo => ({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage,
});

export const catalogueCategories: readonly CatalogueCategory[] = [
  {
    slug: "office-storage",
    name: "Office Storage Systems",
    eyebrow: "Office Storage",
    title: "Space-smart storage for records and workplaces",
    description: "Mobile shelving, filing cabinets, pedestals, tables and lockers planned around office storage needs and available space.",
    image: images.shelving,
    productCount: 13,
    order: 1,
    seo: catalogueSeo(
      "Office Storage Systems | Rack & Stack",
      "Explore mobile compactor shelving, filing cabinets, office cupboards, pedestals, tables and lockers for organised storage.",
      images.shelving,
    ),
  },
  {
    slug: "industrial-storage",
    name: "Industrial Storage Systems",
    eyebrow: "Industrial Storage",
    title: "Storage systems built around your inventory",
    description: "Industrial racking and platform systems for warehouses, factories, workshops and stockrooms, configured to project requirements.",
    image: images.racks,
    productCount: 6,
    order: 2,
    seo: catalogueSeo(
      "Industrial Storage Systems | Rack & Stack",
      "Explore slotted angle racks, long span shelving, pallet racking, multi-tier systems, mezzanine floors and cantilever racks.",
      images.racks,
    ),
  },
  {
    slug: "material-handling",
    name: "Material Handling Equipment",
    eyebrow: "Material Handling",
    title: "Equipment for moving, lifting and loading",
    description: "Pallets, trolleys, stackers, cranes and lifting platforms for warehouse, factory and loading-bay material handling.",
    image: images.forklift,
    productCount: 13,
    order: 3,
    seo: catalogueSeo(
      "Material Handling Equipment | Rack & Stack",
      "Explore pallets, pallet trucks, dock levelers, stackers, cranes and lifting platforms for industrial material handling.",
      images.forklift,
    ),
  },
];

const officeProducts = [
  {
    id: "office-001",
    name: "Mobile Compactor Storage System",
    slug: "mobile-compactor-storage-system",
    category: "office-storage",
    shortDescription: "Mobile shelving that creates efficient, flexible storage in offices, records rooms and institutional spaces.",
    longDescription: "Mobile Compactor Storage System uses standard shelving mounted on a mobile base. Rack layout, capacity and final configuration are selected against the available space and storage requirement. It is intended for records, box files, flat files, archives, books and similar office storage needs.",
    applications: [
      "Record storage",
      "Box file storage",
      "Flat file storage",
      "Archive storage",
      "Book storage",
    ],
    industries: [
      "Engineering Industries",
      "Textile Industries",
      "Pharma",
      "Food Industries",
      "Commercial Offices",
      "Banks & Financial Institutions",
    ],
    features: [
      {
        title: "Space-efficient storage",
        description: "Standard shelving is mounted on a mobile base to save floor space.",
      },
      {
        title: "Tailored rack layout",
        description: "Numerous racks can be designed around the client's storage requirements.",
      },
      {
        title: "Flexible access",
        description: "The mobile shelving arrangement allows access to be planned around the available space.",
      },
      {
        title: "Office and archive ready",
        description: "Suitable for records, box files, flat files, archives and books.",
      },
    ],
    specifications: [
      { label: "System type", value: "Standard shelving mounted on a mobile base" },
      { label: "Layout", value: AVAILABLE_SPECIFICATION },
      { label: "Shelf configuration", value: AVAILABLE_SPECIFICATION },
      { label: "Installation requirements", value: CUSTOM_SPECIFICATION },
    ],
    variants: [],
    images: [
      catalogueImage(images.shelving, "Mobile compactor storage shelving", "Mobile compactor storage system"),
      catalogueImage(images.installation, "Office storage installation area", "Tailored mobile storage layout"),
    ],
    featured: true,
    order: 1,
    seo: catalogueSeo(
      "Mobile Compactor Storage System | Rack & Stack",
      "Mobile compactor shelving for records, archives and office storage, with a tailor-made layout configured around your available space.",
      images.shelving,
    ),
  },
  {
    id: "office-002",
    name: "Push-Pull",
    slug: "push-pull-compactor-system",
    category: "office-storage",
    shortDescription: "A manually operated light-duty compactor that creates additional storage in narrow spaces.",
    longDescription: "Push-Pull Compactor Systems suit small areas and are easy to operate. These light-duty compactors have a long, elegant mild-steel handle and are pushed and pulled by hand. They are best used in passages to create additional storage.",
    applications: [
      "Passage storage",
      "Records storage",
      "Box file storage",
      "Small office storage",
    ],
    industries: [
      "Commercial Offices",
      "Banks & Financial Institutions",
      "Pharma",
      "Food Industries",
    ],
    features: [
      {
        title: "Additional storage",
        description: "Designed to create storage capacity within passages and small areas.",
      },
      {
        title: "Manual operation",
        description: "The system is pushed and pulled by hand without electrical power.",
      },
      {
        title: "Light-duty compactor",
        description: "A compact system designed for light-duty storage use.",
      },
      {
        title: "Long handled design",
        description: "A long, elegant mild-steel handle supports manual movement.",
      },
    ],
    specifications: [
      { label: "System type", value: "Light duty push-pull compactor" },
      { label: "System span", value: "limited to 4'0\"" },
      { label: "Load capacity", value: "up to 50 kg UDL" },
      { label: "Operation", value: "Manual push and pull" },
    ],
    variants: [],
    images: [
      catalogueImage(images.racks, "Push-pull compactor shelving", "Manual push-pull compactor system"),
      catalogueImage(images.shelving, "Compact mobile office shelving", "Push-pull storage in a compact area"),
    ],
    featured: true,
    order: 2,
    seo: catalogueSeo(
      "Push-Pull Compactor System | Rack & Stack",
      "A manually operated light-duty push-pull compactor for additional office storage, with a span limited to 4'0\" and load up to 50 kg UDL.",
      images.racks,
    ),
  },
  {
    id: "office-003",
    name: "Office Storewell Cupboard",
    slug: "office-storewell-cupboard",
    category: "office-storage",
    shortDescription: "A tall office cupboard with four shelves for organised records and supplies.",
    longDescription: "The Office Storewell Cupboard provides a vertical storage solution for office records, files and supplies. Its four-shelf arrangement supports organised storage in a defined floor area.",
    applications: [
      "Office record storage",
      "File storage",
      "Document storage",
      "Office supply storage",
    ],
    industries: [
      "Office & Corporate",
      "Commercial Offices",
      "Banks & Financial Institutions",
      "Archives & Records",
    ],
    features: [
      {
        title: "Four-shelf storage",
        description: "Four shelves provide defined spaces for records, files and supplies.",
      },
      {
        title: "Vertical organisation",
        description: "Uses the available height to keep office storage together.",
      },
      {
        title: "Defined dimensions",
        description: "Published dimensions support initial space planning.",
      },
      {
        title: "Project-specific selection",
        description: "Final configuration is selected against the project requirement.",
      },
    ],
    specifications: [
      { label: "Dimension", value: "H 1980 mm X W 914 mm X D 483 mm" },
      { label: "Shelves", value: "4 shelves" },
      { label: "Material", value: AVAILABLE_SPECIFICATION },
      { label: "Finish", value: AVAILABLE_SPECIFICATION },
    ],
    variants: [],
    images: [
      catalogueImage(images.shelving, "Office storewell cupboard", "Four-shelf office storewell cupboard"),
      catalogueImage(images.installation, "Office storage cupboard installation", "Office records and supplies"),
    ],
    featured: false,
    order: 3,
    seo: catalogueSeo(
      "Office Storewell Cupboard | Rack & Stack",
      "Four-shelf office storewell cupboard measuring H 1980 mm X W 914 mm X D 483 mm for records, files and office supplies.",
      images.shelving,
    ),
  },
  {
    id: "office-004",
    name: "FRFC Filing Cabinet",
    slug: "frfc-filing-cabinet",
    category: "office-storage",
    shortDescription: "A dedicated filing cabinet for organised office records and document storage.",
    longDescription: "The FRFC Filing Cabinet provides a defined storage point for office records and documents. Its final dimensions and configuration are selected according to the project requirement.",
    applications: [
      "Office filing",
      "Document storage",
      "Record organisation",
    ],
    industries: [
      "Office & Corporate",
      "Commercial Offices",
      "Banks & Financial Institutions",
      "Archives & Records",
    ],
    features: [
      {
        title: "Organised filing",
        description: "Keeps office documents together in a dedicated storage unit.",
      },
      {
        title: "Space-conscious storage",
        description: "Provides vertical storage for records within the available office area.",
      },
      {
        title: "Project-specific configuration",
        description: "Final specifications are selected according to the requirement.",
      },
      {
        title: "Office-ready use",
        description: "Designed as a filing solution for offices and records areas.",
      },
    ],
    specifications: [
      { label: "Dimension", value: AVAILABLE_SPECIFICATION },
      { label: "Drawer configuration", value: AVAILABLE_SPECIFICATION },
      { label: "Material", value: AVAILABLE_SPECIFICATION },
      { label: "Locking", value: AVAILABLE_SPECIFICATION },
    ],
    variants: [],
    images: [
      catalogueImage(images.shelving, "FRFC filing cabinet", "Office filing cabinet"),
      catalogueImage(images.installation, "Office records storage", "Filing cabinet in an office"),
    ],
    featured: false,
    order: 4,
    seo: catalogueSeo(
      "FRFC Filing Cabinet | Rack & Stack",
      "FRFC filing cabinet for organised office documents and records, configured according to project storage requirements.",
      images.shelving,
    ),
  },
  {
    id: "office-005",
    name: "2 Drawer Filing Cabinet",
    slug: "2-drawer-filing-cabinet",
    category: "office-storage",
    shortDescription: "A compact two-drawer filing cabinet for office records and documents.",
    longDescription: "The 2 Drawer Filing Cabinet provides a compact filing solution for office records and documents. Its published dimensions support initial layout planning for office storage areas.",
    applications: [
      "Office filing",
      "Document storage",
      "Record organisation",
    ],
    industries: [
      "Office & Corporate",
      "Commercial Offices",
      "Banks & Financial Institutions",
      "Archives & Records",
    ],
    features: [
      {
        title: "Two-drawer format",
        description: "Two drawers provide separate storage positions for office records.",
      },
      {
        title: "Compact footprint",
        description: "Suitable for defined storage positions within office layouts.",
      },
      {
        title: "Defined dimensions",
        description: "Published dimensions support initial space planning.",
      },
      {
        title: "Document organisation",
        description: "Keeps filing material together in a dedicated cabinet.",
      },
    ],
    specifications: [
      { label: "Dimension", value: "H 750 mm X W 470 mm X D 700 mm" },
      { label: "Drawer configuration", value: "2 Drawers" },
      { label: "Material", value: AVAILABLE_SPECIFICATION },
      { label: "Locking", value: AVAILABLE_SPECIFICATION },
    ],
    variants: ["2 Drawer Model"],
    images: [
      catalogueImage(images.shelving, "Two-drawer filing cabinet", "2 Drawer Filing Cabinet"),
      catalogueImage(images.installation, "Office filing area", "Records organised in filing cabinets"),
    ],
    featured: false,
    order: 5,
    seo: catalogueSeo(
      "2 Drawer Filing Cabinet | Rack & Stack",
      "Compact 2 Drawer Filing Cabinet measuring H 750 mm X W 470 mm X D 700 mm for office records and documents.",
      images.shelving,
    ),
  },
  {
    id: "office-006",
    name: "3 Drawer Filing Cabinet",
    slug: "3-drawer-filing-cabinet",
    category: "office-storage",
    shortDescription: "A three-drawer filing cabinet for office records, files and documents.",
    longDescription: "The 3 Drawer Filing Cabinet provides three defined drawer positions for office records and documents. Its published dimensions support initial layout planning for office storage areas.",
    applications: [
      "Office filing",
      "Document storage",
      "Record organisation",
    ],
    industries: [
      "Office & Corporate",
      "Commercial Offices",
      "Banks & Financial Institutions",
      "Archives & Records",
    ],
    features: [
      {
        title: "Three-drawer format",
        description: "Three drawers provide separate storage positions for office records.",
      },
      {
        title: "Vertical file storage",
        description: "Organises documents within a single office storage unit.",
      },
      {
        title: "Defined dimensions",
        description: "Published dimensions support initial space planning.",
      },
      {
        title: "Project-specific selection",
        description: "Additional details are selected according to the requirement.",
      },
    ],
    specifications: [
      { label: "Dimension", value: "H 1065 mm X W 470 mm X D 700 mm" },
      { label: "Drawer configuration", value: "3 Drawers" },
      { label: "Material", value: AVAILABLE_SPECIFICATION },
      { label: "Locking", value: AVAILABLE_SPECIFICATION },
    ],
    variants: ["3 Drawer Model"],
    images: [
      catalogueImage(images.shelving, "Three-drawer filing cabinet", "3 Drawer Filing Cabinet"),
      catalogueImage(images.installation, "Office document storage", "Three-drawer records cabinet"),
    ],
    featured: false,
    order: 6,
    seo: catalogueSeo(
      "3 Drawer Filing Cabinet | Rack & Stack",
      "3 Drawer Filing Cabinet measuring H 1065 mm X W 470 mm X D 700 mm for organised office records and documents.",
      images.shelving,
    ),
  },
  {
    id: "office-007",
    name: "4 Drawer Filing Cabinet",
    slug: "4-drawer-filing-cabinet",
    category: "office-storage",
    shortDescription: "A four-drawer filing cabinet for office records, files and documents.",
    longDescription: "The 4 Drawer Filing Cabinet provides four defined drawer positions for office records and documents. Its published dimensions support initial layout planning for office storage areas.",
    applications: [
      "Office filing",
      "Document storage",
      "Record organisation",
    ],
    industries: [
      "Office & Corporate",
      "Commercial Offices",
      "Banks & Financial Institutions",
      "Archives & Records",
    ],
    features: [
      {
        title: "Four-drawer format",
        description: "Four drawers provide separate storage positions for office records.",
      },
      {
        title: "Vertical file storage",
        description: "Keeps documents organised within a defined cabinet footprint.",
      },
      {
        title: "Defined dimensions",
        description: "Published dimensions support initial space planning.",
      },
      {
        title: "Project-specific selection",
        description: "Additional details are selected according to the requirement.",
      },
    ],
    specifications: [
      { label: "Dimension", value: "H 1384 mm X W 470 mm X D 700 mm" },
      { label: "Drawer configuration", value: "4 Drawers" },
      { label: "Material", value: AVAILABLE_SPECIFICATION },
      { label: "Locking", value: AVAILABLE_SPECIFICATION },
    ],
    variants: ["4 Drawer Model"],
    images: [
      catalogueImage(images.shelving, "Four-drawer filing cabinet", "4 Drawer Filing Cabinet"),
      catalogueImage(images.installation, "Office records storage", "Four-drawer document cabinet"),
    ],
    featured: false,
    order: 7,
    seo: catalogueSeo(
      "4 Drawer Filing Cabinet | Rack & Stack",
      "4 Drawer Filing Cabinet measuring H 1384 mm X W 470 mm X D 700 mm for organised office records and documents.",
      images.shelving,
    ),
  },
  {
    id: "office-008",
    name: "Pedestals",
    slug: "pedestals",
    category: "office-storage",
    shortDescription: "A three-drawer office pedestal for personal files and everyday storage.",
    longDescription: "The three-drawer office pedestal provides an individual storage position for files and everyday office items. Its published dimensions support initial workspace and storage planning.",
    applications: [
      "Office personal storage",
      "File storage",
      "Workstation organisation",
    ],
    industries: [
      "Office & Corporate",
      "Commercial Offices",
      "Banks & Financial Institutions",
    ],
    features: [
      {
        title: "Three-drawer storage",
        description: "Three drawers provide separate positions for files and office items.",
      },
      {
        title: "Individual storage unit",
        description: "Provides a defined storage point within an office or workstation area.",
      },
      {
        title: "Defined dimensions",
        description: "Published dimensions support initial space planning.",
      },
      {
        title: "Project-specific selection",
        description: "Additional details are selected according to the requirement.",
      },
    ],
    specifications: [
      { label: "Dimension", value: "H 717 mm X W 458 mm X D 584 mm" },
      { label: "Drawer configuration", value: "3 Drawers" },
      { label: "Material", value: AVAILABLE_SPECIFICATION },
      { label: "Finish", value: AVAILABLE_SPECIFICATION },
    ],
    variants: ["3 Drawer Model"],
    images: [
      catalogueImage(images.shelving, "Three-drawer office pedestal", "Office storage pedestal"),
      catalogueImage(images.installation, "Office workstation storage", "Pedestal within an office"),
    ],
    featured: false,
    order: 8,
    seo: catalogueSeo(
      "Office Pedestals | Rack & Stack",
      "Three-drawer office pedestal measuring H 717 mm X W 458 mm X D 584 mm for files and everyday workplace storage.",
      images.shelving,
    ),
  },
  {
    id: "office-009",
    name: "Office Tables",
    slug: "office-tables",
    category: "office-storage",
    shortDescription: "A compact two-sided office table for shared or dual-position workspaces.",
    longDescription: "The two-sided small office table provides a defined work surface for shared office use. Its published dimensions support initial furniture and space planning.",
    applications: [
      "Shared office workspace",
      "Two-sided workstation",
      "Office work surface",
    ],
    industries: [
      "Office & Corporate",
      "Commercial Offices",
      "Banks & Financial Institutions",
    ],
    features: [
      {
        title: "Two-sided work surface",
        description: "Designed as a small two-sided office table.",
      },
      {
        title: "Compact layout",
        description: "A defined size for suitable shared office positions.",
      },
      {
        title: "Defined dimensions",
        description: "Published dimensions support initial space planning.",
      },
      {
        title: "Project-specific selection",
        description: "Additional details are selected according to the requirement.",
      },
    ],
    specifications: [
      { label: "Dimension", value: "H 762 mm X W 1220 mm X D 610 mm" },
      { label: "Table type", value: "Two Sided Small Office Table" },
      { label: "Material", value: AVAILABLE_SPECIFICATION },
      { label: "Finish", value: AVAILABLE_SPECIFICATION },
    ],
    variants: ["Two Sided Small Office Table"],
    images: [
      catalogueImage(images.installation, "Two-sided office table", "Small office work table"),
      catalogueImage(images.shelving, "Office table and storage", "Shared office workspace"),
    ],
    featured: false,
    order: 9,
    seo: catalogueSeo(
      "Office Tables | Rack & Stack",
      "Two-sided small office table measuring H 762 mm X W 1220 mm X D 610 mm for shared office workspace.",
      images.installation,
    ),
  },
  {
    id: "office-010",
    name: "Four Tier Lockers",
    slug: "four-tier-lockers",
    category: "office-storage",
    shortDescription: "A four-tier locker for individual storage in offices and staff areas.",
    longDescription: "Four Tier Lockers provide four individual storage compartments within a vertical locker unit. The published overall and compartment dimensions support initial space planning.",
    applications: [
      "Staff storage",
      "Office personal storage",
      "Locker rooms",
      "Institutional storage",
    ],
    industries: [
      "Office & Corporate",
      "Factories",
      "Institutions",
      "Commercial Offices",
    ],
    features: [
      {
        title: "Four-tier format",
        description: "The locker unit is arranged with four tiers.",
      },
      {
        title: "Individual compartments",
        description: "Provides four defined personal storage positions.",
      },
      {
        title: "Defined dimensions",
        description: "Published overall dimensions support initial space planning.",
      },
      {
        title: "Project-specific selection",
        description: "Additional details are selected according to the requirement.",
      },
    ],
    specifications: [
      { label: "Dimension", value: "H 1905 mm X W 380 mm X D 457 mm" },
      { label: "Locker configuration", value: "Four lockers" },
      { label: "Tier configuration", value: "4 Tier" },
      { label: "Material", value: AVAILABLE_SPECIFICATION },
    ],
    variants: ["4 Tier Model"],
    images: [
      catalogueImage(images.shelving, "Four-tier lockers", "Office four-tier locker unit"),
      catalogueImage(images.installation, "Staff locker area", "Individual locker storage"),
    ],
    featured: false,
    order: 10,
    seo: catalogueSeo(
      "Four Tier Lockers | Rack & Stack",
      "Four-tier office locker measuring H 1905 mm X W 380 mm X D 457 mm for individual staff and workplace storage.",
      images.shelving,
    ),
  },
  {
    id: "office-011",
    name: "Eight Tier Lockers",
    slug: "eight-tier-lockers",
    category: "office-storage",
    shortDescription: "An eight-tier locker unit for individual workplace and institutional storage.",
    longDescription: "Eight Tier Lockers provide eight individual storage compartments in a vertical unit. The published overall and compartment dimensions support initial space planning.",
    applications: [
      "Staff storage",
      "Office personal storage",
      "Locker rooms",
      "Institutional storage",
    ],
    industries: [
      "Office & Corporate",
      "Factories",
      "Institutions",
      "Commercial Offices",
    ],
    features: [
      {
        title: "Eight-tier format",
        description: "The locker unit is arranged with eight tiers.",
      },
      {
        title: "Individual compartments",
        description: "Provides eight defined personal storage positions.",
      },
      {
        title: "Defined dimensions",
        description: "Published overall and locker dimensions support initial space planning.",
      },
      {
        title: "Project-specific selection",
        description: "Additional details are selected according to the requirement.",
      },
    ],
    specifications: [
      { label: "Dimension with leg", value: "H 1980 mm X W 914 mm X D 483 mm" },
      { label: "Locker Dimension", value: "H 457 mm X W 457 mm X D 432 mm" },
      { label: "Locker configuration", value: "Eight lockers" },
      { label: "Tier configuration", value: "8 Tier" },
    ],
    variants: ["8 Tier Model"],
    images: [
      catalogueImage(images.shelving, "Eight-tier lockers", "Eight-compartment office locker unit"),
      catalogueImage(images.installation, "Staff changing and storage area", "Workplace locker storage"),
    ],
    featured: false,
    order: 11,
    seo: catalogueSeo(
      "Eight Tier Lockers | Rack & Stack",
      "Eight-tier office locker with overall dimensions H 1980 mm X W 914 mm X D 483 mm and individual locker storage.",
      images.shelving,
    ),
  },
  {
    id: "office-012",
    name: "Twelve Tier Lockers",
    slug: "twelve-tier-lockers",
    category: "office-storage",
    shortDescription: "A twelve-tier locker unit for individual workplace and institutional storage.",
    longDescription: "Twelve Tier Lockers provide twelve individual storage compartments in a vertical unit. The published overall and compartment dimensions support initial space planning.",
    applications: [
      "Staff storage",
      "Office personal storage",
      "Locker rooms",
      "Institutional storage",
    ],
    industries: [
      "Office & Corporate",
      "Factories",
      "Institutions",
      "Commercial Offices",
    ],
    features: [
      {
        title: "Twelve-tier format",
        description: "The locker unit is arranged with twelve tiers.",
      },
      {
        title: "Individual compartments",
        description: "Provides twelve defined personal storage positions.",
      },
      {
        title: "Defined dimensions",
        description: "Published overall and locker dimensions support initial space planning.",
      },
      {
        title: "Project-specific selection",
        description: "Additional details are selected according to the requirement.",
      },
    ],
    specifications: [
      { label: "Dimension with leg", value: "H 1980 mm X W 914 mm X D 483 mm" },
      { label: "Locker Dimension", value: "H 457 mm X W 305 mm X D 432 mm" },
      { label: "Locker configuration", value: "Twelve lockers" },
      { label: "Tier configuration", value: "12 Tier" },
    ],
    variants: ["12 Tier Model"],
    images: [
      catalogueImage(images.shelving, "Twelve-tier lockers", "Twelve-compartment locker unit"),
      catalogueImage(images.installation, "Institutional locker area", "Individual workplace storage"),
    ],
    featured: false,
    order: 12,
    seo: catalogueSeo(
      "Twelve Tier Lockers | Rack & Stack",
      "Twelve-tier office locker with overall dimensions H 1980 mm X W 914 mm X D 483 mm and individual locker storage.",
      images.shelving,
    ),
  },
  {
    id: "office-013",
    name: "Eighteen Tier Lockers",
    slug: "eighteen-tier-lockers",
    category: "office-storage",
    shortDescription: "An eighteen-tier locker unit for individual workplace and institutional storage.",
    longDescription: "Eighteen Tier Lockers provide eighteen individual storage compartments in a vertical unit. The published overall and compartment dimensions support initial space planning.",
    applications: [
      "Staff storage",
      "Office personal storage",
      "Locker rooms",
      "Institutional storage",
    ],
    industries: [
      "Office & Corporate",
      "Factories",
      "Institutions",
      "Commercial Offices",
    ],
    features: [
      {
        title: "Eighteen-tier format",
        description: "The locker unit is arranged with eighteen tiers.",
      },
      {
        title: "Individual compartments",
        description: "Provides eighteen defined personal storage positions.",
      },
      {
        title: "Defined dimensions",
        description: "Published overall and locker dimensions support initial space planning.",
      },
      {
        title: "Project-specific selection",
        description: "Additional details are selected according to the requirement.",
      },
    ],
    specifications: [
      { label: "Dimension with leg", value: "H 1980 mm X W 914 mm X D 483 mm" },
      { label: "Locker Dimension", value: "H 305 mm X W 305 mm X D 432 mm" },
      { label: "Locker configuration", value: "Eighteen lockers" },
      { label: "Tier configuration", value: "18 Tier" },
    ],
    variants: ["18 Tier Model"],
    images: [
      catalogueImage(images.shelving, "Eighteen-tier lockers", "Eighteen-compartment locker unit"),
      catalogueImage(images.installation, "Staff storage lockers", "High-density individual storage"),
    ],
    featured: false,
    order: 13,
    seo: catalogueSeo(
      "Eighteen Tier Lockers | Rack & Stack",
      "Eighteen-tier office locker with overall dimensions H 1980 mm X W 914 mm X D 483 mm and individual locker storage.",
      images.shelving,
    ),
  },
] satisfies CatalogueProduct[];

const industrialProducts = [
  {
    id: "industrial-001",
    name: "Slotted Angle Racks",
    slug: "slotted-angle-racks",
    category: "industrial-storage",
    shortDescription: "Flexible slotted-angle storage for industrial, warehouse and commercial stockroom requirements.",
    longDescription: "We manufacture and supply slotted angle storage systems according to customer needs. Their sizes and loading capacities are set to meet storage requirements in industry, warehouses, showrooms and other commercial areas.",
    applications: [
      "General storage",
      "Warehouse stock storage",
      "Showroom storage",
      "Commercial storage",
    ],
    industries: [
      "Manufacturing",
      "Warehousing",
      "Retail",
      "Engineering",
      "Logistics",
    ],
    features: [
      {
        title: "Flexible rack sizing",
        description: "Rack sizes are selected for the available storage requirement.",
      },
      {
        title: "Project-specific loading",
        description: "Loading capacity is determined for the intended application.",
      },
      {
        title: "Multi-area use",
        description: "Designed for industry, warehouses, showrooms and commercial storage areas.",
      },
      {
        title: "Modular storage",
        description: "The slotted-angle format supports practical storage layouts.",
      },
    ],
    specifications: [
      { label: "System type", value: "Slotted angle storage rack" },
      { label: "Rack size", value: AVAILABLE_SPECIFICATION },
      { label: "Loading capacity", value: AVAILABLE_SPECIFICATION },
      { label: "Shelf configuration", value: CUSTOM_SPECIFICATION },
    ],
    variants: [],
    images: [
      catalogueImage(images.aisle, "Slotted-angle storage racks", "Industrial slotted-angle rack system"),
      catalogueImage(images.installation, "Warehouse rack installation", "Configured storage racks"),
    ],
    featured: false,
    order: 14,
    seo: catalogueSeo(
      "Slotted Angle Racks | Rack & Stack",
      "Slotted angle racks for industrial, warehouse, showroom and commercial storage, sized and loaded to project requirements.",
      images.aisle,
    ),
  },
  {
    id: "industrial-002",
    name: "Heavy Duty Long Span Shelving Racks",
    slug: "heavy-duty-long-span-shelving-racks",
    category: "industrial-storage",
    shortDescription: "Heavy-duty hand-loaded shelving for warehouses, factories, workshops and large stockrooms.",
    longDescription: "Heavy-duty shelving is a practical system for the storage of hand-loaded items in warehouses, factories, workshops and large stockrooms. It can store a wide variety of items and provide direct access to stored materials. The system makes effective use of warehouse height; higher levels can be accessed with equipment that lifts an order picker to the required height, or through gangways between shelves.",
    applications: [
      "Hand-loaded item storage",
      "Warehouse shelving",
      "Workshop storage",
      "Stockroom storage",
      "High-level picking",
    ],
    industries: [
      "Warehousing",
      "Manufacturing",
      "Engineering",
      "Logistics",
      "Distribution Centers",
    ],
    features: [
      {
        title: "Direct access",
        description: "Stored hand-loaded items can be reached directly from the shelving.",
      },
      {
        title: "Wide storage use",
        description: "The system can hold a wide variety of items across its levels.",
      },
      {
        title: "Height utilisation",
        description: "Higher levels can make use of the available warehouse height.",
      },
      {
        title: "Flexible access methods",
        description: "Higher storage can be reached with lifting equipment or through shelf gangways.",
      },
    ],
    specifications: [
      { label: "Loading method", value: "Hand-loaded items" },
      { label: "Shelf loading capacity", value: AVAILABLE_SPECIFICATION },
      { label: "Span", value: AVAILABLE_SPECIFICATION },
      { label: "Configuration", value: CUSTOM_SPECIFICATION },
    ],
    variants: [],
    images: [
      catalogueImage(images.longspan, "Heavy-duty long span shelving", "Long span warehouse shelving"),
      catalogueImage(images.warehouse, "Industrial shelving storage", "Hand-loaded heavy-duty racks"),
    ],
    featured: true,
    order: 15,
    seo: catalogueSeo(
      "Heavy Duty Long Span Shelving Racks | Rack & Stack",
      "Heavy-duty long span shelving for hand-loaded warehouse, factory, workshop and stockroom storage with flexible high-level access.",
      images.longspan,
    ),
  },
  {
    id: "industrial-003",
    name: "Conventional Pallet Racking System",
    slug: "conventional-pallet-racking-system",
    category: "industrial-storage",
    shortDescription: "Flexible pallet racking for direct, single access to palletized warehouse inventory.",
    longDescription: "Conventional Pallet Racking is a universal system for direct and single access to each pallet. It is suitable for warehouses with palletized products and can be configured around warehouse storage requirements. Pallet access can be provided through stackers, forklifts and reach-truck equipment. The system is suitable for loads of different sizes, shapes and weights within the same rack.",
    applications: [
      "Warehouse pallet storage",
      "Palletized product storage",
      "Single pallet access",
      "Mixed load storage",
    ],
    industries: [
      "Warehousing",
      "Manufacturing",
      "Logistics",
      "Distribution Centers",
      "FMCG",
    ],
    features: [
      {
        title: "Direct pallet access",
        description: "Each pallet can be accessed directly through the rack aisle.",
      },
      {
        title: "Flexible configuration",
        description: "The racking can be configured around warehouse storage requirements.",
      },
      {
        title: "Equipment compatibility",
        description: "Pallets can be handled with stackers, forklifts and reach trucks.",
      },
      {
        title: "Mixed inventory",
        description: "Loads of different sizes, shapes and weights can be stored in the same rack.",
      },
    ],
    specifications: [
      { label: "Pallet access", value: "Direct and single access" },
      { label: "Unit load", value: AVAILABLE_SPECIFICATION },
      { label: "Rack configuration", value: CUSTOM_SPECIFICATION },
      { label: "Handling equipment", value: "Stackers, forklifts and reach trucks" },
    ],
    variants: [],
    images: [
      catalogueImage(images.hero, "Conventional pallet racking", "Warehouse pallet racking system"),
      catalogueImage(images.forklift, "Forklift accessing pallet racking", "Direct pallet access"),
    ],
    featured: true,
    order: 16,
    seo: catalogueSeo(
      "Conventional Pallet Racking System | Rack & Stack",
      "Conventional pallet racking for flexible warehouse layouts and direct single access to palletized inventory using standard handling equipment.",
      images.hero,
    ),
  },
  {
    id: "industrial-004",
    name: "Multi Tier Racking System",
    slug: "multi-tier-racking-system",
    category: "industrial-storage",
    shortDescription: "Multi-level shelving that increases warehouse storage capacity by using available vertical space.",
    longDescription: "Multi-Tier shelving uses two or more storage levels with components used for selective pallet racking or heavy-duty shelving. It is suitable for medium to large warehouses and for storing and distributing large and small parts. Multiple levels maximise available warehouse height and increase overall storage capacity. Each level can be accessed through staircases, main aisles and cross aisles.",
    applications: [
      "Warehouse vertical storage",
      "Parts storage",
      "Distribution storage",
      "Multi-level inventory",
    ],
    industries: [
      "Warehousing",
      "Manufacturing",
      "Logistics",
      "Distribution Centers",
      "Engineering",
    ],
    features: [
      {
        title: "Vertical-space use",
        description: "Multiple levels maximise the available warehouse height.",
      },
      {
        title: "Flexible parts storage",
        description: "Suitable for storing and distributing large and small parts.",
      },
      {
        title: "Multiple access routes",
        description: "Levels can be accessed through staircases, main aisles and cross aisles.",
      },
      {
        title: "Expanded warehouse capacity",
        description: "The multi-level arrangement increases the warehouse's storage capacity.",
      },
    ],
    specifications: [
      { label: "Number of tiers", value: "Two or more levels" },
      { label: "Level loading capacity", value: AVAILABLE_SPECIFICATION },
      { label: "System components", value: "Components used for selective pallet racking or heavy duty shelving" },
      { label: "Access configuration", value: CUSTOM_SPECIFICATION },
    ],
    variants: [],
    images: [
      catalogueImage(images.racks, "Multi-tier racking system", "Multi-level warehouse racking"),
      catalogueImage(images.warehouse, "High-density warehouse storage", "Vertical warehouse storage levels"),
    ],
    featured: true,
    order: 17,
    seo: catalogueSeo(
      "Multi Tier Racking System | Rack & Stack",
      "Multi-tier warehouse racking for large and small parts, using vertical space and access through staircases, aisles and cross aisles.",
      images.racks,
    ),
  },
  {
    id: "industrial-005",
    name: "Mezzanine Floor",
    slug: "mezzanine-floor",
    category: "industrial-storage",
    shortDescription: "An additional structural floor for storage, work areas or support space within a warehouse.",
    longDescription: "Mezzanine floors can range from a simple storage platform to a heavy-duty structural floor designed and engineered for specific requirements. The systems are free-standing and do not depend on the existing building for support, so they can be relocated if the operation moves. A mezzanine provides an upper second-floor level that can increase storage capacity or create a lower work area with storage above.",
    applications: [
      "Additional storage",
      "Second-floor work area",
      "Warehouse space optimisation",
      "Production support space",
    ],
    industries: [
      "Warehousing",
      "Manufacturing",
      "Logistics",
      "Distribution Centers",
    ],
    features: [
      {
        title: "Additional usable floor",
        description: "Creates an upper second-floor level within a suitable warehouse or stockroom.",
      },
      {
        title: "Storage or work area",
        description: "Can increase storage capacity or create a lower work area with storage above.",
      },
      {
        title: "Free-standing structure",
        description: "The system does not depend on the existing building for support.",
      },
      {
        title: "Relocatable platform",
        description: "The mezzanine can be relocated if the operation moves.",
      },
    ],
    specifications: [
      { label: "Standard load", value: "up to 1000 kg/m²" },
      { label: "Span", value: "3500 mm" },
      { label: "System type", value: AVAILABLE_SPECIFICATION },
      { label: "Design and engineering", value: CUSTOM_SPECIFICATION },
    ],
    variants: ["Simple Storage Platform", "Heavy Duty Structural Floor"],
    images: [
      catalogueImage(images.forklift, "Warehouse mezzanine floor", "Free-standing warehouse mezzanine"),
      catalogueImage(images.installation, "Mezzanine installation area", "Additional storage and work floor"),
    ],
    featured: true,
    order: 18,
    seo: catalogueSeo(
      "Mezzanine Floor | Rack & Stack",
      "Free-standing warehouse mezzanine for additional storage or work areas, with a standard load up to 1000 kg/m² and span of 3500 mm.",
      images.forklift,
    ),
  },
  {
    id: "industrial-006",
    name: "Cantilever Racking System",
    slug: "cantilever-racking-system",
    category: "industrial-storage",
    shortDescription: "Space-saving cantilever storage for long materials in manufacturing and warehouse operations.",
    longDescription: "Cantilever racks are commonly used in manufacturing environments and large-scale warehouse operations as space-saving storage solutions. They are available in single-sided and double-sided configurations and as multi-tier systems, increasing available storage space while eliminating intermediate aisles. With no front uprights, goods can be accessed with a forklift or moved manually from any rack level, reducing handling time.",
    applications: [
      "Long material storage",
      "Manufacturing storage",
      "Large-scale warehouse storage",
      "Forklift-accessible racking",
    ],
    industries: [
      "Manufacturing",
      "Warehousing",
      "Steel and metal storage",
      "Timber and pipe storage",
      "Logistics",
    ],
    features: [
      {
        title: "Space-saving layout",
        description: "Cantilever storage can eliminate intermediate aisles.",
      },
      {
        title: "Flexible configurations",
        description: "Available as single-sided, double-sided and multi-tier systems.",
      },
      {
        title: "Clear rack access",
        description: "The absence of front uprights supports forklift and manual access.",
      },
      {
        title: "All-level retrieval",
        description: "Materials can be retrieved from bottom and upper rack levels with reduced handling time.",
      },
    ],
    specifications: [
      { label: "Configuration", value: "Single-sided, double-sided and multi-tier" },
      { label: "Rack length", value: AVAILABLE_SPECIFICATION },
      { label: "Arm length", value: AVAILABLE_SPECIFICATION },
      { label: "Loading capacity", value: AVAILABLE_SPECIFICATION },
    ],
    variants: ["Single-sided system", "Double-sided system", "Multi-tier system"],
    images: [
      catalogueImage(images.aisle, "Cantilever racking system", "Long material cantilever storage"),
      catalogueImage(images.warehouse, "Cantilever rack warehouse aisle", "Cantilever storage configuration"),
    ],
    featured: false,
    order: 19,
    seo: catalogueSeo(
      "Cantilever Racking System | Rack & Stack",
      "Single-sided, double-sided and multi-tier cantilever racking for long materials, manufacturing and large-scale warehouse storage.",
      images.aisle,
    ),
  },
] satisfies CatalogueProduct[];

const materialHandlingProducts = [
  {
    id: "material-001",
    name: "M S Pallet - Mild Steel or Stainless Steel",
    slug: "ms-pallet",
    category: "material-handling",
    shortDescription: "A metal pallet offered in mild steel or stainless steel for project-specific handling needs.",
    longDescription: "The M S Pallet - Mild Steel or Stainless Steel is available in mild steel or stainless steel. The material selection and final pallet dimensions are determined according to the project requirement.",
    applications: [
      "Pallet handling",
      "Warehouse material movement",
      "Industrial storage",
    ],
    industries: [
      "Warehousing",
      "Manufacturing",
      "Logistics",
      "Distribution Centers",
    ],
    features: [
      {
        title: "Two material options",
        description: "Available in mild steel or stainless steel.",
      },
      {
        title: "Pallet handling",
        description: "Provides a platform for material-handling requirements.",
      },
      {
        title: "Project-specific sizing",
        description: "Final dimensions are selected according to the requirement.",
      },
      {
        title: "Application-led selection",
        description: "The pallet configuration is matched to the intended use.",
      },
    ],
    specifications: [
      { label: "Material", value: "Mild Steel or Stainless Steel" },
      { label: "Dimension", value: AVAILABLE_SPECIFICATION },
      { label: "Load capacity", value: AVAILABLE_SPECIFICATION },
      { label: "Configuration", value: CUSTOM_SPECIFICATION },
    ],
    variants: ["Mild Steel", "Stainless Steel"],
    images: [
      catalogueImage(images.warehouse, "Metal pallet in a warehouse", "MS pallet"),
      catalogueImage(images.installation, "Pallet handling area", "Pallet configured for material handling"),
    ],
    featured: false,
    order: 20,
    seo: catalogueSeo(
      "MS Pallet | Rack & Stack",
      "MS pallet in mild steel or stainless steel for warehouse and industrial material-handling requirements.",
      images.warehouse,
    ),
  },
  {
    id: "material-002",
    name: "Wooden Pallet",
    slug: "wooden-pallet",
    category: "material-handling",
    shortDescription: "A wooden pallet for warehouse, industrial and general material-handling applications.",
    longDescription: "The Wooden Pallet provides a platform for material handling and storage. Its final dimensions and load capacity are selected according to the project requirement.",
    applications: [
      "Pallet handling",
      "Warehouse storage",
      "Material movement",
    ],
    industries: [
      "Warehousing",
      "Manufacturing",
      "Logistics",
      "Retail",
      "Distribution Centers",
    ],
    features: [
      {
        title: "Wooden construction",
        description: "A pallet made for project-specific material handling.",
      },
      {
        title: "Storage platform",
        description: "Supports organised pallet handling and storage.",
      },
      {
        title: "Flexible sizing",
        description: "Final dimensions are selected according to the requirement.",
      },
      {
        title: "Multi-sector use",
        description: "Suitable for warehouse, industrial and general handling applications.",
      },
    ],
    specifications: [
      { label: "Material", value: "Wood" },
      { label: "Dimension", value: AVAILABLE_SPECIFICATION },
      { label: "Load capacity", value: AVAILABLE_SPECIFICATION },
      { label: "Construction", value: CUSTOM_SPECIFICATION },
    ],
    variants: [],
    images: [
      catalogueImage(images.warehouse, "Wooden pallet in a warehouse", "Wooden material-handling pallet"),
      catalogueImage(images.installation, "Pallet storage area", "Wooden pallet in a material workflow"),
    ],
    featured: false,
    order: 21,
    seo: catalogueSeo(
      "Wooden Pallet | Rack & Stack",
      "Wooden pallets for warehouse, industrial and general material handling, with dimensions and load capacity selected by project.",
      images.warehouse,
    ),
  },
  {
    id: "material-003",
    name: "Hydraulic Pallet Truck",
    slug: "hydraulic-pallet-truck",
    category: "material-handling",
    shortDescription: "A hydraulic pallet truck with defined length, width and lifting-height limits.",
    longDescription: "The Hydraulic Pallet Truck provides a compact handling solution for moving palletized loads. Its published dimensions and lowered and lifted heights support initial equipment selection.",
    applications: [
      "Pallet movement",
      "Warehouse handling",
      "Loading-bay movement",
    ],
    industries: [
      "Warehousing",
      "Manufacturing",
      "Logistics",
      "Retail",
      "Distribution Centers",
    ],
    features: [
      {
        title: "Hydraulic lifting",
        description: "Uses a hydraulic lifting arrangement for pallet handling.",
      },
      {
        title: "Defined handling size",
        description: "Published length and width support initial layout planning.",
      },
      {
        title: "Lowered height 85 mm",
        description: "The listed lowered height is 85 mm.",
      },
      {
        title: "Lifted height 200 mm",
        description: "The listed lifted height is 200 mm.",
      },
    ],
    specifications: [
      { label: "Dimension", value: "L 1150 mm X W 540 mm" },
      { label: "Lowered height", value: "85 mm" },
      { label: "Lifted height", value: "200 mm" },
      { label: "Load capacity", value: AVAILABLE_SPECIFICATION },
    ],
    variants: [],
    images: [
      catalogueImage(images.warehouse, "Hydraulic pallet truck", "Pallet truck handling a load"),
      catalogueImage(images.installation, "Warehouse pallet movement", "Hydraulic pallet truck in operation"),
    ],
    featured: true,
    order: 22,
    seo: catalogueSeo(
      "Hydraulic Pallet Truck | Rack & Stack",
      "Hydraulic pallet truck with L 1150 mm X W 540 mm dimensions, 85 mm lowered height and 200 mm lifted height for warehouse handling.",
      images.warehouse,
    ),
  },
  {
    id: "material-004",
    name: "Drum Loading Trolly",
    slug: "drum-loading-trolley",
    category: "material-handling",
    shortDescription: "A trolley designed for drum-loading and material-handling requirements.",
    longDescription: "The Drum Loading Trolly is intended for drum-loading and related material-handling work. Final dimensions and load capacity are selected according to the project requirement.",
    applications: [
      "Drum loading",
      "Drum movement",
      "Warehouse handling",
    ],
    industries: [
      "Manufacturing",
      "Warehousing",
      "Chemical handling",
      "Logistics",
    ],
    features: [
      {
        title: "Drum-focused handling",
        description: "Designed for drum-loading requirements.",
      },
      {
        title: "Trolley movement",
        description: "Supports movement of drums during handling operations.",
      },
      {
        title: "Project-specific sizing",
        description: "Final dimensions are selected against the intended load.",
      },
      {
        title: "Configurable selection",
        description: "Capacity and configuration are determined by project requirements.",
      },
    ],
    specifications: [
      { label: "Dimension", value: AVAILABLE_SPECIFICATION },
      { label: "Load capacity", value: AVAILABLE_SPECIFICATION },
      { label: "Platform size", value: AVAILABLE_SPECIFICATION },
      { label: "Wheel configuration", value: CUSTOM_SPECIFICATION },
    ],
    variants: [],
    images: [
      catalogueImage(images.warehouse, "Drum loading trolley", "Trolley for drum loading"),
      catalogueImage(images.installation, "Drum handling area", "Drum material handling"),
    ],
    featured: false,
    order: 23,
    seo: catalogueSeo(
      "Drum Loading Trolly | Rack & Stack",
      "Drum loading trolley for industrial and warehouse material handling, configured by project dimensions and load requirement.",
      images.warehouse,
    ),
  },
  {
    id: "material-005",
    name: "Dock Leveler",
    slug: "dock-leveler",
    category: "material-handling",
    shortDescription: "Loading-bay equipment for loading and unloading operations with a maximum capacity of 9000 kg.",
    longDescription: "Dock leveler is loading and unloading equipment situated at the loading bay of a factory. The maximum capacity of the dock leveler is 9000 kg.",
    applications: [
      "Factory loading bay",
      "Loading and unloading",
      "Vehicle loading interface",
    ],
    industries: [
      "Manufacturing",
      "Warehousing",
      "Logistics",
      "Distribution Centers",
    ],
    features: [
      {
        title: "Loading-bay equipment",
        description: "Positioned at the loading bay of a factory.",
      },
      {
        title: "Loading and unloading",
        description: "Supports material transfer during loading-bay operations.",
      },
      {
        title: "9000 kg maximum capacity",
        description: "The stated maximum capacity is 9000 kg.",
      },
      {
        title: "Project-specific dimensions",
        description: "Final dimensions are selected according to the loading-bay requirement.",
      },
    ],
    specifications: [
      { label: "Maximum capacity", value: "9000 kg" },
      { label: "Dimension", value: AVAILABLE_SPECIFICATION },
      { label: "Application", value: "Factory loading bay" },
      { label: "Operation", value: CUSTOM_SPECIFICATION },
    ],
    variants: [],
    images: [
      catalogueImage(images.installation, "Dock leveler at a loading bay", "Factory dock leveler"),
      catalogueImage(images.forklift, "Material handling at loading bay", "Dock loading and unloading"),
    ],
    featured: true,
    order: 24,
    seo: catalogueSeo(
      "Dock Leveler | Rack & Stack",
      "Factory loading-bay dock leveler for loading and unloading operations, with a maximum capacity of 9000 kg.",
      images.installation,
    ),
  },
  {
    id: "material-006",
    name: "High Level Front Dumper",
    slug: "high-level-front-dumper",
    category: "material-handling",
    shortDescription: "A front-dumping unit that can tilt a drum upside down through 180 degrees.",
    longDescription: "The High Level Front Dumper can tilt a drum upside down through 180 degrees. Final load capacity and dimensions are selected according to the project requirement.",
    applications: [
      "Drum tilting",
      "Drum dumping",
      "Material handling",
    ],
    industries: [
      "Manufacturing",
      "Warehousing",
      "Chemical handling",
      "Logistics",
    ],
    features: [
      {
        title: "180-degree tilt",
        description: "The drum can be tilted upside down through 180 degrees.",
      },
      {
        title: "Front-dump arrangement",
        description: "Positioned for high-level front-dumping requirements.",
      },
      {
        title: "Drum handling",
        description: "Supports controlled drum-tilting operations.",
      },
      {
        title: "Project-specific capacity",
        description: "Load capacity and dimensions are selected by requirement.",
      },
    ],
    specifications: [
      { label: "Tilt angle", value: "180 degrees" },
      { label: "Load capacity", value: AVAILABLE_SPECIFICATION },
      { label: "Dimension", value: AVAILABLE_SPECIFICATION },
      { label: "Operation", value: CUSTOM_SPECIFICATION },
    ],
    variants: [],
    images: [
      catalogueImage(images.installation, "High-level front dumper", "Drum tilting equipment"),
      catalogueImage(images.warehouse, "Drum dumping area", "High-level front-dump handling"),
    ],
    featured: false,
    order: 25,
    seo: catalogueSeo(
      "High Level Front Dumper | Rack & Stack",
      "High-level front dumper for drum-handling applications, able to tilt a drum upside down through 180 degrees.",
      images.installation,
    ),
  },
  {
    id: "material-007",
    name: "Manual Mechanical Stacker",
    slug: "manual-mechanical-stacker",
    category: "material-handling",
    shortDescription: "A manually operated stacker for loads from 100–500 kg with a lifted height of 2000 mm.",
    longDescription: "The Manual Mechanical Stacker has a load capacity of 100–500 kg and a lifted height of 2000 mm. It uses manual operation and does not require electrical power.",
    applications: [
      "Manual load lifting",
      "Warehouse handling",
      "Pallet movement",
    ],
    industries: [
      "Warehousing",
      "Manufacturing",
      "Logistics",
      "Retail",
      "Distribution Centers",
    ],
    features: [
      {
        title: "Manual operation",
        description: "Operates without electrical power.",
      },
      {
        title: "100–500 kg capacity",
        description: "The listed load capacity ranges from 100–500 kg.",
      },
      {
        title: "2000 mm lifted height",
        description: "The listed lifted height is 2000 mm.",
      },
      {
        title: "No electrical power required",
        description: "Can be used where electrical power is not required.",
      },
    ],
    specifications: [
      { label: "Load Capacity", value: "100–500 kg" },
      { label: "Lifted height", value: "2000 mm" },
      { label: "Operation", value: "Manual operation" },
      { label: "Electrical Power", value: "Not required" },
    ],
    variants: [],
    images: [
      catalogueImage(images.warehouse, "Manual mechanical stacker", "Manual stacker handling a load"),
      catalogueImage(images.installation, "Manual warehouse lifting", "Stacker without electrical power"),
    ],
    featured: true,
    order: 26,
    seo: catalogueSeo(
      "Manual Mechanical Stacker | Rack & Stack",
      "Manual mechanical stacker with 100–500 kg load capacity, 2000 mm lifted height and no electrical power requirement.",
      images.warehouse,
    ),
  },
  {
    id: "material-008",
    name: "Battery Hydraulic Stacker",
    slug: "battery-hydraulic-stacker",
    category: "material-handling",
    shortDescription: "A battery-powered hydraulic stacker with 500–1200 kg capacity and lifting up to 4000 mm.",
    longDescription: "The Battery Hydraulic Stacker has a load capacity of 500–1200 kg and a lifted height up to 4000 mm. Battery power is used to operate the stacker, allowing it to be moved without wires.",
    applications: [
      "Battery-powered load lifting",
      "Warehouse handling",
      "Pallet movement",
    ],
    industries: [
      "Warehousing",
      "Manufacturing",
      "Logistics",
      "Distribution Centers",
    ],
    features: [
      {
        title: "Battery-powered",
        description: "Battery power is used for operation.",
      },
      {
        title: "500–1200 kg capacity",
        description: "The listed load capacity ranges from 500–1200 kg.",
      },
      {
        title: "Up to 4000 mm lifting",
        description: "The listed lifted height is up to 4000 mm.",
      },
      {
        title: "No operating wires",
        description: "The battery-powered stacker can be moved without wires.",
      },
    ],
    specifications: [
      { label: "Load Capacity", value: "500–1200 kg" },
      { label: "Lifted height", value: "up to 4000 mm" },
      { label: "Power source", value: "Battery Power" },
      { label: "Operation", value: "Battery operated" },
    ],
    variants: [],
    images: [
      catalogueImage(images.forklift, "Battery hydraulic stacker", "Battery-powered warehouse stacker"),
      catalogueImage(images.warehouse, "Powered stacker in warehouse", "Battery hydraulic material handling"),
    ],
    featured: true,
    order: 27,
    seo: catalogueSeo(
      "Battery Hydraulic Stacker | Rack & Stack",
      "Battery hydraulic stacker with 500–1200 kg capacity and up to 4000 mm lifted height, operable without wires.",
      images.forklift,
    ),
  },
  {
    id: "material-009",
    name: "Floor Crane",
    slug: "floor-crane",
    category: "material-handling",
    shortDescription: "A floor crane with load capacity up to 2000 kg in manual or electric hydraulic operation.",
    longDescription: "The Floor Crane has a load capacity ranging up to 2000 kg. It is available in both manual and electric hydraulic modes of operation.",
    applications: [
      "Floor-based load lifting",
      "Material movement",
      "Warehouse handling",
    ],
    industries: [
      "Manufacturing",
      "Warehousing",
      "Logistics",
      "Steel and metal handling",
    ],
    features: [
      {
        title: "Up to 2000 kg",
        description: "The listed load capacity ranges up to 2000 kg.",
      },
      {
        title: "Two operation modes",
        description: "Available in manual and electric hydraulic modes.",
      },
      {
        title: "Floor-crane format",
        description: "Designed for floor-based material-handling requirements.",
      },
      {
        title: "Application-led selection",
        description: "The operating mode is selected according to the project.",
      },
    ],
    specifications: [
      { label: "Load capacity", value: "up to 2000 kg" },
      { label: "Operation", value: "Manual and Electric Hydraulic modes" },
      { label: "Lift height", value: AVAILABLE_SPECIFICATION },
      { label: "Dimension", value: CUSTOM_SPECIFICATION },
    ],
    variants: ["Manual Hydraulic", "Electric Hydraulic"],
    images: [
      catalogueImage(images.forklift, "Floor crane in an industrial space", "Floor crane material handling"),
      catalogueImage(images.installation, "Floor crane operating area", "Manual and electric hydraulic crane"),
    ],
    featured: true,
    order: 28,
    seo: catalogueSeo(
      "Floor Crane | Rack & Stack",
      "Floor crane with load capacity up to 2000 kg, available in manual and electric hydraulic modes of operation.",
      images.forklift,
    ),
  },
  {
    id: "material-010",
    name: "Multi Scissors Lift Platform",
    slug: "multi-scissors-lift-platform",
    category: "material-handling",
    shortDescription: "An electro-hydraulic lifting platform with a maximum load capacity of 2500 kg.",
    longDescription: "The Multi Scissors Lift Platform has a maximum load capacity of 2500 kg and uses electro-hydraulic operation.",
    applications: [
      "Platform lifting",
      "Material handling",
      "Warehouse elevation",
    ],
    industries: [
      "Manufacturing",
      "Warehousing",
      "Logistics",
      "Distribution Centers",
    ],
    features: [
      {
        title: "2500 kg maximum load",
        description: "The stated maximum load capacity is 2500 kg.",
      },
      {
        title: "Electro-hydraulic operation",
        description: "Uses an electro-hydraulic operating arrangement.",
      },
      {
        title: "Scissor platform format",
        description: "A multi-scissor platform for lifting-handling requirements.",
      },
      {
        title: "Project-specific sizing",
        description: "Platform dimensions are selected according to the project.",
      },
    ],
    specifications: [
      { label: "Maximum load capacity", value: "2500 kg" },
      { label: "Operation", value: "Electro hydraulic" },
      { label: "Platform size", value: AVAILABLE_SPECIFICATION },
      { label: "Lift height", value: CUSTOM_SPECIFICATION },
    ],
    variants: [],
    images: [
      catalogueImage(images.forklift, "Multi scissors lift platform", "Electro-hydraulic lifting platform"),
      catalogueImage(images.warehouse, "Scissor platform in warehouse", "Multi-scissor material handling"),
    ],
    featured: true,
    order: 29,
    seo: catalogueSeo(
      "Multi Scissors Lift Platform | Rack & Stack",
      "Multi scissors lift platform with maximum load capacity of 2500 kg and electro-hydraulic operation.",
      images.forklift,
    ),
  },
  {
    id: "material-011",
    name: "Hydraulic Stacker",
    slug: "hydraulic-stacker",
    category: "material-handling",
    shortDescription: "A hydraulic stacker configured to project-specific handling and lifting requirements.",
    longDescription: "The Hydraulic Stacker is provided for material-lifting and handling requirements. Its capacity, dimensions and lifting height are selected according to the project requirement.",
    applications: [
      "Hydraulic load lifting",
      "Warehouse handling",
      "Material movement",
    ],
    industries: [
      "Manufacturing",
      "Warehousing",
      "Logistics",
      "Distribution Centers",
    ],
    features: [
      {
        title: "Hydraulic operation",
        description: "Uses a hydraulic arrangement for material handling.",
      },
      {
        title: "Project-specific lifting",
        description: "Lifting height and capacity are selected for the application.",
      },
      {
        title: "Warehouse handling",
        description: "Supports lifting requirements in material-handling areas.",
      },
      {
        title: "Configuration-led selection",
        description: "Final dimensions and operating details follow the requirement.",
      },
    ],
    specifications: [
      { label: "Operation", value: "Hydraulic" },
      { label: "Load capacity", value: AVAILABLE_SPECIFICATION },
      { label: "Lifted height", value: AVAILABLE_SPECIFICATION },
      { label: "Dimension", value: CUSTOM_SPECIFICATION },
    ],
    variants: [],
    images: [
      catalogueImage(images.warehouse, "Hydraulic stacker", "Hydraulic material lifting"),
      catalogueImage(images.installation, "Stacker handling warehouse goods", "Project-configured hydraulic stacker"),
    ],
    featured: false,
    order: 30,
    seo: catalogueSeo(
      "Hydraulic Stacker | Rack & Stack",
      "Hydraulic stacker for warehouse and industrial lifting, with capacity, dimensions and height configured to project requirements.",
      images.warehouse,
    ),
  },
  {
    id: "material-012",
    name: "Scissors Lift Platform",
    slug: "scissors-lift-platform",
    category: "material-handling",
    shortDescription: "A scissor-style lifting platform configured to project-specific material-handling needs.",
    longDescription: "The Scissors Lift Platform provides a scissor-style platform for material-lifting requirements. Its load capacity, platform size and lifting height are selected according to the project requirement.",
    applications: [
      "Platform lifting",
      "Material elevation",
      "Warehouse handling",
    ],
    industries: [
      "Manufacturing",
      "Warehousing",
      "Logistics",
      "Distribution Centers",
    ],
    features: [
      {
        title: "Scissor platform format",
        description: "Uses a scissor-style platform arrangement.",
      },
      {
        title: "Material elevation",
        description: "Supports lifting and elevation requirements.",
      },
      {
        title: "Project-specific capacity",
        description: "Load capacity is selected according to the intended use.",
      },
      {
        title: "Configurable platform",
        description: "Platform size and lift height follow project requirements.",
      },
    ],
    specifications: [
      { label: "Load capacity", value: AVAILABLE_SPECIFICATION },
      { label: "Platform size", value: AVAILABLE_SPECIFICATION },
      { label: "Lift height", value: AVAILABLE_SPECIFICATION },
      { label: "Operation", value: CUSTOM_SPECIFICATION },
    ],
    variants: [],
    images: [
      catalogueImage(images.forklift, "Scissors lift platform", "Scissor-style lifting platform"),
      catalogueImage(images.warehouse, "Lift platform in a warehouse", "Scissor platform material handling"),
    ],
    featured: false,
    order: 31,
    seo: catalogueSeo(
      "Scissors Lift Platform | Rack & Stack",
      "Scissors lift platform for industrial material handling, configured by project load capacity, platform size and lifting height.",
      images.forklift,
    ),
  },
  {
    id: "material-013",
    name: "Porter Goods Lifting Platform",
    slug: "porter-goods-lifting-platform",
    category: "material-handling",
    shortDescription: "A stationary goods lift with a capacity range of 1000–5000 kg and guided platform stability.",
    longDescription: "Porter goods lifting platforms are stationary lifts that carry goods from one level to another. Capacity ranges from 1000–5000 kg. The platform is guided by two vertical guide masts for better stability.",
    applications: [
      "Goods lift between levels",
      "Stationary material lifting",
      "Warehouse handling",
    ],
    industries: [
      "Warehousing",
      "Manufacturing",
      "Logistics",
      "Distribution Centers",
    ],
    features: [
      {
        title: "Stationary goods lift",
        description: "Carries goods from one level to another.",
      },
      {
        title: "1000–5000 kg capacity",
        description: "The listed capacity range is 1000–5000 kg.",
      },
      {
        title: "Guided platform",
        description: "Two vertical guide masts provide better platform stability.",
      },
      {
        title: "Level-to-level handling",
        description: "Supports stationary lifting between defined levels.",
      },
    ],
    specifications: [
      { label: "Capacity", value: "1000–5000 kg" },
      { label: "Platform type", value: "Stationary goods lift" },
      { label: "Movement", value: "One level to another level" },
      { label: "Guide system", value: "Two vertical guide masts" },
    ],
    variants: [],
    images: [
      catalogueImage(images.forklift, "Porter goods lifting platform", "Stationary goods lifting platform"),
      catalogueImage(images.warehouse, "Goods lift in warehouse", "Guided goods lifting platform"),
    ],
    featured: true,
    order: 32,
    seo: catalogueSeo(
      "Porter Goods Lifting Platform | Rack & Stack",
      "Stationary porter goods lifting platform with 1000–5000 kg capacity and two vertical guide masts for stability.",
      images.forklift,
    ),
  },
] satisfies CatalogueProduct[];

export const catalogueProducts: readonly CatalogueProduct[] = [
  ...officeProducts,
  ...industrialProducts,
  ...materialHandlingProducts,
];

export function getCatalogueProductBySlug(slug: string): CatalogueProduct | undefined {
  return catalogueProducts.find((product) => product.slug === slug);
}

export function getCatalogueProductsByCategory(category: CatalogueCategorySlug | string): CatalogueProduct[] {
  return catalogueProducts.filter((product) => product.category === category);
}

export function getCatalogueProductHref(product: CatalogueProduct | string): string {
  const resolvedProduct = typeof product === "string" ? getCatalogueProductBySlug(product) : product;

  if (!resolvedProduct) return "/products";

  return `/products/${resolvedProduct.category}/${resolvedProduct.slug}`;
}

export function getRelatedCatalogueProducts(product: CatalogueProduct | string, limit = 3): CatalogueProduct[] {
  const resolvedProduct = typeof product === "string" ? getCatalogueProductBySlug(product) : product;
  const maximum = Math.max(0, Math.trunc(limit));

  if (!resolvedProduct || maximum === 0) return [];

  const categoryProducts = catalogueProducts.filter(
    (item) => item.category === resolvedProduct.category && item.slug !== resolvedProduct.slug,
  );
  const additionalProducts = catalogueProducts.filter(
    (item) => item.category !== resolvedProduct.category && item.slug !== resolvedProduct.slug,
  );

  return [...categoryProducts, ...additionalProducts].slice(0, maximum);
}

export function getCatalogueSearchText(product: CatalogueProduct | string): string {
  const resolvedProduct = typeof product === "string" ? getCatalogueProductBySlug(product) : product;

  if (!resolvedProduct) return "";

  return [
    resolvedProduct.name,
    resolvedProduct.slug,
    resolvedProduct.shortDescription,
    resolvedProduct.longDescription,
    ...resolvedProduct.applications,
    ...resolvedProduct.industries,
    ...resolvedProduct.features.flatMap((feature) => [feature.title, feature.description]),
    ...resolvedProduct.specifications.flatMap((specification) => [specification.label, specification.value]),
    ...resolvedProduct.variants,
  ]
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export const catalogueCategoryNames: Record<CatalogueCategorySlug, string> = {
  "office-storage": "Office Storage Systems",
  "industrial-storage": "Industrial Storage Systems",
  "material-handling": "Material Handling Equipment",
};

const productTypes: Record<string, string> = {
  "office-001": "Mobile compactor",
  "office-002": "Push-pull compactor",
  "office-003": "Office cupboard",
  "office-004": "Filing cabinet",
  "office-005": "Filing cabinet",
  "office-006": "Filing cabinet",
  "office-007": "Filing cabinet",
  "office-008": "Office pedestal",
  "office-009": "Office table",
  "office-010": "Lockers",
  "office-011": "Lockers",
  "office-012": "Lockers",
  "office-013": "Lockers",
  "industrial-001": "Slotted angle rack",
  "industrial-002": "Long span shelving",
  "industrial-003": "Pallet racking",
  "industrial-004": "Multi-tier racking",
  "industrial-005": "Mezzanine floor",
  "industrial-006": "Cantilever racking",
  "material-001": "Pallet",
  "material-002": "Pallet",
  "material-003": "Pallet truck",
  "material-004": "Drum trolley",
  "material-005": "Dock leveler",
  "material-006": "Front dumper",
  "material-007": "Manual stacker",
  "material-008": "Battery stacker",
  "material-009": "Floor crane",
  "material-010": "Scissor lift",
  "material-011": "Hydraulic stacker",
  "material-012": "Scissor lift",
  "material-013": "Goods lifting platform",
};

export function getCatalogueCategory(slug: string): CatalogueCategory | undefined {
  return catalogueCategories.find((category) => category.slug === slug);
}

export function getCatalogueProductType(product: CatalogueProduct | string): string {
  const resolvedProduct = typeof product === "string" ? getCatalogueProductBySlug(product) : product;
  if (!resolvedProduct) return "";
  return productTypes[resolvedProduct.id] ?? "Storage and handling equipment";
}

export function getCatalogueApplications(products: readonly CatalogueProduct[] = catalogueProducts): string[] {
  return Array.from(new Set(products.flatMap((product) => product.applications))).sort((a, b) => a.localeCompare(b));
}

export function getCatalogueIndustries(products: readonly CatalogueProduct[] = catalogueProducts): string[] {
  return Array.from(new Set(products.flatMap((product) => product.industries))).sort((a, b) => a.localeCompare(b));
}

export function getCatalogueProductTypes(products: readonly CatalogueProduct[] = catalogueProducts): string[] {
  return Array.from(new Set(products.map((product) => getCatalogueProductType(product)))).sort((a, b) => a.localeCompare(b));
}
