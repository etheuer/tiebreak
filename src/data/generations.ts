import type { Product } from '@/lib/data'

export type UpgradeVerdictType = 'major-leap' | 'incremental-polish' | 'sidegrade'

export type GenerationalAnalysis = {
  isGenerational: boolean
  olderProduct?: Product
  newerProduct?: Product
  verdictType?: UpgradeVerdictType
  verdictLabel?: string
  headline?: string
  recommendation?: string
  whatChanged?: string[]
  whatStayedSame?: string[]
}

type GenerationalPairRule = {
  olderId: string
  newerId: string
  verdictType: UpgradeVerdictType
  verdictLabel: string
  headline: string
  recommendation: string
  whatChanged: string[]
  whatStayedSame: string[]
}

const GENERATIONAL_PAIRS: GenerationalPairRule[] = [
  {
    olderId: 'sony-wh-1000xm4',
    newerId: 'sony-wh-1000xm5',
    verdictType: 'sidegrade',
    verdictLabel: 'Ergonomic Sidegrade',
    headline: 'Better ANC & mics, but sacrifices compact folding.',
    recommendation: 'Keep your XM4 if you travel often—it folds 40% smaller. Buy the XM5 only for best-in-class call microphones and refined auto-ANC.',
    whatChanged: [
      'New 8-mic array with Auto NC Optimizer (noticeably clearer calls)',
      'New lightweight carbon fiber composite 30mm drivers',
      'Non-folding headband redesign (larger carrying case footprint)',
      '3-minute quick charge yields 3 hours (vs 10 min for 5 hrs on XM4)',
    ],
    whatStayedSame: [
      'Same 30-hour battery life with ANC enabled',
      'Same LDAC, AAC, and SBC Bluetooth codec support',
      'Same multi-point Bluetooth 2-device pairing',
      'Same 3.5mm wired backup listening option',
    ],
  },
  {
    olderId: 'bose-quietcomfort-headphones',
    newerId: 'bose-quietcomfort-ultra',
    verdictType: 'incremental-polish',
    verdictLabel: 'Incremental Polish',
    headline: 'Adds Immersive Audio & Snapdragon Sound, but costs $80 more.',
    recommendation: 'Skip the Ultra if you just want classic Bose comfort and silence. Buy the Ultra if you want spatial audio and premium metal yoke styling.',
    whatChanged: [
      'Bose Immersive Audio (on-board spatial audio with head tracking)',
      'Snapdragon Sound with aptX Adaptive support (on compatible Android)',
      'Aluminum headband arms replacing all-plastic exterior',
      'Touch capacitive volume strip replacing physical volume rocker',
    ],
    whatStayedSame: [
      'Same legendary Bose cloud-like ear cushion comfort',
      'Same 24-hour battery life rating',
      'Same folding hinge mechanism into compact travel case',
      'Same multi-point Bluetooth pairing',
    ],
  },
  {
    olderId: 'dyson-v15-detect',
    newerId: 'dyson-gen5detect',
    verdictType: 'incremental-polish',
    verdictLabel: 'Incremental Polish',
    headline: 'Stronger 280 AW suction and push-button power, but 1.1 lb heavier.',
    recommendation: 'Hold onto your V15. The Gen5 suction is slightly higher, but the heavier 7.7 lb weight makes overhead cleaning noticeably more fatiguing.',
    whatChanged: [
      '+16% suction power (280 AW vs 240 AW)',
      'Push-button on/off power replacing the continuous trigger grip',
      'Built-in dusting & crevice tool hidden inside the quick-release wand',
      '0.1-micron whole-machine HEPA filtration (traps viruses vs 0.3-micron standard)',
      'Heavier 7.72 lb total weight (vs 6.61 lb on V15)',
    ],
    whatStayedSame: [
      'Same Fluffy Optic laser illumination head for hard floors',
      'Same 0.20-gallon (0.77L) bin volume with point-and-shoot ejector',
      'Same acoustic piezo particle counter LCD display',
      'Same Digital Motorbar with anti-tangle de-tangling vanes',
    ],
  },
  {
    olderId: 'dyson-v8-absolute',
    newerId: 'dyson-v15-detect',
    verdictType: 'major-leap',
    verdictLabel: 'Major Generational Leap',
    headline: 'Over double the suction power and runtime with laser illumination.',
    recommendation: 'A definitive upgrade. The V15 provides over 2x suction, double the battery runtime, and acoustic particle detection.',
    whatChanged: [
      '+109% suction power (240 AW vs 115 AW)',
      '60-minute runtime on Eco mode (vs 40 min on V8)',
      'Laser Fluffy cleaning head illuminates invisible microscopic dust',
      'LCD screen with real-time particle graph and countdown timer',
      'Click-in swappable battery pack (V8 requires screw removal)',
    ],
    whatStayedSame: [
      'Same wall-mountable docking station format',
      'Same washable lifetime filters',
      'Same continuous trigger power grip design',
    ],
  },
  {
    olderId: 'lg-g3-oled',
    newerId: 'lg-g4-oled',
    verdictType: 'incremental-polish',
    verdictLabel: 'Incremental Polish',
    headline: 'New Alpha 11 AI processor & 144Hz PC gaming, but picture remains stellar on both.',
    recommendation: 'If you already own the G3, keep it—the MLA OLED panel delivers practically identical HDR punch. If buying new, pick G4 for 144Hz and zero chrominance overshoot.',
    whatChanged: [
      'New Alpha 11 4K AI processor (4x AI performance, reduces color banding)',
      '144 Hz refresh rate mode for PC gaming (up from 120 Hz)',
      'Full Dolby Vision Filmmaker Mode out of the box',
      'Official desktop stand now included in the box for select 55"/65" regional SKUs',
    ],
    whatStayedSame: [
      'Same Micro Lens Array (MLA) brightness booster with heatsink (~1,500 nits)',
      'Same 5-year panel warranty against burn-in',
      'Same 4x full-bandwidth 48Gbps HDMI 2.1 ports',
      'Same ultra-thin zero-gap wall gallery mount aesthetic',
    ],
  },
  {
    olderId: 'samsung-q90c',
    newerId: 'samsung-qn90d',
    verdictType: 'incremental-polish',
    verdictLabel: 'Incremental Polish',
    headline: 'Slightly refined local dimming algorithms and NQ4 Gen2 processor.',
    recommendation: 'Skip the upgrade. The Q90C often sells at a deep discount and delivers 95% of the QN90D performance in real-world viewing.',
    whatChanged: [
      'NQ4 AI Gen2 Processor with Real Depth Enhancer Pro',
      'Refined local dimming algorithm reducing blooming around white subtitles',
      'Upgraded 144Hz support across all HDMI 2.1 ports',
    ],
    whatStayedSame: [
      'Same Quantum Mini LED backlighting with anti-glare wide viewing angle',
      'Same ~2,000 nit peak HDR brightness capability',
      'Same lack of Dolby Vision support (HDR10, HDR10+, HLG only)',
      'Same 4x full-speed HDMI 2.1 ports with FreeSync Premium Pro',
    ],
  },
  {
    olderId: 'samsung-galaxy-s24',
    newerId: 'samsung-galaxy-s25',
    verdictType: 'incremental-polish',
    verdictLabel: 'Incremental Polish',
    headline: 'Snapdragon 8 Elite worldwide, 12GB RAM standard, and slightly slimmer bezels.',
    recommendation: 'S24 owners can comfortably hold. The 12GB RAM and 8 Elite chip make it future-proof for on-device AI, but daily cameras and screen are nearly identical.',
    whatChanged: [
      'Snapdragon 8 Elite processor worldwide (eliminates Exynos variant split)',
      '12 GB RAM baseline (up from 8 GB on S24)',
      '0.4 mm thinner profile with rounded contoured armor aluminum rail',
      'Wi-Fi 7 connectivity support',
    ],
    whatStayedSame: [
      'Same 6.2-inch 120Hz Dynamic AMOLED 2X flat display (2,600 nits peak)',
      'Same triple rear camera system (50MP main, 10MP 3x telephoto, 12MP ultrawide)',
      'Same 4,000 mAh battery capacity and 25W wired charging ceiling',
      'Same 7 years of Android OS and security upgrades promise',
    ],
  },
  {
    olderId: 'galaxy-s24-ultra',
    newerId: 'samsung-galaxy-s25-ultra',
    verdictType: 'incremental-polish',
    verdictLabel: 'Incremental Polish & Ergonomic Fix',
    headline: 'Rounded corners eliminate palm digging; 50MP ultrawide and 8 Elite inside.',
    recommendation: 'Worth considering if the S24 Ultra sharp corners annoyed your hands. Otherwise, the screen, zoom cameras, and battery life remain very close.',
    whatChanged: [
      'Rounded ergonomic chassis corners (no more sharp corners digging into palms)',
      'Upgraded 50MP ultrawide camera (replacing the aging 12MP sensor)',
      'Snapdragon 8 Elite for Galaxy with massive CPU & NPU AI leaps',
      '14 grams lighter in hand (218g vs 232g)',
    ],
    whatStayedSame: [
      'Same built-in S Pen stylus slot and functionality',
      'Same 5,000 mAh battery capacity and 45W charging ceiling',
      'Same Gorilla Glass Armor anti-reflective glass surface',
      'Same 200MP main camera sensor and 5x 50MP periscope zoom lens',
    ],
  },
  {
    olderId: 'iphone-16-pro',
    newerId: 'iphone-17-pro',
    verdictType: 'incremental-polish',
    verdictLabel: 'Incremental Polish',
    headline: 'A19 Pro chip, 48MP telephoto across the board, and 24MP front camera.',
    recommendation: 'Keep your 16 Pro. The 17 Pro upgrades the telephoto and selfie cameras to 48MP/24MP, but daily screen, battery, and form factor are very consistent.',
    whatChanged: [
      'A19 Pro chip with next-gen 2nm/3nm compute architecture',
      'Upgraded 48MP periscope telephoto sensor (replacing 12MP sensor)',
      '24MP front FaceTime camera (up from 12MP)',
      'Wi-Fi 7 chip with Apple-designed custom wireless silicon',
    ],
    whatStayedSame: [
      'Same Grade 5 Titanium chassis with contoured edges',
      'Same 120Hz ProMotion Super Retina XDR display with Dynamic Island',
      'Same dedicated Camera Control capacitive button',
      'Same USB-C 10Gbps transfer speeds and MagSafe ecosystem',
    ],
  },
  {
    olderId: 'iphone-16',
    newerId: 'iphone-17',
    verdictType: 'major-leap',
    verdictLabel: 'Major Display Leap',
    headline: 'Finally gains 120Hz ProMotion display and always-on screen.',
    recommendation: 'A rare major base-iPhone leap! If you are on an iPhone 16 or earlier base model, the jump to 120Hz ProMotion makes everything look twice as smooth.',
    whatChanged: [
      '120 Hz ProMotion display (finally eliminating the 60 Hz restriction)',
      'Always-On Display with standby widgets',
      'A19 Bionic chip with upgraded Neural Engine',
      '24MP front selfie camera',
    ],
    whatStayedSame: [
      'Same dual-camera diagonal/vertical layout with Action Button',
      'Same aluminum and color-infused back glass design',
      'Same Dynamic Island interaction pill',
    ],
  },
  {
    olderId: 'apple-macbook-pro-14',
    newerId: 'macbook-pro-14-m4',
    verdictType: 'incremental-polish',
    verdictLabel: 'Generational Speed Bump',
    headline: 'M4 chip, 16GB RAM base standard, and 1,000 nit SDR brightness.',
    recommendation: 'If you have an M3 Pro or Max, skip. But if you have an M1/M2 or base 8GB model, the M4 with 16GB minimum RAM is a massive longevity upgrade.',
    whatChanged: [
      'M4 processor with 25% faster CPU multi-core performance',
      '16 GB unified memory baseline (no more 8 GB base bottleneck)',
      'SDR screen brightness bumped to 1,000 nits (up from 600 nits outdoors)',
      'Thunderbolt 4 / 5 support with dual external display support with lid open',
      '12MP Center Stage webcam with Desk View',
    ],
    whatStayedSame: [
      'Same Liquid Retina XDR Mini-LED 120Hz ProMotion display',
      'Same six-speaker sound system with force-cancelling woofers',
      'Same HDMI 2.1 port, MagSafe 3 charging, and full-size SDXC card slot',
      'Same unibody aluminum chassis and full-height scissor keyboard',
    ],
  },
  {
    olderId: 'lenovo-thinkpad-x1-carbon',
    newerId: 'lenovo-thinkpad-x1-carbon-gen-13',
    verdictType: 'incremental-polish',
    verdictLabel: 'Intel Core Ultra Series 2 Efficiency',
    headline: 'Lunar Lake processor fixes battery life and thermal throttling.',
    recommendation: 'Worth upgrading if battery life on your older X1 Carbon was lackluster. Lunar Lake delivers dramatically cooler lap temperatures and all-day battery.',
    whatChanged: [
      'Intel Core Ultra Series 2 (Lunar Lake) with huge battery efficiency gains',
      'New haptic glass trackpad option alongside classic TrackPoint buttons',
      'Sub-1 kg (2.16 lb) carbon fiber chassis weight reduction',
      'Upgraded 8MP webcam with computer vision presence detection',
    ],
    whatStayedSame: [
      'Same iconic ThinkPad spill-resistant keyboard and red TrackPoint nub',
      'Same 14-inch 16:10 display format with matte anti-glare finish',
      'Same dual Thunderbolt 4 + dual USB-A + HDMI 2.1 legacy port selection',
      'Same MIL-STD-810H durability construction standards',
    ],
  },
]

