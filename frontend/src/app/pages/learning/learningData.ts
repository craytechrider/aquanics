// Real curated aquaponics learning content
export type ModuleType = "video" | "article" | "link";

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  type: ModuleType;
  category: string;
  thumbnail: string;
  url: string;
  duration?: string;
  readTime?: string;
  source: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  tags: string[];
}

export const LEARNING_CATEGORIES = [
  "All",
  "Getting Started",
  "Water Chemistry",
  "Fish Care",
  "Plant Growth",
  "System Design",
  "Troubleshooting",
];

export const LEARNING_MODULES: LearningModule[] = [
  // ============================================================
  // GETTING STARTED
  // ============================================================

  {
    id: "1",
    title: "Aquaponics: Introduction & How It Works",
    description:
      "Learn the fundamentals of aquaponics and how fish, plants, and beneficial bacteria work together in a recirculating ecosystem.",
    type: "article",
    category: "Getting Started",
    thumbnail:
      "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&h=400&fit=crop",
    url: "https://www.fao.org/family-farming/detail/en/c/1743021/",
    readTime: "10 min read",
    source: "FAO — Food and Agriculture Organization",
    difficulty: "Beginner",
    tags: ["introduction", "basics", "aquaponics", "overview"],
  },

  {
    id: "2",
    title: "Small-Scale Aquaponic Food Production",
    description:
      "A comprehensive FAO manual covering aquaponics fundamentals, nitrogen cycling, water quality, fish, plants, system design, management, and troubleshooting.",
    type: "article",
    category: "Getting Started",
    thumbnail:
      "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&h=400&fit=crop",
    url: "https://www.fao.org/4/i4021e/i4021e.pdf",
    readTime: "Full technical manual",
    source: "FAO — Small-scale Aquaponic Food Production",
    difficulty: "Beginner",
    tags: ["guide", "beginner", "setup", "fish", "plants", "water quality"],
  },

  {
    id: "3",
    title: "Aquaponics: Cut Water Usage",
    description:
      "A Purdue University educational video explaining aquaponics and how recirculating systems can reduce water use while producing fish and plants.",
    type: "video",
    category: "Getting Started",
    thumbnail: "https://img.youtube.com/vi/26xpMCXP9bw/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=26xpMCXP9bw",
    duration: "Educational video",
    source: "Purdue University",
    difficulty: "Beginner",
    tags: ["water", "basics", "introduction", "sustainability"],
  },

  // ============================================================
  // WATER CHEMISTRY
  // ============================================================

  {
    id: "4",
    title: "Understanding the Nitrogen Cycle",
    description:
      "Understand how fish waste produces ammonia, how beneficial bacteria convert ammonia and nitrite, and how plants use the resulting nutrients.",
    type: "article",
    category: "Water Chemistry",
    thumbnail:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop",
    url: "https://www.fao.org/4/i4021e/i4021e.pdf",
    readTime: "Technical manual",
    source: "FAO — Aquaponics Manual",
    difficulty: "Beginner",
    tags: ["nitrogen cycle", "ammonia", "nitrite", "nitrate", "bacteria"],
  },

  {
    id: "5",
    title: "Aquaponics Water Quality",
    description:
      "Learn about important water-quality parameters including ammonia, nitrite, nitrate, temperature and other factors involved in maintaining a balanced aquaponic ecosystem.",
    type: "article",
    category: "Water Chemistry",
    thumbnail:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop",
    url: "https://www.fao.org/family-farming/detail/en/c/1743021/",
    readTime: "Technical reference",
    source: "FAO",
    difficulty: "Intermediate",
    tags: ["pH", "ammonia", "nitrite", "nitrate", "water quality"],
  },

  {
    id: "6",
    title: "Seven Rules of Thumb for Aquaponics",
    description:
      "A concise FAO guide covering practical principles for maintaining a healthy and balanced aquaponic system.",
    type: "link",
    category: "Water Chemistry",
    thumbnail:
      "https://images.unsplash.com/photo-1582560475093-ba66accbc424?w=600&h=400&fit=crop",
    url: "https://www.fao.org/newsroom/story/Seven-rules-of-thumb-to-follow-in-aquaponics/en",
    source: "FAO",
    difficulty: "Intermediate",
    tags: ["water", "balance", "management", "pH", "plants", "fish"],
  },

  // ============================================================
  // FISH CARE
  // ============================================================

  {
    id: "7",
    title: "Fish Selection for Aquaponics",
    description:
      "Learn how fish selection affects temperature requirements, stocking, feeding, system balance, and overall aquaponic production.",
    type: "article",
    category: "Fish Care",
    thumbnail:
      "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=600&h=400&fit=crop",
    url: "https://www.fao.org/4/i4021e/i4021e.pdf",
    readTime: "Technical manual",
    source: "FAO — Aquaponics Manual",
    difficulty: "Beginner",
    tags: ["tilapia", "fish", "stocking", "selection"],
  },

  {
    id: "8",
    title: "Fish Health & Aquaponics Management",
    description:
      "Learn about maintaining healthy fish and identifying problems that can indicate poor water quality or an unbalanced system.",
    type: "article",
    category: "Fish Care",
    thumbnail:
      "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600&h=400&fit=crop",
    url: "https://www.fao.org/family-farming/detail/en/c/1617686/",
    readTime: "Practical guide",
    source: "FAO — Management of Aquaponic Systems",
    difficulty: "Intermediate",
    tags: ["fish health", "disease", "management", "fish care"],
  },

  {
    id: "9",
    title: "Fish Health, Diseases & Prevention",
    description:
      "The FAO aquaponics manual includes dedicated material on common fish diseases, symptoms, causes and compatible management approaches.",
    type: "link",
    category: "Fish Care",
    thumbnail:
      "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600&h=400&fit=crop",
    url: "https://www.fao.org/4/i4021e/i4021e.pdf",
    source: "FAO — Small-scale Aquaponic Food Production",
    difficulty: "Advanced",
    tags: ["fish health", "disease", "prevention", "symptoms"],
  },

  // ============================================================
  // PLANT GROWTH
  // ============================================================

  {
    id: "10",
    title: "Plants in Aquaponics",
    description:
      "Learn how plants contribute to the aquaponic ecosystem by absorbing nutrients from the water while helping clean the recirculating system.",
    type: "article",
    category: "Plant Growth",
    thumbnail:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop",
    url: "https://www.fao.org/4/i4021e/i4021e.pdf",
    readTime: "Technical manual",
    source: "FAO — Aquaponics Manual",
    difficulty: "Beginner",
    tags: ["plants", "lettuce", "vegetables", "nutrients"],
  },

  {
    id: "11",
    title: "Plant Nutrient Deficiencies",
    description:
      "Learn how plant health can indicate an imbalance in the aquaponic system and how symptoms such as poor growth and yellow leaves can help identify problems.",
    type: "article",
    category: "Plant Growth",
    thumbnail:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop",
    url: "https://www.fao.org/4/i4021e/i4021e.pdf",
    readTime: "Technical manual",
    source: "FAO — Aquaponics Manual",
    difficulty: "Intermediate",
    tags: ["nutrients", "deficiency", "plant health", "growth"],
  },

  {
    id: "12",
    title: "Media Bed vs NFT vs DWC",
    description:
      "Compare the three common aquaponic approaches: media beds, nutrient film technique (NFT), and deep water culture (DWC).",
    type: "link",
    category: "Plant Growth",
    thumbnail:
      "https://images.unsplash.com/photo-1587334274328-64186a80edd3?w=600&h=400&fit=crop",
    url: "https://www.fao.org/family-farming/detail/en/c/1617857/",
    source: "FAO — Designing an Aquaponic Unit",
    difficulty: "Intermediate",
    tags: ["media bed", "NFT", "DWC", "raft", "design"],
  },

  // ============================================================
  // SYSTEM DESIGN
  // ============================================================

  {
    id: "13",
    title: "Aquaponics System Design",
    description:
      "Learn about the major components and design considerations involved in building an aquaponic unit.",
    type: "video",
    category: "System Design",
    thumbnail: "https://img.youtube.com/vi/7epBXwsdr70/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=7epBXwsdr70",
    duration: "13 min",
    source: "Rob Bob's Aquaponics & Backyard Farm",
    difficulty: "Intermediate",
    tags: ["design", "pump", "filter", "tank", "plumbing"],
  },

  {
    id: "14",
    title: "IoT & Smart Monitoring for Aquaponics",
    description:
      "Explore research on technology and monitoring approaches that can be applied to aquaponic systems, including sensors and automated monitoring.",
    type: "article",
    category: "System Design",
    thumbnail:
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop",
    url: "https://www.mdpi.com/2073-4441/13/21/3091",
    readTime: "15 min read",
    source: "MDPI — Water",
    difficulty: "Advanced",
    tags: ["IoT", "sensors", "automation", "smart farming"],
  },

  {
    id: "15",
    title: "Aquaponics Business Planning",
    description:
      "Learn about planning and operating an aquaponics farm, including market analysis, customers, products and business planning.",
    type: "link",
    category: "System Design",
    thumbnail:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=400&fit=crop",
    url: "https://www.epa.gov/land-revitalization/aquaponics-business-plan-user-guide",
    source: "U.S. EPA",
    difficulty: "Advanced",
    tags: ["commercial", "business", "scaling", "planning"],
  },

  // ============================================================
  // TROUBLESHOOTING
  // ============================================================

  {
    id: "16",
    title: "Aquaponics Troubleshooting",
    description:
      "Use the FAO aquaponics manual to investigate common problems involving fish, plants, water quality, system balance and management.",
    type: "article",
    category: "Troubleshooting",
    thumbnail:
      "https://images.unsplash.com/photo-1585399000684-d2f72660f092?w=600&h=400&fit=crop",
    url: "https://www.fao.org/4/i4021e/i4021e.pdf",
    readTime: "Technical manual",
    source: "FAO — Aquaponics Manual",
    difficulty: "Beginner",
    tags: ["problems", "fixes", "troubleshooting", "water quality"],
  },

  {
    id: "17",
    title: "Managing an Aquaponic System",
    description:
      "Learn the major management phases involved in starting and operating an aquaponic system throughout a growing season.",
    type: "article",
    category: "Troubleshooting",
    thumbnail:
      "https://images.unsplash.com/photo-1585399000684-d2f72660f092?w=600&h=400&fit=crop",
    url: "https://www.fao.org/family-farming/detail/en/c/1617686/",
    readTime: "Practical guide",
    source: "FAO",
    difficulty: "Beginner",
    tags: ["cycling", "management", "maintenance", "startup"],
  },

  {
    id: "18",
    title: "Deep Water Culture Aquaponics",
    description:
      "Learn how deep water culture works, including its major components and construction considerations for aquaponic production.",
    type: "link",
    category: "Troubleshooting",
    thumbnail:
      "https://images.unsplash.com/photo-1518882570630-68de19f7e4a8?w=600&h=400&fit=crop",
    url: "https://www.fao.org/family-farming/detail/en/c/1617689/",
    source: "FAO — Deep Water Culture Aquaponic Unit",
    difficulty: "Intermediate",
    tags: ["DWC", "raft", "water", "construction"],
  },
];
