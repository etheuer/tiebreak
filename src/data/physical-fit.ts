import type { Product } from '@/lib/data'

export type FitCheckItem = {
  label: string
  aValue: string
  bValue: string
  advantage?: 'a' | 'b' | 'tie'
  note?: string
}

export type PhysicalFitProfile = {
  title: string
  description: string
  items: FitCheckItem[]
}

export type ProductFitData = {
  dimensionHighlight?: string
  weightRating?: string
  keyErgonomicTrait?: string
  fitCheckNotes?: Record<string, string>
}

const PRODUCT_FIT_REGISTRY: Record<string, Record<string, string>> = {
  // TVs
  'lg-g3-oled': {
    stand: 'No stand in box (wall mount only; official stand ~$149)',
    soundbar: 'N/A on wall; ~2.8 in with optional swivel stand',
    profile: 'Ultra-slim 0.9 in flush gallery mount with zero gap',
  },
  'lg-g4-oled': {
    stand: 'No stand in box for 65"+ (included on 55" in some regions)',
    soundbar: 'N/A on wall; ~2.8 in with optional stand',
    profile: 'Ultra-slim 0.9 in flush gallery mount with zero gap',
  },
  'sony-a95l': {
    stand: 'Dual-position feet at extreme edges (needs 56"+ wide table)',
    soundbar: 'Soundbar position raises TV ~3.3 in to clear soundbars',
    profile: '1.4 in slim profile with cable management covers',
  },
  'samsung-q90c': {
    stand: 'Heavy center pedestal stand (fits narrow 16"–24" media consoles)',
    soundbar: '3.0 in clearance above pedestal (fits most soundbars)',
    profile: '1.0 in NeoSlim uniform chassis depth',
  },
  'samsung-s95d': {
    stand: 'Slim One Connect center metal pedestal',
    soundbar: '2.9 in clearance above center stand',
    profile: '0.4 in ultra-thin OLED panel with external One Connect box',
  },
  'hisense-u8n': {
    stand: 'Heavy metal center pedestal base with cable clips',
    soundbar: '2.9 in clearance above base',
    profile: '1.8 in uniform depth; standard VESA 400x400',
  },
  'sony-bravia-9': {
    stand: '4-way versatile stand (wide, narrow, standard, soundbar height)',
    soundbar: 'Soundbar position gives 3.5 in vertical clearance',
    profile: '1.9 in Mini LED chassis with seamless edge frame',
  },

  // Headphones
  'sony-wh-1000xm4': {
    folding: 'Folds flat & inward (ultra-compact zippered case)',
    clamp: 'Gentle clamp force (~4.2 N, comfortable with glasses)',
    weight: '254g (lightweight plastic composite)',
  },
  'sony-wh-1000xm5': {
    folding: 'Swivels flat only (larger case, does not fold inward)',
    clamp: 'Balanced clamp force (~4.4 N, synthetic leather)',
    weight: '250g (featherweight on crown)',
  },
  'apple-airpods-max': {
    folding: 'Swivels flat only; Smart Case leaves headband exposed',
    clamp: 'Firm clamp force (~5.2 N; steel & aluminum)',
    weight: '385g (heavy; noticeable neck load after 2 hours)',
  },
  'bose-quietcomfort-ultra': {
    folding: 'Folds flat & collapses into compact travel case',
    clamp: 'Ultra-plush gentle clamp (~4.1 N, best-in-class glasses comfort)',
    weight: '253g (featherweight travel balance)',
  },
  'bose-quietcomfort-headphones': {
    folding: 'Folds flat & inward into small zippered case',
    clamp: 'Signature light clamp (~3.9 N, zero crown pressure)',
    weight: '240g (lightest in premium ANC class)',
  },
  'sennheiser-momentum-4': {
    folding: 'Swivels flat only (large fabric travel case)',
    clamp: 'Medium-firm seal (~4.8 N, thick cushioned headband)',
    weight: '293g (moderate weight, thick memory foam)',
  },

  // Cordless Vacuums
  'dyson-v15-detect': {
    furniture: 'Requires 4.8 in clearance to lay flat under low beds/sofas',
    bin: 'Point-and-shoot hygienic bin ejector (no touching dust)',
    weight: '6.61 lb (well-balanced in hand)',
  },
  'dyson-gen5detect': {
    furniture: 'Requires 5.5 in clearance (larger motor housing)',
    bin: 'Point-and-shoot hygienic bin ejector',
    weight: '7.72 lb (heavy for single-hand ceiling/curtain work)',
  },
  'dyson-v12-detect-slim': {
    furniture: 'Low 3.9 in clearance (slimmest motor & Fluffy head)',
    bin: 'One-touch hygienic bin ejector (0.10 gal capacity)',
    weight: '5.20 lb (lightest Dyson, effortless on stairs)',
  },
  'dyson-v8-absolute': {
    furniture: '4.5 in under-furniture clearance',
    bin: 'Pull-up collar bin release mechanism',
    weight: '5.58 lb (light and nimble)',
  },
  'samsung-bespoke-jet-ai': {
    furniture: '4.9 in under-furniture clearance with swivel head',
    bin: 'All-in-One Clean Station auto-empties into sealed bag',
    weight: '6.17 lb (station does emptying work)',
  },
  'dreame-z10-station': {
    furniture: '4.6 in low furniture reach',
    bin: 'Auto-empty dock with 2.5L anti-bacterial dust bag',
    weight: '6.10 lb with main motorized roller',
  },
  'shark-stratos': {
    furniture: 'MultiFLEX folding wand bends 90° under beds without bending down',
    bin: 'One-touch drop-down bin door + anti-odor dial',
    weight: '8.90 lb (heavier, but folds in half for compact self-standing storage)',
  },

  // Air Purifiers
  'levoit-core-300s': {
    clearance: '360° intake requires 15 in perimeter clearance from walls',
    sleep: '22 dB whisper mode (practically inaudible on nightstand)',
    footprint: 'Compact cylinder (8.7 × 8.7 × 14.2 in; 5.9 lb)',
  },
  'levoit-core-400s': {
    clearance: '360° intake requires 15 in perimeter clearance from walls',
    sleep: '24 dB quiet sleep mode',
    footprint: 'Mid-sized cylinder (10.8 × 10.8 × 20.5 in; 11.0 lb)',
  },
  'coway-airmega-ap-1512hh': {
    clearance: 'Front-intake design: can sit almost flush against walls (leaves floor space open)',
    sleep: '24.4 dB lowest speed (vital ionizer can be toggled off)',
    footprint: 'Boxy square unit (16.8 × 18.3 × 9.6 in; 12.3 lb)',
  },
  'coway-airmega-250': {
    clearance: 'Bottom & dual-side intake: sits flush against back wall',
    sleep: '22 dB sleep mode with auto-dimming LED light sensor',
    footprint: 'Modern slim tower (19.7 × 18.5 × 8.3 in; 20.5 lb)',
  },
  'blueair-blue-pure-311i-max': {
    clearance: '360° fabric pre-filter intake (needs 12 in wall space)',
    sleep: '23 dB lowest speed setting',
    footprint: 'Cylindrical aesthetic (12.4 × 12.4 × 18.9 in; 7.8 lb)',
  },
  'honeywell-hpa300': {
    clearance: 'Front grille intake: can back up close to baseboards',
    sleep: '30 dB lowest fan speed (noticeable background white noise)',
    footprint: 'Large commercial-grade shell (20.8 × 22.3 × 10.8 in; 17.0 lb)',
  },
  'dyson-purifier-hot-cool-hp09': {
    clearance: 'Cylindrical base: needs 12 in airflow clearance around unit',
    sleep: '28 dB night mode with dimmed LCD',
    footprint: 'Bladeless oval loop (30.0 × 8.1 × 8.1 in; 12.6 lb; heats & cools)',
  },

  // Laptops
  'lenovo-thinkpad-x1-carbon': {
    sleeve: 'Fits standard 13"–14" slim backpack sleeves',
    thermal: 'Dual fans exhaust to side/rear; stays cool on lap during typing',
    travel: '2.42 lb laptop + compact 65W GaN adapter = ~3.0 lb total carry',
  },
  'apple-macbook-air-13': {
    sleeve: 'Ultra-thin 0.44 in profile; slips into any bag sleeve',
    thermal: 'Fanless zero-noise design; stays comfortably cool on lap',
    travel: '2.70 lb laptop + 35W dual charger = ~3.2 lb total carry',
  },
  'apple-macbook-pro-14': {
    sleeve: 'Fits standard 14" backpack laptop compartments',
    thermal: 'Side intake vents with rear exhaust; rare fan ramp on lap',
    travel: '3.50 lb laptop + 70W/96W brick = ~4.3 lb total carry',
  },
  'dell-xps-13-9340': {
    sleeve: 'Ultra-compact 11.6 in footprint (nearly 11" tablet sized)',
    thermal: 'Dual fans exhaust at hinge; bottom can warm up under load',
    travel: '2.60 lb laptop + 60W Type-C adapter = ~3.1 lb total carry',
  },
  'dell-xps-16': {
    sleeve: 'Requires dedicated 16" laptop bag compartment',
    thermal: 'Vapor chamber exhausts rear; heavy GPU workload warms lap',
    travel: '4.70 lb laptop + 130W brick = ~5.8 lb total carry',
  },
  'framework-laptop-16': {
    sleeve: 'Oversize 16" compartment needed (modular expansion bay)',
    thermal: 'Dual fan rear exhaust; completely modular & repairable chassis',
    travel: '5.30 lb laptop + 180W power supply = ~6.6 lb total carry',
  },

  // Smartphones
  'iphone-16': {
    reach: '6.1" display with 71.6mm width (easy one-handed thumb reach)',
    wobble: 'Vertical pill camera bump causes minor tilt on flat surfaces',
    weight: '170g (featherweight in pocket)',
  },
  'iphone-16-pro': {
    reach: '6.3" display with 71.5mm slim bezels (manageable one-handed)',
    wobble: 'Large triangular stove-top camera island wobbles on table tap',
    weight: '199g (balanced titanium heft)',
  },
  'iphone-16-pro-max': {
    reach: '6.9" display with 77.6mm width (strictly 2-handed for most hands)',
    wobble: 'Prominent corner camera plateau rocks when typing on desk',
    weight: '227g (heavy pocket presence)',
  },
  'galaxy-s24-ultra': {
    reach: '6.8" display with 79.0mm wide squared edges (stretches palms)',
    wobble: 'Individual camera lens rings cause corner wobble on flat tables',
    weight: '232g (substantial titanium brick)',
  },
  'google-pixel-9-pro': {
    reach: '6.3" display with 72.0mm width (compact pro flagship)',
    wobble: 'Horizontal camera visor spans full width: zero desk wobble!',
    weight: '199g (sits completely flat and stable on tables)',
  },
  'google-pixel-9': {
    reach: '6.3" display with 72.0mm width (comfortable one-hand hold)',
    wobble: 'Horizontal camera bar spans across back: zero desk wobble!',
    weight: '198g (completely stable when typing on flat desks)',
  },
}

