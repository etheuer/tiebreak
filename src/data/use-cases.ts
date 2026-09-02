import type { Subcategory } from './spec-catalog'
import { isSubcategory } from './spec-catalog'

/**
 * A "buying for" lens: the spec keys that decide a purchase for one shopper
 * job. Win counts are re-scored over just these keys, so a TV that loses the
 * overall count can still win for gaming. Keys reference SPEC_CATALOGS.
 */
export type UseCase = {
  id: string
  label: string
  /** One line in the shopper's words: what they are hiring the product for. */
  job: string
  keys: string[]
}

export const USE_CASES: Record<Subcategory, UseCase[]> = {
  tvs: [
    {
      id: 'gaming',
      label: 'Gaming',
      job: 'Console or PC play: 120 Hz, VRR, enough HDMI 2.1 ports for every box',
      keys: ['hdmi_2_1_ports', 'four_k_120', 'vrr', 'allm', 'gsync_freesync', 'native_refresh'],
    },
    {
      id: 'movies',
      label: 'Movies',
      job: 'Dark-room films and HDR streaming: panel type, HDR formats, local dimming',
      keys: [
        'panel_type',
        'hdr_formats',
        'local_dimming',
        'upscaling',
        'dolby_atmos',
      ],
    },
    {
      id: 'bright-rooms',
      label: 'Bright rooms',
      job: 'Daytime TV and sports in a sunny room: anti-glare finish and panel type',
      keys: ['screen_finish', 'panel_type', 'hdr_formats'],
    },
  ],
  laptops: [
    {
      id: 'travel',
      label: 'Travel',
      job: 'In a bag every day: weight, thickness, a screen you can read on a train',
      keys: ['weight', 'thickness', 'charger', 'brightness', 'webcam'],
    },
    {
      id: 'heavy-work',
      label: 'Heavy work',
      job: 'Video, 3D, compiles or games: CPU, GPU, memory and panel quality',
      keys: ['processor', 'gpu', 'ram', 'storage', 'refresh_rate', 'display_type', 'color_gamut', 'speakers'],
    },
    {
      id: 'longevity',
      label: 'Longevity',
      job: 'Keep it five years: upgradable parts, repairability, ports without dongles',
      keys: ['ram_upgradable', 'storage_upgradable', 'repairability', 'thunderbolt', 'hdmi', 'sd_card', 'os'],
    },
  ],
  smartphones: [
    {
      id: 'photos',
      label: 'Photos',
      job: 'Camera first: zoom reach, sensors, stabilisation and video',
      keys: [
        'main_camera',
        'ultrawide_camera',
        'telephoto_camera',
        'optical_zoom',
        'ois',
        'rear_video',
        'front_camera',
      ],
    },
    {
      id: 'battery-updates',
      label: 'Battery & updates',
      job: 'All-day battery, fast top-ups and years of software support',
      keys: ['battery_capacity', 'wired_charging', 'wireless_charging', 'charger_in_box', 'os_updates'],
    },
    {
      id: 'games-video',
      label: 'Games & video',
      job: 'Games and streaming: chip, refresh rate, brightness, speakers',
      keys: ['chipset', 'gpu', 'ram', 'refresh_rate', 'peak_brightness', 'display_size', 'speakers'],
    },
  ],
  'cordless-vacuums': [
    {
      id: 'pets-carpet',
      label: 'Pets & carpet',
      job: 'Pet hair and carpet: suction, a tangle-free brush, sealed filtration',
      keys: ['suction', 'anti_tangle', 'floor_types', 'dust_sensing', 'filtration', 'sealed_system'],
    },
    {
      id: 'big-homes',
      label: 'Big homes',
      job: 'A large home in one session: runtime, bin size, a dock that empties itself',
      keys: ['max_runtime', 'bin_capacity', 'docking_station', 'charge_time'],
    },
    {
      id: 'light-quiet',
      label: 'Stairs & apartments',
      job: 'Stairs and apartments: light in the hand, easy to park',
      keys: ['weight', 'docking_station', 'display'],
    },
  ],
  headphones: [
    {
      id: 'travel',
      label: 'Flights & commutes',
      job: 'Planes and trains: noise cancelling, battery, how small it packs',
      keys: ['anc', 'transparency', 'battery', 'foldable', 'case', 'weight'],
    },
    {
      id: 'calls',
      label: 'Calls & work',
      job: 'Meetings all day: microphone quality and two devices at once',
      keys: ['mic', 'multipoint', 'transparency', 'battery'],
    },
    {
      id: 'sound',
      label: 'Sound quality',
      job: 'Listening quality above all: drivers, hi-res codecs, comfort',
      keys: ['driver', 'codec', 'type', 'weight'],
    },
  ],
  'air-purifiers': [
    {
      id: 'bedroom',
      label: 'Bedrooms',
      job: 'Quiet nights: low-speed noise, sleep mode, schedules from your phone',
      keys: ['noise', 'smart', 'sensors', 'energy', 'weight'],
    },
    {
      id: 'big-rooms',
      label: 'Big rooms & allergies',
      job: 'Open-plan rooms or allergies: CADR, coverage, filter grade',
      keys: ['cadr', 'coverage', 'room_size', 'filters', 'filter_life'],
    },
    {
      id: 'running-cost',
      label: 'Low running cost',
      job: 'Cheap to own: filter life, power draw, warranty',
      keys: ['filter_life', 'energy', 'warranty'],
    },
  ],
  'credit-cards': [
    {
      id: 'travel',
      label: 'Travel',
      job: 'Flights, hotels and spending abroad: no foreign fees, lounges, a big bonus',
      keys: ['foreign_tx', 'lounge', 'rewards_rate', 'sign_up_bonus', 'annual_fee'],
    },
    {
      id: 'everyday',
      label: 'Everyday cash back',
      job: 'Simple rewards on groceries and gas with nothing to pay each year',
      keys: ['annual_fee', 'rewards_rate', 'intro_offer', 'apr'],
    },
    {
      id: 'balance',
      label: 'Carrying a balance',
      job: 'Paying over time: APR, intro offers, late fees',
      keys: ['apr', 'intro_offer', 'late_fee', 'annual_fee'],
    },
  ],
}

export function casesFor(subcategory: string): UseCase[] {
  return isSubcategory(subcategory) ? USE_CASES[subcategory] : []
}

/** The lens most shoppers in this subcategory start from, used for entry links. */
export function primaryUseCase(subcategory: string): UseCase | null {
  return casesFor(subcategory)[0] ?? null
}

export function findUseCase(subcategory: string, id: string | null | undefined): UseCase | null {
  if (!id) return null
  return casesFor(subcategory).find((useCase) => useCase.id === id) ?? null
}
