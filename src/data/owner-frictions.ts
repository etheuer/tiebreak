import type { Product } from '@/lib/data'

export type FrictionTag = 'Ergonomics' | 'Hardware Quirk' | 'Software / Apps' | 'Maintenance' | 'Hidden Cost'

export type OwnerFriction = {
  tag: FrictionTag
  complaint: string
  context: string
}

export type ProductFrictions = {
  productId: string
  frictions: OwnerFriction[]
}

const OWNER_FRICTIONS_REGISTRY: Record<string, OwnerFriction[]> = {
  // Headphones
  'sony-wh-1000xm5': [
    {
      tag: 'Ergonomics',
      complaint: 'Non-folding headband takes up significantly more backpack space.',
      context: 'Unlike the XM4 which collapsed into a compact taco case, the XM5 earcups only swivel flat, requiring a bulky briefcase-sized carry case.',
    },
    {
      tag: 'Software / Apps',
      complaint: 'Auto-NC Optimizer cannot be manually locked to maximum.',
      context: 'The active noise cancellation automatically adjusts based on ambient barometric pressure and head movement, which some users find causes sudden subtle pressure shifts.',
    },
    {
      tag: 'Hardware Quirk',
      complaint: 'Matte plastic coating shows greasy finger smudge marks easily.',
      context: 'Both black and silver finishes absorb fingertip skin oils quickly, requiring frequent microfiber wiping.',
    },
  ],
  'sony-wh-1000xm4': [
    {
      tag: 'Hardware Quirk',
      complaint: 'Microphones struggle significantly in windy outdoor conditions.',
      context: 'Callers frequently report muffling or wind blast noise when taking phone calls outdoors or near busy intersections.',
    },
    {
      tag: 'Ergonomics',
      complaint: 'Shallow earcups cause ear cartilage to touch inner driver grille.',
      context: 'Users with slightly larger or prominent ears report slight aching or cartilage fatigue after 90+ minutes of continuous wear.',
    },
  ],
  'apple-airpods-max': [
    {
      tag: 'Ergonomics',
      complaint: 'Heavy 385g weight creates neck fatigue during long flights.',
      context: 'At nearly 135 grams heavier than Bose or Sony rivals, the steel and aluminum build can feel fatiguing on the crown and cervical spine after 2 hours.',
    },
    {
      tag: 'Hardware Quirk',
      complaint: 'Smart Case offers virtually zero physical drop or travel protection.',
      context: 'The minimalist magnetic sleeve leaves the delicate mesh canopy and aluminum earcups completely exposed to keys and pens inside a bag.',
    },
    {
      tag: 'Maintenance',
      complaint: 'Condensation buildup inside earcups under mesh cushions.',
      context: 'The cold aluminum earcups cause warm body vapor to condense into visible moisture droplets behind the removable magnetic ear pads.',
    },
  ],
  'bose-quietcomfort-ultra': [
    {
      tag: 'Hardware Quirk',
      complaint: 'Capacitive touch volume strip can be overly sensitive.',
      context: 'Adjusting the fit or brushing against airplane pillows can accidentally trigger unintended volume spikes or pause audio.',
    },
    {
      tag: 'Software / Apps',
      complaint: 'Occasional Bluetooth multi-point audio handover stutter.',
      context: 'Users switching rapidly between a phone call and computer audio report sporadic 1–2 second audio hiccups.',
    },
  ],

  // TVs
  'lg-g3-oled': [
    {
      tag: 'Hidden Cost',
      complaint: 'Zero tabletop stand included in the box.',
      context: 'Engineered as a flush gallery wall-mount TV. If you do not intend to drill into wall studs, the official LG swivel stand is an extra ~$149 purchase.',
    },
    {
      tag: 'Hardware Quirk',
      complaint: 'Subtle green/pink tint shift at extreme off-axis viewing angles.',
      context: 'The Micro Lens Array (MLA) layer refracts light dramatically to boost brightness, but can introduce a mild chromatic tint when viewed past 45 degrees.',
    },
  ],
  'lg-g4-oled': [
    {
      tag: 'Hidden Cost',
      complaint: '65" and larger models still omit tabletop stands in the US box.',
      context: 'Buyers planning to place the 65" or 77" on a media console must budget for a third-party or OEM VESA stand.',
    },
    {
      tag: 'Software / Apps',
      complaint: 'webOS home screen features sponsored content & banner recommendations.',
      context: 'Navigating the smart interface prompts promotional banners unless manually restricted via deep privacy settings.',
    },
  ],
  'samsung-q90c': [
    {
      tag: 'Software / Apps',
      complaint: 'Lack of Dolby Vision HDR format support.',
      context: 'Samsung refuses to license Dolby Vision, falling back to standard HDR10 on Netflix, Disney+, and Apple TV+ streams.',
    },
    {
      tag: 'Hardware Quirk',
      complaint: 'Rainbow horizontal flare streaks under intense direct side lighting.',
      context: 'The wide viewing angle anti-reflective optical layer can stretch pinpoint lamp reflections into horizontal rainbow bands across the panel.',
    },
  ],
  'sony-a95l': [
    {
      tag: 'Hardware Quirk',
      complaint: 'Only 2 full-bandwidth HDMI 2.1 ports (one shared with eARC soundbar).',
      context: 'If you plug in an eARC soundbar or AV receiver, you only have a single remaining 4K/120Hz port for gaming consoles (PS5 / Xbox Series X / PC).',
    },
    {
      tag: 'Ergonomics',
      complaint: 'Extreme edge feet demand an extra-wide 56"+ media console table.',
      context: 'The included stand legs sit at the outer perimeter edges, making it impossible to sit on standard compact entertainment centers without replacing furniture.',
    },
  ],

  // Cordless Vacuums
  'dyson-v15-detect': [
    {
      tag: 'Ergonomics',
      complaint: 'Continuous trigger hold causes index finger and grip fatigue.',
      context: 'You must hold down the power trigger continuously during the entire vacuum session. There is no on/off toggle lock on standard models.',
    },
    {
      tag: 'Maintenance',
      complaint: 'Emptying fine plaster or drywall dust can jam the silicone squeegee.',
      context: 'Very fine powder can stick to the inner cyclonic shroud, requiring periodic disassembly and manual wiping.',
    },
  ],
  'dyson-gen5detect': [
    {
      tag: 'Ergonomics',
      complaint: 'Heavier 7.7 lb weight strains forearms during prolonged use.',
      context: 'The larger motor and internal wand tool add over a pound of top-heavy weight compared to the nimble V12 or V8 models.',
    },
  ],
  'dyson-v12-detect-slim': [
    {
      tag: 'Hardware Quirk',
      complaint: 'Tiny 0.10-gallon dustbin requires emptying 2–3 times per cleaning.',
      context: 'The compact canister fills up rapidly in homes with multiple shedding pets, interrupting cleaning flow.',
    },
  ],
  'samsung-bespoke-jet-ai': [
    {
      tag: 'Hidden Cost',
      complaint: 'Requires ongoing purchases of Clean Station disposal dust bags.',
      context: 'While hygienic, the auto-empty clean station relies on proprietary sealed disposable bags that cost ~$35–$45 per year in recurring consumables.',
    },
  ],
  'shark-stratos': [
    {
      tag: 'Ergonomics',
      complaint: 'Heavy top handle weight (nearly 9 lbs total).',
      context: 'While the folding wand bends easily under furniture, lifting the main motor unit to reach ceiling corners or cobwebs requires serious bicep effort.',
    },
  ],

  // Air Purifiers
  'levoit-core-300s': [
    {
      tag: 'Hardware Quirk',
      complaint: 'No true HEPA H13 rating on recent replacement filters.',
      context: 'Due to US regulatory naming updates, Levoit adjusted terminology from "True HEPA" to "HEPASmart" on several retail filter packs.',
    },
    {
      tag: 'Maintenance',
      complaint: 'Filter check light does not measure real dirt; it operates on a fixed timer.',
      context: 'The filter replacement alert triggers every 6 months regardless of whether your room was smoky or pristine, requiring manual reset.',
    },
  ],
  'blueair-blue-pure-311i-max': [
    {
      tag: 'Maintenance',
      complaint: 'Outer fabric pre-filter attracts visible pet fur and lint.',
      context: 'The decorative fabric outer sleeve functions as the coarse pre-filter, requiring weekly vacuuming to avoid looking dusty in living rooms.',
    },
  ],
  'coway-airmega-ap-1512hh': [
    {
      tag: 'Hardware Quirk',
      complaint: 'Ionizer ("Vital Ion") produces negligible ozone and should be disabled.',
      context: 'Many asthma and allergy sufferers immediately toggle the optional ionizer off to ensure completely emission-free mechanical HEPA filtration.',
    },
  ],
  'dyson-purifier-hot-cool-hp09': [
    {
      tag: 'Hidden Cost',
      complaint: 'High replacement filter cost (~$80 each).',
      context: 'The catalytic formaldehyde combo filter is significantly more expensive than standard box purifiers from Levoit or Coway.',
    },
  ],

  // Laptops
  'dell-xps-13-9340': [
    {
      tag: 'Ergonomics',
      complaint: 'Capacitive touch function row lacks physical travel and tactile feedback.',
      context: 'The Escape and media keys are flat illuminated touch surfaces with no haptic click, making touch-typing difficult.',
    },
    {
      tag: 'Hardware Quirk',
      complaint: 'Zero headphone jack and only 2 USB-C ports.',
      context: 'Completely omits the 3.5mm audio jack and legacy USB-A ports, forcing users to carry dongles for wired headphones and USB flash drives.',
    },
  ],
  'apple-macbook-pro-14': [
    {
      tag: 'Ergonomics',
      complaint: 'Sharp front perimeter chassis edge can press into wrists.',
      context: 'Typing on high desks without a wrist rest causes the machined aluminum palm rest edge to dig noticeably into wrists over long coding sessions.',
    },
  ],
  'lenovo-thinkpad-x1-carbon': [
    {
      tag: 'Hardware Quirk',
      complaint: 'Black soft-touch rubberized coating shows hand grease within minutes.',
      context: 'The signature matte carbon lid and palm rest attract palm grease smudges that require frequent alcohol wipes to look clean.',
    },
  ],

  // Smartphones
  'galaxy-s24-ultra': [
    {
      tag: 'Ergonomics',
      complaint: 'Sharp 90-degree squared corners dig aggressively into palms.',
      context: 'One-handed typing causes the pointed lower corner to dig into your palm tissue unless cushioned by a rounded silicone case.',
    },
    {
      tag: 'Hardware Quirk',
      complaint: 'Anti-reflective Gorilla Armor glass smudges easily with skin oils.',
      context: 'While outdoor glare reduction is class-leading, finger oils create noticeable rainbow sheen smudges in bright sunlight.',
    },
  ],
  'iphone-16-pro': [
    {
      tag: 'Ergonomics',
      complaint: 'Camera Control button placement feels awkward in portrait orientation.',
      context: 'Located low along the right rail, accidentally swiping or pressing the capacitive button while pulling the phone from pockets is a frequent complaint.',
    },
  ],
  'google-pixel-9-pro': [
    {
      tag: 'Hardware Quirk',
      complaint: 'Tensor G4 processor still throttles under sustained 3D mobile gaming.',
      context: 'While exceptional for camera processing and Google AI features, continuous 45-minute sessions in heavy games like Genshin Impact lead to frame drops and chassis warming.',
    },
  ],

  // Credit Cards
  'american-express-platinum': [
    {
      tag: 'Hidden Cost',
      complaint: '"Coupon book" fatigue: credits require active monthly tracking.',
      context: 'Offsetting the steep $695 annual fee requires meticulously remembering monthly Uber credits, digital entertainment credits, Saks Fifth Avenue semi-annual credits, and airline fee selections.',
    },
  ],
  'american-express-gold-card': [
    {
      tag: 'Hidden Cost',
      complaint: 'Monthly dining and Dunkin credits are easily forgotten.',
      context: 'Credits do not roll over month-to-month. If you fail to use the $10 dining partner credit each month, your net annual cost rises.',
    },
  ],
  'chase-sapphire-reserve': [
    {
      tag: 'Hidden Cost',
      complaint: 'Priority Pass lounge crowding and long waitlists during peak hours.',
      context: 'Airport lounge access is frequently restricted by capacity caps at major domestic hubs (JFK, SFO, ORD), turning a primary perk into a frustrating wait.',
    },
  ],
}

