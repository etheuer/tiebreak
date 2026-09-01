export type Subcategory = 'tvs' | 'laptops' | 'smartphones' | 'cordless-vacuums' | 'headphones' | 'air-purifiers' | 'credit-cards'

export type SpecField = {
  key: string
  label: string
  highlight?: boolean
}

export type SpecGroup = {
  id: string
  label: string
  fields: SpecField[]
}

/**
 * What shoppers actually compare, by product type.
 * Smartphones follow GSMArena-style groups; TVs follow RTINGS-style picture/gaming splits.
 */
export const SPEC_CATALOGS: Record<Subcategory, SpecGroup[]> = {
  smartphones: [
    {
      id: 'body',
      label: 'Body',
      fields: [
        { key: 'dimensions', label: 'Dimensions' },
        { key: 'weight', label: 'Weight', highlight: true },
        { key: 'build', label: 'Build' },
        { key: 'ip_rating', label: 'Water / dust rating' },
        { key: 'colors', label: 'Colors' },
        { key: 'stylus', label: 'Stylus' },
      ],
    },
    {
      id: 'display',
      label: 'Display',
      fields: [
        { key: 'display_type', label: 'Type' },
        { key: 'display_size', label: 'Size', highlight: true },
        { key: 'resolution', label: 'Resolution' },
        { key: 'ppi', label: 'Pixel density' },
        { key: 'refresh_rate', label: 'Refresh rate' },
        { key: 'peak_brightness', label: 'Peak brightness' },
        { key: 'hdr', label: 'HDR' },
        { key: 'screen_protection', label: 'Protection' },
        { key: 'always_on', label: 'Always-on display' },
      ],
    },
    {
      id: 'platform',
      label: 'Platform',
      fields: [
        { key: 'os', label: 'Operating system' },
        { key: 'os_updates', label: 'Software support' },
        { key: 'chipset', label: 'Chipset', highlight: true },
        { key: 'cpu', label: 'CPU' },
        { key: 'gpu', label: 'GPU' },
      ],
    },
    {
      id: 'memory',
      label: 'Memory',
      fields: [
        { key: 'ram', label: 'RAM', highlight: true },
        { key: 'storage', label: 'Storage (reviewed)' },
        { key: 'storage_options', label: 'Storage options' },
        { key: 'expandable_storage', label: 'microSD' },
      ],
    },
    {
      id: 'rear-camera',
      label: 'Rear camera',
      fields: [
        { key: 'main_camera', label: 'Main' },
        { key: 'ultrawide_camera', label: 'Ultrawide' },
        { key: 'telephoto_camera', label: 'Telephoto' },
        { key: 'optical_zoom', label: 'Max optical zoom', highlight: true },
        { key: 'ois', label: 'Stabilization' },
        { key: 'rear_video', label: 'Video' },
      ],
    },
    {
      id: 'front-camera',
      label: 'Front camera',
      fields: [
        { key: 'front_camera', label: 'Selfie camera' },
        { key: 'front_video', label: 'Selfie video' },
      ],
    },
    {
      id: 'battery',
      label: 'Battery & charging',
      fields: [
        { key: 'battery_capacity', label: 'Capacity', highlight: true },
        { key: 'wired_charging', label: 'Wired charging' },
        { key: 'wireless_charging', label: 'Wireless charging' },
        { key: 'reverse_charging', label: 'Reverse wireless' },
        { key: 'charger_in_box', label: 'Charger in box' },
      ],
    },
    {
      id: 'audio',
      label: 'Audio',
      fields: [
        { key: 'speakers', label: 'Speakers' },
        { key: 'headphone_jack', label: 'Headphone jack' },
      ],
    },
    {
      id: 'connectivity',
      label: 'Connectivity',
      fields: [
        { key: 'cellular', label: 'Cellular' },
        { key: 'wifi', label: 'Wi-Fi' },
        { key: 'bluetooth', label: 'Bluetooth' },
        { key: 'nfc', label: 'NFC' },
        { key: 'usb', label: 'USB' },
        { key: 'sim', label: 'SIM' },
      ],
    },
    {
      id: 'features',
      label: 'Features',
      fields: [
        { key: 'biometrics', label: 'Biometrics' },
        { key: 'extra_controls', label: 'Extra controls' },
        { key: 'unique_features', label: 'Standout features' },
      ],
    },
  ],
  tvs: [
    {
      id: 'picture',
      label: 'Picture',
      fields: [
        { key: 'panel_type', label: 'Panel type', highlight: true },
        { key: 'screen_size', label: 'Screen size' },
        { key: 'resolution', label: 'Resolution' },
        { key: 'native_refresh', label: 'Native refresh rate' },
        { key: 'peak_brightness', label: 'Peak brightness (HDR)', highlight: true },
        { key: 'contrast', label: 'Contrast' },
        { key: 'local_dimming', label: 'Local dimming' },
        { key: 'viewing_angle', label: 'Viewing angle' },
        { key: 'screen_finish', label: 'Screen finish' },
        { key: 'hdr_formats', label: 'HDR formats' },
      ],
    },
    {
      id: 'processing',
      label: 'Processing',
      fields: [
        { key: 'processor', label: 'Processor' },
        { key: 'motion_handling', label: 'Motion handling' },
        { key: 'upscaling', label: 'Upscaling' },
      ],
    },
    {
      id: 'gaming',
      label: 'Gaming',
      fields: [
        { key: 'hdmi_2_1_ports', label: 'HDMI 2.1 ports', highlight: true },
        { key: 'four_k_120', label: '4K 120Hz' },
        { key: 'vrr', label: 'VRR' },
        { key: 'allm', label: 'Auto low latency (ALLM)' },
        { key: 'input_lag', label: 'Input lag (4K 120, game mode)' },
        { key: 'gsync_freesync', label: 'G-Sync / FreeSync' },
      ],
    },
    {
      id: 'audio',
      label: 'Audio',
      fields: [
        { key: 'audio_system', label: 'Speakers' },
        { key: 'dolby_atmos', label: 'Dolby Atmos' },
        { key: 'earc', label: 'eARC' },
      ],
    },
    {
      id: 'smart',
      label: 'Smart TV',
      fields: [
        { key: 'smart_os', label: 'Operating system' },
        { key: 'voice_assistants', label: 'Voice assistants' },
      ],
    },
    {
      id: 'design',
      label: 'Design',
      fields: [
        { key: 'thickness', label: 'Thickness' },
        { key: 'wall_mount', label: 'Wall mount' },
      ],
    },
    {
      id: 'ownership',
      label: 'Ownership',
      fields: [
        { key: 'burn_in_risk', label: 'Burn-in risk' },
        { key: 'warranty', label: 'Warranty' },
      ],
    },
  ],
  laptops: [
    {
      id: 'display',
      label: 'Display',
      fields: [
        { key: 'display_size', label: 'Size' },
        { key: 'display_type', label: 'Panel', highlight: true },
        { key: 'resolution', label: 'Resolution' },
        { key: 'refresh_rate', label: 'Refresh rate' },
        { key: 'brightness', label: 'Brightness' },
        { key: 'color_gamut', label: 'Color' },
        { key: 'touchscreen', label: 'Touchscreen' },
      ],
    },
    {
      id: 'performance',
      label: 'Performance',
      fields: [
        { key: 'processor', label: 'Processor', highlight: true },
        { key: 'gpu', label: 'Graphics' },
        { key: 'ram', label: 'Memory', highlight: true },
        { key: 'ram_upgradable', label: 'RAM upgradable' },
        { key: 'storage', label: 'Storage' },
        { key: 'storage_upgradable', label: 'Storage upgradable' },
      ],
    },
    {
      id: 'battery',
      label: 'Battery',
      fields: [
        { key: 'battery_life', label: 'Claimed battery life', highlight: true },
        { key: 'charger', label: 'Charger' },
      ],
    },
    {
      id: 'build',
      label: 'Build & input',
      fields: [
        { key: 'weight', label: 'Weight' },
        { key: 'thickness', label: 'Thickness' },
        { key: 'material', label: 'Materials' },
        { key: 'keyboard', label: 'Keyboard' },
        { key: 'trackpad', label: 'Trackpad' },
        { key: 'webcam', label: 'Webcam' },
        { key: 'speakers', label: 'Speakers' },
      ],
    },
    {
      id: 'ports',
      label: 'Ports',
      fields: [
        { key: 'thunderbolt', label: 'Thunderbolt / USB-C' },
        { key: 'hdmi', label: 'HDMI' },
        { key: 'sd_card', label: 'SD card' },
        { key: 'magsafe', label: 'MagSafe' },
        { key: 'headphone_jack', label: 'Headphone jack' },
      ],
    },
    {
      id: 'software',
      label: 'Software',
      fields: [
        { key: 'os', label: 'Operating system' },
        { key: 'repairability', label: 'Repairability' },
      ],
    },
  ],
  'cordless-vacuums': [
    {
      id: 'cleaning',
      label: 'Cleaning performance',
      fields: [
        { key: 'suction', label: 'Suction', highlight: true },
        { key: 'auto_suction', label: 'Auto suction adjust' },
        { key: 'floor_illumination', label: 'Floor illumination' },
        { key: 'anti_tangle', label: 'Anti-tangle' },
        { key: 'floor_types', label: 'Floor types' },
        { key: 'dust_sensing', label: 'Dust / particle sensing' },
      ],
    },
    {
      id: 'runtime',
      label: 'Runtime & charging',
      fields: [
        { key: 'max_runtime', label: 'Max runtime', highlight: true },
        { key: 'typical_runtime', label: 'Typical mixed-use runtime' },
        { key: 'charge_time', label: 'Charge time' },
      ],
    },
    {
      id: 'usability',
      label: 'Usability',
      fields: [
        { key: 'weight', label: 'Weight', highlight: true },
        { key: 'bin_capacity', label: 'Bin capacity' },
        { key: 'noise', label: 'Noise' },
        { key: 'display', label: 'Display' },
      ],
    },
    {
      id: 'filtration',
      label: 'Filtration',
      fields: [
        { key: 'filtration', label: 'Filtration' },
        { key: 'sealed_system', label: 'Sealed system' },
      ],
    },
    {
      id: 'kit',
      label: 'Kit',
      fields: [
        { key: 'attachments', label: 'Attachments' },
        { key: 'docking_station', label: 'Dock' },
      ],
    },
    {
      id: 'ownership',
      label: 'Ownership',
      fields: [
        { key: 'warranty', label: 'Warranty' },
        { key: 'bagless', label: 'Bagless' },
      ],
    },
  ],
  headphones: [
    {
      id: 'design',
      label: 'Design',
      fields: [
        { key: 'type', label: 'Type' },
        { key: 'weight', label: 'Weight', highlight: true },
        { key: 'foldable', label: 'Foldable' },
        { key: 'case', label: 'Carrying case' },
        { key: 'ip', label: 'IP rating' },
      ],
    },
    {
      id: 'audio',
      label: 'Audio',
      fields: [
        { key: 'driver', label: 'Driver' },
        { key: 'anc', label: 'Active Noise Cancelling', highlight: true },
        { key: 'transparency', label: 'Transparency mode' },
        { key: 'codec', label: 'Supported codecs' },
        { key: 'mic', label: 'Microphone quality' },
      ],
    },
    {
      id: 'connectivity',
      label: 'Connectivity & Battery',
      fields: [
        { key: 'multipoint', label: 'Multipoint Bluetooth' },
        { key: 'battery', label: 'Battery life', highlight: true },
        { key: 'charge', label: 'Charging time' },
      ],
    },
    {
      id: 'ownership',
      label: 'Ownership',
      fields: [
        { key: 'warranty', label: 'Warranty' },
      ],
    },
  ],
  'air-purifiers': [
    {
      id: 'performance',
      label: 'Performance',
      fields: [
        { key: 'cadr', label: 'CADR', highlight: true },
        { key: 'room_size', label: 'Room size' },
        { key: 'coverage', label: 'Coverage area', highlight: true },
      ],
    },
    {
      id: 'filters',
      label: 'Filters',
      fields: [
        { key: 'filters', label: 'Filter types' },
        { key: 'filter_life', label: 'Filter life' },
      ],
    },
    {
      id: 'usability',
      label: 'Usability & Smart',
      fields: [
        { key: 'noise', label: 'Noise levels' },
        { key: 'energy', label: 'Energy consumption' },
        { key: 'smart', label: 'Smart features' },
        { key: 'sensors', label: 'Air quality sensors' },
      ],
    },
    {
      id: 'design',
      label: 'Design & Ownership',
      fields: [
        { key: 'weight', label: 'Weight' },
        { key: 'warranty', label: 'Warranty' },
      ],
    },
  ],
  'credit-cards': [
    {
      id: 'fees',
      label: 'Fees & Rates',
      fields: [
        { key: 'annual_fee', label: 'Annual fee', highlight: true },
        { key: 'apr', label: 'Regular APR' },
        { key: 'foreign_tx', label: 'Foreign transaction fee' },
        { key: 'late_fee', label: 'Late fee' },
      ],
    },
    {
      id: 'rewards',
      label: 'Rewards & Perks',
      fields: [
        { key: 'rewards_rate', label: 'Rewards rate', highlight: true },
        { key: 'sign_up_bonus', label: 'Sign-up bonus' },
        { key: 'intro_offer', label: 'Intro APR offer' },
        { key: 'lounge', label: 'Lounge access' },
      ],
    },
    {
      id: 'details',
      label: 'Card Details',
      fields: [
        { key: 'credit_needed', label: 'Credit needed' },
        { key: 'network', label: 'Network' },
      ],
    },
  ],
}

export function isSubcategory(value: string): value is Subcategory {
  return value in SPEC_CATALOGS
}

export function catalogFor(subcategory: string): SpecGroup[] {
  if (isSubcategory(subcategory)) return SPEC_CATALOGS[subcategory]
  return []
}

export function mergeCatalogs(a: string, b: string): SpecGroup[] {
  if (a === b) return catalogFor(a)
  const seen = new Set<string>()
  const groups: SpecGroup[] = []
  for (const group of [...catalogFor(a), ...catalogFor(b)]) {
    if (seen.has(group.id)) continue
    seen.add(group.id)
    groups.push(group)
  }
  return groups
}
