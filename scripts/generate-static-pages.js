// Script to generate static comparison pages for SEO
// Run with: node scripts/generate-static-pages.js

const fs = require('fs')
const path = require('path')

const products = [
  { id: 'samsung-q90c', name: 'Samsung Q90C', brand: 'Samsung', category: 'electronics', price: 1799 },
  { id: 'lg-g3-oled', name: 'LG G3 OLED', brand: 'LG', category: 'electronics', price: 2199 },
  { id: 'sony-a95l', name: 'Sony A95L', brand: 'Sony', category: 'electronics', price: 3499 }
]

// Generate comparison page data
products.forEach((product, index) => {
  products.slice(index + 1).forEach(compare => {
    const compareData = {
      productA: product.id,
      productB: compare.id,
      productName: `${product.name} vs ${compare.name}`,
      description: `Compare ${product.name} and ${compare.name}. Find the best TV for your needs with detailed specs and expert analysis.`,
      keywords: [product.name, compare.name, 'compare', 'tv', 'oled', 'qled']
    }
    
    const outPath = path.join(__dirname, `../src/data/comparisons/${product.id}-vs-${compare.id}.json`)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(compareData, null, 2))
    console.log(`Generated comparison: ${product.id} vs ${compare.id}`)
  })
})

console.log('Done! Static comparison data generated.')