export function getOwnerFrictions(product: Product): OwnerFriction[] {
  const custom = OWNER_FRICTIONS_REGISTRY[product.id]
  if (custom && custom.length > 0) return custom

  // Intelligent fallback by subcategory
  const sub = product.subcategory
  if (sub === 'tvs') {
    return [
      {
        tag: 'Software / Apps',
        complaint: 'Smart TV interface runs sponsored ads and banner recommendations.',
        context: 'Like most modern smart TV platforms, the home menu highlights suggested streaming content and sponsored banner placement out of the box.',
      },
      {
        tag: 'Ergonomics',
        complaint: 'Thin integrated TV speakers lack low-end bass punch.',
        context: 'Ultra-thin modern chassis leave minimal acoustic chamber depth, making a dedicated soundbar or audio system virtually mandatory for movie dialogues.',
      },
    ]
  }

  if (sub === 'smartphones') {
    return [
      {
        tag: 'Hidden Cost',
        complaint: 'No wall charging adapter included in the retail box.',
        context: 'Packaging contains only a Type-C cable; high-speed wall charging bricks must be purchased separately if you do not already own one.',
      },
    ]
  }

  if (sub === 'cordless-vacuums') {
    return [
      {
        tag: 'Maintenance',
        complaint: 'Washable filters must air-dry for a full 24 hours before reassembly.',
        context: 'Running the vacuum with a damp filter can damage the suction motor and cause musty odors, requiring an overnight wait or spare filter.',
      },
    ]
  }

  if (sub === 'air-purifiers') {
    return [
      {
        tag: 'Maintenance',
        complaint: 'Requires periodic filter replacements to maintain airflow and odor capture.',
        context: 'Activated carbon and HEPA media gradually saturate, needing replacement once or twice yearly depending on air pollution and pet shedding.',
      },
    ]
  }

  return [
    {
      tag: 'Maintenance',
      complaint: 'Requires ongoing care to maintain peak out-of-box performance.',
      context: 'Regular cleaning, firmware updates, and standard care are recommended to preserve longevity.',
    },
  ]
}
