const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const { prisma } = require('../lib/prisma')
const { log } = require('../lib/activityLog')
const router = express.Router()
router.use(authenticateToken)

// Hugging Face API endpoint for menu item extraction
router.post('/:clientId/extract-menu-items', async (req, res) => {
  try {
    const { images } = req.body // Array of base64 image strings with mime types
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' })
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY
    console.log('Hugging Face API Key present:', !!apiKey)
    
    const modelId = 'llava-hf/llava-1.5-7b-hf'
    const apiUrl = `https://api-inference.huggingface.co/models/${modelId}`
    
    const headers = {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
    }

    const prompt = `Analyze this menu photo and extract all menu items. Return a JSON array with this exact structure:
[
  {
    "name": "item name",
    "price": "price as number (e.g., 12.99)",
    "description": "brief description if visible",
    "category": "category name if visible (e.g., Appetizers, Mains, Desserts)"
  }
]
Only return valid JSON. If no menu items are visible, return an empty array.`

    const allItems = []

    for (const imageData of images) {
      console.log('Processing image, data URL length:', imageData.length)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: {
            image: imageData,
            question: prompt
          },
          parameters: {
            max_new_tokens: 2000,
            return_full_text: false
          }
        })
      })

      console.log('Hugging Face response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Hugging Face error response:', errorText)
        throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('Hugging Face result type:', Array.isArray(result) ? 'array' : typeof result)
      
      const text = Array.isArray(result) ? result[0]?.generated_text : result?.generated_text || result
      console.log('Extracted text length:', text?.length || 0)
      
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const items = JSON.parse(jsonMatch[0])
        console.log('Parsed items:', items.length)
        allItems.push(...items)
      } else {
        console.log('No JSON found in response')
      }
    }

    console.log('Total items extracted:', allItems.length)
    res.json({ items: allItems })
  } catch (err) {
    console.error('Extract menu items error:', err.message)
    console.error('Full error:', err)
    res.status(500).json({ error: err.message })
  }
})

router.get('/:clientId/menu-categories', async (req, res) => {
  try {
    const cats = await prisma.menuCategory.findMany({
      where: { clientId: req.params.clientId },
      include: { items: true },
      orderBy: { sortOrder: 'asc' }
    })
    res.json(cats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:clientId/menu-categories', async (req, res) => {
  try {
    const cat = await prisma.menuCategory.create({
      data: { ...req.body, clientId: req.params.clientId }
    })
    res.json(cat)
  } catch (err) {
    console.error('Create category error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.put('/:clientId/menu-categories/:id', async (req, res) => {
  try {
    const cat = await prisma.menuCategory.update({
      where: { id: req.params.id },
      data: req.body
    })
    res.json(cat)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:clientId/menu-categories/:id', async (req, res) => {
  try {
    await prisma.menuCategory.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:clientId/menu-items', async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: { clientId: req.params.clientId },
      include: { category: true },
      orderBy: { sortOrder: 'asc' }
    })
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:clientId/menu-items', async (req, res) => {
  try {
    const { categoryId, price, ...rest } = req.body
    const item = await prisma.menuItem.create({
      data: {
        ...rest,
        clientId: req.params.clientId,
        price: price ? parseFloat(price) : null,
        ...(categoryId ? { categoryId } : {})
      }
    })
    log({
      action: 'MENU_ITEM_ADDED', entity: 'MenuItem', entityName: item.name,
      userId: req.user.id, userName: req.user.name, clientId: req.params.clientId
    })
    res.json(item)
  } catch (err) {
    console.error('Create menu item error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.put('/:clientId/menu-items/reorder', async (req, res) => {
  try {
    const updates = req.body.items
    await Promise.all(
      updates.map(({ id, sortOrder }) =>
        prisma.menuItem.update({ where: { id }, data: { sortOrder } })
      )
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:clientId/menu-items/:id', async (req, res) => {
  try {
    const { price, ...rest } = req.body
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(price !== undefined ? { price: price ? parseFloat(price) : null } : {})
      }
    })
    res.json(item)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:clientId/menu-items/:id', async (req, res) => {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } })
    log({
      action: 'MENU_ITEM_DELETED', entity: 'MenuItem',
      userId: req.user.id, userName: req.user.name, clientId: req.params.clientId
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router