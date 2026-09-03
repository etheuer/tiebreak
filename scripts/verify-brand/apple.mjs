/**
 * Extractor for Apple specs page (www.apple.com/{product}/specs/).
 * Apple uses class-based sections: .techspecs-section.[section-name]
 */
export const hostname = 'www.apple.com'

export async function verify(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
  
  // Wait for spec sections to render (JS-loaded)
  await page.waitForSelector('.techspecs-section', { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(1500)

  const specs = {}

  // Extract from techspecs-section elements (Apple's known pattern)
  const sections = await page.locator('.techspecs-section').all()
  
  for (const section of sections) {
    const items = await section.locator('li , p , .typography-body').all()
    for (const item of items) {
      const text = (await item.textContent()).trim()
      if (!text || text.length < 3) continue
      // Try to parse label: value pattern
      const colonMatch = text.match(/^([^:]{2,30}?):\s*(.+)/)
      if (colonMatch) {
        const key = colonMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
        specs[key] = colonMatch[2].trim()
      }
    }

    // Also get all raw text for non-colon specs
    const sectionText = await section.textContent()
    const sectionTitle = (await section.locator('> *').first().textContent().catch(() => '')).trim()
    
    // Store section-level info
    if (sectionTitle) {
      specs[`_section_${sectionTitle.toLowerCase().replace(/\s+/g, '_')}`] = sectionText.slice(0, 500)
    }
  }

  // Fallback: check for dt/dd pairs
  const dts = await page.locator('dt').all()
  const dds = await page.locator('dd').all()
  if (dts.length > 0 && dds.length > 0) {
    const dtTexts = await Promise.all(dts.map(d => d.textContent()))
    const ddTexts = await Promise.all(dds.map(d => d.textContent()))
    for (let i = 0; i < Math.min(dtTexts.length, ddTexts.length); i++) {
      const key = (dtTexts[i] || '').trim().toLowerCase().replace(/[:\s]+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/_+/g, '_')
      specs[key] = (ddTexts[i] || '').trim()
    }
  }

  return specs
}