export function getPhysicalFitComparison(productA: Product, productB: Product): PhysicalFitProfile | null {
  const sub = productA.subcategory
  const fitA = PRODUCT_FIT_REGISTRY[productA.id]
  const fitB = PRODUCT_FIT_REGISTRY[productB.id]

  if (!fitA && !fitB) return null

  const items: FitCheckItem[] = []

  if (sub === 'tvs') {
    if (fitA?.stand || fitB?.stand) {
      items.push({
        label: 'TV Stand & Table Footprint',
        aValue: fitA?.stand ?? 'Standard pedestal or dual-foot support',
        bValue: fitB?.stand ?? 'Standard pedestal or dual-foot support',
        note: 'Check your media console width before buying wide-foot models.',
      })
    }
    if (fitA?.soundbar || fitB?.soundbar) {
      items.push({
        label: 'Soundbar Clearance',
        aValue: fitA?.soundbar ?? 'Standard clearance',
        bValue: fitB?.soundbar ?? 'Standard clearance',
        note: 'Low bezel clearance may cause soundbars to block screen bottom or remote sensor.',
      })
    }
    if (fitA?.profile || fitB?.profile) {
      items.push({
        label: 'Wall Mount Profile & Depth',
        aValue: fitA?.profile ?? 'Standard VESA wall depth',
        bValue: fitB?.profile ?? 'Standard VESA wall depth',
      })
    }
    return {
      title: 'Living Room Space & Placement Check',
      description: 'Real-world physical measurements for credenza width, soundbar clearance, and wall mounting.',
      items,
    }
  }

  if (sub === 'headphones') {
    if (fitA?.folding || fitB?.folding) {
      items.push({
        label: 'Folding & Travel Packability',
        aValue: fitA?.folding ?? 'Standard folding earcups',
        bValue: fitB?.folding ?? 'Standard folding earcups',
        note: 'Collapsing inward saves ~40% space in backpacks or carry-on bags.',
      })
    }
    if (fitA?.clamp || fitB?.clamp) {
      items.push({
        label: 'Clamp Force & Glasses Comfort',
        aValue: fitA?.clamp ?? 'Standard headphone clamp',
        bValue: fitB?.clamp ?? 'Standard headphone clamp',
        note: 'Firm clamps create strong acoustic seals but can press glasses frames into temples.',
      })
    }
    if (fitA?.weight || fitB?.weight) {
      items.push({
        label: 'Weight & Crown Pressure',
        aValue: fitA?.weight ?? 'Standard headphone weight',
        bValue: fitB?.weight ?? 'Standard headphone weight',
        note: 'Headphones over 350g can cause top-of-head pressure hotspots during flights.',
      })
    }
    return {
      title: 'Comfort, Clamp & Travel Fit Check',
      description: 'Ergonomic factors that affect daily comfort, glasses wearers, and luggage space.',
      items,
    }
  }

  if (sub === 'cordless-vacuums') {
    if (fitA?.furniture || fitB?.furniture) {
      items.push({
        label: 'Under-Furniture Clearance',
        aValue: fitA?.furniture ?? 'Standard cleaner head clearance',
        bValue: fitB?.furniture ?? 'Standard cleaner head clearance',
        note: 'Measures the lowest gap under beds, coffee tables, and sofas the vacuum can reach.',
      })
    }
    if (fitA?.bin || fitB?.bin) {
      items.push({
        label: 'Dust Bin Emptying Style',
        aValue: fitA?.bin ?? 'Manual bin latch',
        bValue: fitB?.bin ?? 'Manual bin latch',
        note: 'Auto-empty clean stations eliminate dust clouds for allergy sufferers.',
      })
    }
    if (fitA?.weight || fitB?.weight) {
      items.push({
        label: 'In-Hand Carry Weight',
        aValue: fitA?.weight ?? 'Standard stick vacuum weight',
        bValue: fitB?.weight ?? 'Standard stick vacuum weight',
        note: 'Lighter units drastically reduce wrist strain when cleaning stairs and high vents.',
      })
    }
    return {
      title: 'Under-Furniture & Maneuverability Check',
      description: 'Clearing low sofas, stair ergonomics, and dust cloud disposal.',
      items,
    }
  }

  if (sub === 'air-purifiers') {
    if (fitA?.clearance || fitB?.clearance) {
      items.push({
        label: 'Wall Clearance Required',
        aValue: fitA?.clearance ?? 'Requires 12 in perimeter airflow space',
        bValue: fitB?.clearance ?? 'Requires 12 in perimeter airflow space',
        note: 'Cylindrical 360° filters cannot sit flush against walls without choking intake.',
      })
    }
    if (fitA?.sleep || fitB?.sleep) {
      items.push({
        label: 'Nighttime Sleep Mode Noise',
        aValue: fitA?.sleep ?? 'Standard sleep speed',
        bValue: fitB?.sleep ?? 'Standard sleep speed',
        note: 'Levels below 25 dB are virtually silent for light sleepers.',
      })
    }
    if (fitA?.footprint || fitB?.footprint) {
      items.push({
        label: 'Unit Footprint & Dimensions',
        aValue: fitA?.footprint ?? 'Standard room purifier footprint',
        bValue: fitB?.footprint ?? 'Standard room purifier footprint',
      })
    }
    return {
      title: 'Room Placement & Bedroom Noise Check',
      description: 'Physical clearance required for airflow, wall placement, and bedroom noise levels.',
      items,
    }
  }

  if (sub === 'laptops') {
    if (fitA?.sleeve || fitB?.sleeve) {
      items.push({
        label: 'Backpack Sleeve Compatibility',
        aValue: fitA?.sleeve ?? 'Standard laptop bag sleeve',
        bValue: fitB?.sleeve ?? 'Standard laptop bag sleeve',
      })
    }
    if (fitA?.thermal || fitB?.thermal) {
      items.push({
        label: 'Lap Ergonomics & Vent Placement',
        aValue: fitA?.thermal ?? 'Standard hinge exhaust',
        bValue: fitB?.thermal ?? 'Standard hinge exhaust',
        note: 'Bottom intake vents can choke and heat up your lap when used on beds or couches.',
      })
    }
    if (fitA?.travel || fitB?.travel) {
      items.push({
        label: 'Total Travel Weight (Chassis + Charger)',
        aValue: fitA?.travel ?? 'Standard carry weight',
        bValue: fitB?.travel ?? 'Standard carry weight',
        note: 'Always factor in the power adapter when calculating commuter bag weight.',
      })
    }
    return {
      title: 'Commuter Portability & Lap Comfort Check',
      description: 'Real-world travel weight including chargers, bag fit, and lap thermals.',
      items,
    }
  }

  if (sub === 'smartphones') {
    if (fitA?.reach || fitB?.reach) {
      items.push({
        label: 'One-Handed Palm Reach',
        aValue: fitA?.reach ?? 'Standard smartphone width',
        bValue: fitB?.reach ?? 'Standard smartphone width',
        note: 'Widths under 72mm allow thumb access to opposite screen edges without shifting grip.',
      })
    }
    if (fitA?.wobble || fitB?.wobble) {
      items.push({
        label: 'Desk Typing Table Wobble',
        aValue: fitA?.wobble ?? 'Corner camera bump causes minor wobble',
        bValue: fitB?.wobble ?? 'Corner camera bump causes minor wobble',
        note: 'Horizontal visor cameras sit flat on desks without annoying rocking while typing.',
      })
    }
    if (fitA?.weight || fitB?.weight) {
      items.push({
        label: 'Pocket Weight & Heft',
        aValue: fitA?.weight ?? 'Standard phone weight',
        bValue: fitB?.weight ?? 'Standard phone weight',
      })
    }
    return {
      title: 'Pocket, Palm & Desk Usability Check',
      description: 'One-handed reachability, pocket weight, and table wobble when typing without a case.',
      items,
    }
  }

  return null
}
