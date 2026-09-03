/**
 * Playwright extractor for Samsung US product spec pages.
 *
 * URL pattern: https://www.samsung.com/us/{category}/{product-slug}/
 * e.g. https://www.samsung.com/us/smartphones/galaxy-s24-ultra/
 */

export const hostname = 'www.samsung.com'

export async function verify(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 })

  // Samsung uses a "Specs" tab/accordion — try to click it
  const specTriggers = [
    'a:has-text("Specs")',
    'button:has-text("Specs")',
    '[data-track*="spec"]',
    '[role="tab"]:has-text("Specs")',
    '#specs'
  ]

  for (const trigger of specTriggers) {
    const btn = page.locator(trigger).first()
    if (await btn.count() > 0) {
      await btn.click().catch(() => {})
      await page.waitForTimeout(1000)
      break
    }
  }

  // Samsung spec tables use consistent structure
  let specs = {}

  const tables = await page.locator('table, .spec-list, [class*="spec"], .product-spec-table').all()
  for (const table of tables) {
    const rows = await table.locator('tr, li, .spec-row').all()
    for (const row of rows) {
      const cells = await row.locator('th, td, dt, dd, .label, .value').all()
      const texts = await Promise.all(cells.map(c => c.textContent()))
      const clean = texts.map(t => (t || '').trim()).filter(Boolean)

      if (clean.length >= 2) {
        const key = clean[0].toLowerCase().replace(/[:\s]+/g, '_').replace(/[^a-z0-9_]/g, '')
        specs[key] = clean.slice(1).join(' ')
      }
    }
  }

  // Normalise Samsung-specific keys
  const keyMap = {
    display: 'display_type',
    display_size: 'screen_size',
    size: 'screen_size',
    processor: 'chipset',
    ap: 'chipset',
    cpu: 'chipset',
    memory: 'ram',
    storage: 'storage',
    storage_options: 'storage_options',
    battery: 'battery_capacity',
    charging: 'wired_charging',
    os: 'os',
    weight: 'weight',
    dimensions: 'dimensions',
    camera: 'main_camera',
    rear_camera: 'main_camera',
    front_camera: 'front_camera',
    video: 'rear_video',
    connectivity: 'cellular',
    wifi: 'wifi',
    bluetooth: 'bluetooth',
    nfc: 'nfc',
    sim: 'sim',
    sensors: 'biometrics',
    water_resistance: 'ip_rating',
    durability: 'ip_rating',
    speaker: 'speakers',
    audio: 'speakers',
  }

  const mapped = {}
  for (const [k, v] of Object.entries(specs)) {
    mapped[keyMap[k] || k] = v
  }

  return mapped
}
