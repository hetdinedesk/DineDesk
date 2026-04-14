const express = require('express')
const { prisma } = require('../lib/prisma')
const router = express.Router({ mergeParams: true })

// Helper to get clientId from params (handles both /:clientId and /:id)
const getClientId = (req) => req.params.clientId || req.params.id

/**
 * Build hierarchical tree from flat navigation items
 * @param {Array} items - Flat list of navigation items
 * @returns {Array} - Hierarchical tree structure
 */
function buildNavTree(items) {
  const itemMap = new Map()
  const roots = []
  
  // First pass: create map and initialize children arrays
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] })
  })
  
  // Second pass: build hierarchy
  items.forEach(item => {
    const node = itemMap.get(item.id)
    if (item.parentId && itemMap.has(item.parentId)) {
      const parent = itemMap.get(item.parentId)
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })
  
  // Sort by sortOrder
  const sortByOrder = (a, b) => a.sortOrder - b.sortOrder
  roots.sort(sortByOrder)
  roots.forEach(node => {
    if (node.children) node.children.sort(sortByOrder)
  })
  
  return roots
}

/**
 * Flatten hierarchical tree for database storage
 * @param {Array} tree - Hierarchical tree
 * @param {string} clientId - Client ID
 * @returns {Array} - Flat list with parent references
 */
function flattenNavTree(tree, clientId, parentId = null, startOrder = 0) {
  const flat = []
  let order = startOrder
  
  tree.forEach(node => {
    const { children, ...itemData } = node
    const item = {
      ...itemData,
      clientId,
      parentId,
      sortOrder: order++
    }
    flat.push(item)
    
    if (children && children.length > 0) {
      flat.push(...flattenNavTree(children, clientId, node.id, order))
      order += children.length
    }
  })
  
  return flat
}

// Get navigation items (hierarchical)
router.get('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const items = await prisma.navigationItem.findMany({
      where: { clientId },
      orderBy: { sortOrder: 'asc' },
      include: { page: true }
    })
    
    // Return both flat and hierarchical structures
    const tree = buildNavTree(items)
    res.json({
      flat: items,
      tree: tree,
      active: items.filter(i => i.isActive)
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get navigation tree only (for frontend)
router.get('/tree', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const items = await prisma.navigationItem.findMany({
      where: { clientId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { page: true }
    })
    
    const tree = buildNavTree(items)
    res.json(tree)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Save navigation (hierarchical structure)
router.put('/', async (req, res) => {
  try {
    const { tree } = req.body
    const clientId = getClientId(req)
    
    // Flatten tree for storage
    const flatItems = flattenNavTree(tree, clientId)
    
    await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.navigationItem.deleteMany({ where: { clientId } })
      
      // Create new items
      for (const item of flatItems) {
        const { id, children, ...itemData } = item
        await tx.navigationItem.create({
          data: itemData
        })
      }
    })
    
    res.json({ success: true, count: flatItems.length })
  } catch (err) {
    console.error('Save navigation error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Update single item
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body
    
    const updated = await prisma.navigationItem.update({
      where: { id },
      data,
      include: { page: true }
    })
    
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create new item
router.post('/', async (req, res) => {
  try {
    const data = req.body
    const clientId = getClientId(req)
    
    // Get max sortOrder for the parent
    const maxOrder = await prisma.navigationItem.aggregate({
      where: { 
        clientId, 
        parentId: data.parentId || null 
      },
      _max: { sortOrder: true }
    })
    
    const created = await prisma.navigationItem.create({
      data: {
        ...data,
        clientId,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1
      },
      include: { page: true }
    })
    
    res.json(created)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Delete children first (cascade)
    await prisma.navigationItem.deleteMany({
      where: { parentId: id }
    })
    
    await prisma.navigationItem.delete({
      where: { id }
    })
    
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Reorder items
router.put('/reorder', async (req, res) => {
  try {
    const { items } = req.body
    const clientId = getClientId(req)
    
    await prisma.$transaction(
      items.map(({ id, sortOrder, parentId }) =>
        prisma.navigationItem.update({
          where: { id },
          data: { sortOrder, parentId, clientId }
        })
      )
    )
    
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router

