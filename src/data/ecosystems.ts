import type { Product } from '@/lib/data'

export type EcosystemId = 'neutral' | 'apple' | 'android-windows'

export type EcosystemOption = {
  id: EcosystemId
  label: string
  shortLabel: string
  description: string
}

export const ECOSYSTEM_OPTIONS: EcosystemOption[] = [
  {
    id: 'neutral',
    label: 'All Devices (Neutral)',
    shortLabel: 'All / Neutral',
    description: 'Compare pure hardware specs without platform bias.',
  },
  {
    id: 'apple',
    label: 'Apple Ecosystem (iPhone, Mac, iPad)',
    shortLabel: 'Apple',
    description: 'Prioritizes iOS/macOS synergies; flags features crippled on Apple devices.',
  },
  {
    id: 'android-windows',
    label: 'Android & Windows Ecosystem',
    shortLabel: 'Android / Windows',
    description: 'Flags features crippled outside Apple (e.g. AirPods loss of spatial audio & updates).',
  },
]

export type EcosystemImpact = {
  productId: string
  ecosystem: EcosystemId
  status: 'synergy' | 'penalty' | 'neutral'
  summary: string
  crippledFeatures?: string[]
}

const ECOSYSTEM_RULES: Record<string, Partial<Record<EcosystemId, { status: 'synergy' | 'penalty'; summary: string; crippledFeatures?: string[] }>>> = {
  // Apple Headphones on Android/Windows
  'apple-airpods-max': {
    'android-windows': {
      status: 'penalty',
      summary: 'Severe feature lock: Loses spatial audio, head tracking, auto-switching, and firmware updates.',
      crippledFeatures: [
        'No Personalized Spatial Audio with dynamic head tracking',
        'No automatic device switching between non-Apple hardware',
        'No firmware updates (requires an Apple device to update)',
        'No hands-free Siri or audio sharing',
      ],
    },
    apple: {
      status: 'synergy',
      summary: 'Full H1 chip integration: Instant one-tap pairing, Find My network, and iCloud audio handoff.',
    },
  },
  'apple-airpods-pro-2': {
    'android-windows': {
      status: 'penalty',
      summary: 'Loses spatial audio, Find My precision tracking, auto-switching, and firmware updates.',
      crippledFeatures: [
        'No Personalized Spatial Audio or Conversation Awareness customization',
        'No precision U1 chip Find My tracking on Android',
        'No firmware updates without connecting to an Apple device',
      ],
    },
    apple: {
      status: 'synergy',
      summary: 'Full H2 chip synergy: Conversation Awareness, Hearing Aid features, and multi-device audio switching.',
    },
  },
  'apple-airpods-4-anc': {
    'android-windows': {
      status: 'penalty',
      summary: 'Loses spatial audio, head tracking, Siri interactions, and firmware updates.',
      crippledFeatures: [
        'No Spatial Audio with head tracking',
        'No firmware updates without an Apple device',
      ],
    },
    apple: {
      status: 'synergy',
      summary: 'H2 chip instant iCloud pairing and Find My case speaker alerts.',
    },
  },

  // Non-Apple Headphones on iOS
  'sony-wh-1000xm5': {
    apple: {
      status: 'penalty',
      summary: 'No LDAC high-res codec: iOS caps Bluetooth audio at 256kbps AAC.',
      crippledFeatures: ['LDAC 990 kbps high-res codec not supported by iOS hardware'],
    },
    'android-windows': {
      status: 'synergy',
      summary: 'Supports LDAC high-res audio streaming and Google Fast Pair multi-device management.',
    },
  },
  'sony-wh-1000xm4': {
    apple: {
      status: 'penalty',
      summary: 'No LDAC high-res codec: iOS caps Bluetooth audio at standard AAC.',
      crippledFeatures: ['LDAC 990 kbps high-res codec disabled on iOS'],
    },
    'android-windows': {
      status: 'synergy',
      summary: 'Full LDAC high-res codec support on compatible Android phones.',
    },
  },
  'sennheiser-momentum-4': {
    apple: {
      status: 'penalty',
      summary: 'No aptX Adaptive / aptX HD on iPhone: falls back to standard AAC.',
      crippledFeatures: ['aptX Adaptive high-res audio codec disabled on iOS'],
    },
    'android-windows': {
      status: 'synergy',
      summary: 'Full aptX Adaptive low-latency audio support on Windows & Android.',
    },
  },
  'bose-quietcomfort-ultra': {
    apple: {
      status: 'penalty',
      summary: 'Snapdragon Sound / aptX Adaptive not supported on iPhone (limited to AAC).',
      crippledFeatures: ['Snapdragon Sound 24-bit lossless streaming disabled on iOS'],
    },
    'android-windows': {
      status: 'synergy',
      summary: 'Supports Snapdragon Sound aptX Adaptive on modern Android flagships.',
    },
  },

  // Smartwatches / Phones / Laptops cross-compatibility
  'iphone-16-pro': {
    'android-windows': {
      status: 'penalty',
      summary: 'No cross-device clipboard, AirDrop, or link to Windows PCs without third-party tools.',
    },
    apple: {
      status: 'synergy',
      summary: 'Seamless AirDrop, Apple Watch unlocking, Continuity Camera with Mac, and iCloud Private Relay.',
    },
  },
  'iphone-16': {
    'android-windows': {
      status: 'penalty',
      summary: 'No AirDrop, no Universal Control, and no native Windows Phone Link mirroring.',
    },
    apple: {
      status: 'synergy',
      summary: 'Full Apple ecosystem integration with Mac, iPad, and Apple Watch.',
    },
  },
  'galaxy-s24-ultra': {
    apple: {
      status: 'penalty',
      summary: 'Cannot AirDrop files to Mac/iPad; Apple Watch cannot pair with Android phones.',
      crippledFeatures: ['Apple Watch cannot be activated or paired with Android'],
    },
    'android-windows': {
      status: 'synergy',
      summary: 'Full Microsoft Phone Link app streaming to Windows PCs and Quick Share across Android.',
    },
  },
  'samsung-galaxy-s24': {
    apple: {
      status: 'penalty',
      summary: 'Cannot pair with Apple Watch; no AirDrop or iMessage sync.',
    },
    'android-windows': {
      status: 'synergy',
      summary: 'Quick Share with Android/Windows and Samsung DeX desktop mode.',
    },
  },
  'google-pixel-9-pro': {
    apple: {
      status: 'penalty',
      summary: 'No AirDrop or Apple Watch compatibility; manual photo export required for Mac.',
    },
    'android-windows': {
      status: 'synergy',
      summary: 'Native Gemini integration, Fast Pair, and Google Nearby Share to Windows.',
    },
  },
  'apple-macbook-pro-14': {
    'android-windows': {
      status: 'penalty',
      summary: 'No native DirectX 12 PC gaming; cannot run Windows-exclusive CAD/engineering software without VM.',
    },
    apple: {
      status: 'synergy',
      summary: 'Universal Clipboard, iPhone Mirroring, Sidecar with iPad, and Apple Watch unlock.',
    },
  },
  'apple-macbook-air-13': {
    'android-windows': {
      status: 'penalty',
      summary: 'No native DirectX 12 PC gaming; no Quick Share with Android phones.',
    },
    apple: {
      status: 'synergy',
      summary: 'iPhone Mirroring on macOS Sequoia, Universal Clipboard, and AirDrop.',
    },
  },
  'dell-xps-13-9340': {
    apple: {
      status: 'penalty',
      summary: 'No AirDrop with iPhone; cannot run macOS or Final Cut Pro.',
    },
    'android-windows': {
      status: 'synergy',
      summary: 'Direct Windows 11 Copilot integration and Microsoft Phone Link with Android.',
    },
  },
}