export function detectGenerationalPair(
  productA: Product,
  productB: Product
): GenerationalAnalysis {
  const match = GENERATIONAL_PAIRS.find(
    (rule) =>
      (rule.olderId === productA.id && rule.newerId === productB.id) ||
      (rule.olderId === productB.id && rule.newerId === productA.id)
  )

  if (!match) {
    // Check heuristic: same brand, same subcategory
    const sameBrand = productA.brand.toLowerCase() === productB.brand.toLowerCase()
    const sameSub = productA.subcategory === productB.subcategory
    if (!sameBrand || !sameSub) {
      return { isGenerational: false }
    }

    // Check for year or generation in names
    const hasNumbers = /\d+/.test(productA.name) && /\d+/.test(productB.name)
    if (!hasNumbers) {
      return { isGenerational: false }
    }

    // Heuristic fallback
    return {
      isGenerational: true,
      verdictType: 'incremental-polish',
      verdictLabel: 'Generational Comparison',
      headline: `${productA.brand} sibling models compared across generations.`,
      recommendation: `Compare the spec differences below to see if the price premium justifies the newer model's additions.`,
    }
  }

  const isAOlder = match.olderId === productA.id
  const olderProduct = isAOlder ? productA : productB
  const newerProduct = isAOlder ? productB : productA

  return {
    isGenerational: true,
    olderProduct,
    newerProduct,
    verdictType: match.verdictType,
    verdictLabel: match.verdictLabel,
    headline: match.headline,
    recommendation: match.recommendation,
    whatChanged: match.whatChanged,
    whatStayedSame: match.whatStayedSame,
  }
}
