import { readFileSync } from 'node:fs'

const data = JSON.parse(readFileSync('src/data/products.json', 'utf8'))
const products = data.products

const SPEC_FIELDS = {
  smartphones: new Set(['dimensions','weight','build','ip_rating','colors','stylus','display_type','display_size','resolution','ppi','refresh_rate','peak_brightness','hdr','screen_protection','always_on','os','os_updates','chipset','cpu','gpu','ram','storage','storage_options','expandable_storage','main_camera','ultrawide_camera','telephoto_camera','optical_zoom','ois','rear_video','front_camera','front_video','battery_capacity','wired_charging','wireless_charging','reverse_charging','charger_in_box','speakers','headphone_jack','cellular','wifi','bluetooth','nfc','usb','sim','biometrics','extra_controls','unique_features']),
  tvs: new Set(['panel_type','screen_size','resolution','native_refresh','peak_brightness','contrast','local_dimming','viewing_angle','screen_finish','hdr_formats','processor','motion_handling','upscaling','hdmi_2_1_ports','four_k_120','vrr','allm','input_lag','gsync_freesync','audio_system','dolby_atmos','earc','smart_os','voice_assistants','thickness','wall_mount','burn_in_risk','warranty']),
  laptops: new Set(['display_size','display_type','resolution','refresh_rate','brightness','color_gamut','touchscreen','processor','gpu','ram','ram_upgradable','storage','storage_upgradable','weight','thickness','material','keyboard','trackpad','webcam','speakers','thunderbolt','hdmi','sd_card','magsafe','headphone_jack','charger','battery_life','os','repairability']),
  'cordless-vacuums': new Set(['suction','auto_suction','floor_illumination','anti_tangle','floor_types','dust_sensing','max_runtime','typical_runtime','charge_time','weight','bin_capacity','noise','display','filtration','sealed_system','attachments','docking_station','warranty','bagless']),
  headphones: new Set(['type','weight','foldable','case','ip','driver','anc','transparency','codec','mic','multipoint','battery','charge','warranty']),
  'air-purifiers': new Set(['cadr','room_size','coverage','filters','filter_life','noise','energy','smart','sensors','weight','warranty']),
  'credit-cards': new Set(['annual_fee','apr','foreign_tx','late_fee','rewards_rate','sign_up_bonus','intro_offer','lounge','credit_needed','network']),
}

let errors = []
for (const product of products) {
  const specs = product.specifications || {}
  const expected = SPEC_FIELDS[product.subcategory]
  if (!expected) { errors.push(`Unknown subcategory "${product.subcategory}" for "${product.id}"`); continue }
  for (const key of Object.keys(specs)) {
    if (!expected.has(key)) errors.push(`Unknown field "${key}" in "${product.id}"`)
  }
  if (Object.keys(specs).length < 3) errors.push(`Too few specs (${Object.keys(specs).length}) in "${product.id}"`)
}

if (errors.length === 0) { console.log(`\n${products.length} products validated against spec catalog`); process.exit(0) }
console.error(`${errors.length} schema errors:`)
errors.slice(0,20).forEach(e => console.error(`  ${e}`))
process.exit(1)