export function getEcosystemImpact(product: Product, ecosystem: EcosystemId): EcosystemImpact {
  if (ecosystem === 'neutral') {
    return {
      productId: product.id,
      ecosystem: 'neutral',
      status: 'neutral',
      summary: 'Device evaluated purely on standalone hardware specifications.',
    }
  }

  const rule = ECOSYSTEM_RULES[product.id]?.[ecosystem]
  if (rule) {
    return {
      productId: product.id,
      ecosystem,
      status: rule.status,
      summary: rule.summary,
      crippledFeatures: rule.crippledFeatures,
    }
  }

  return {
    productId: product.id,
    ecosystem,
    status: 'neutral',
    summary: 'Universal compatibility across platforms.',
  }
}

export function compareEcosystemImpact(
  productA: Product,
  productB: Product,
  ecosystem: EcosystemId
): { a: EcosystemImpact; b: EcosystemImpact; recommendation?: string } {
  const a = getEcosystemImpact(productA, ecosystem)
  const b = getEcosystemImpact(productB, ecosystem)

  if (ecosystem === 'neutral') {
    return { a, b }
  }

  let recommendation: string | undefined

  if (a.status === 'penalty' && b.status !== 'penalty') {
    recommendation = `Ecosystem Alert: The ${productA.brand} loses key features on ${ecosystem === 'apple' ? 'iOS' : 'Android/Windows'}. The ${productB.brand} is the better match for your devices.`
  } else if (b.status === 'penalty' && a.status !== 'penalty') {
    recommendation = `Ecosystem Alert: The ${productB.brand} loses key features on ${ecosystem === 'apple' ? 'iOS' : 'Android/Windows'}. The ${productA.brand} is the better match for your devices.`
  } else if (a.status === 'synergy' && b.status !== 'synergy') {
    recommendation = `Ecosystem Synergy: The ${productA.brand} integrates seamlessly with your ${ecosystem === 'apple' ? 'Apple' : 'Android/Windows'} devices.`
  } else if (b.status === 'synergy' && a.status !== 'synergy') {
    recommendation = `Ecosystem Synergy: The ${productB.brand} integrates seamlessly with your ${ecosystem === 'apple' ? 'Apple' : 'Android/Windows'} devices.`
  }

  return { a, b, recommendation }
}
