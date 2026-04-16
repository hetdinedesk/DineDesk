const express = require('express')
const { prisma } = require('../lib/prisma')
const router = express.Router({ mergeParams: true })

const getClientId = (req) => req.params.clientId || req.params.id

function isTempId (id) {
  return !id || String(id).startsWith('temp-')
}

/**
 * Build hierarchical tree from flat navigation items (roots + one level of children).
 */
function buildNavTree (items) {
  const itemMap = new Map()
  const roots = []

  items.forEach((item) => {
    itemMap.set(item.id, { ...item, children: [] })
  })

  items.forEach((item) => {
    const node = itemMap.get(item.id)
    if (item.parentId && itemMap.has(item.parentId)) {
      itemMap.get(item.parentId).children.push(node)
    } else if (!item.parentId) {
      roots.push(node)
    }
  })

  const sortByOrder = (a, b) => a.sortOrder - b.sortOrder
  roots.sort(sortByOrder)
  roots.forEach((node) => {
    if (node.children) node.children.sort(sortByOrder)
  })

  return roots
}

/**
 * GET — full CMS payload: header tree, pages, footer, banners, locations
 */
router.get('/', async (req, res) => {
  try {
    const clientId = getClientId(req)

    const [navFlat, pages, footerSections, unassignedFooterLinks, locations, banners] = await Promise.all([
      prisma.navigationItem.findMany({
        where: { clientId },
        orderBy: [{ sortOrder: 'asc' }],
        include: { page: true }
      }),
      prisma.page.findMany({
        where: { clientId },
        orderBy: [{ navOrder: 'asc' }]
      }),
      prisma.footerSection.findMany({
        where: { clientId },
        orderBy: { sortOrder: 'asc' },
        include: {
          links: { orderBy: { sortOrder: 'asc' }, include: { page: true } }
        }
      }),
      prisma.footerLink.findMany({
        where: { clientId, footerSectionId: null },
        orderBy: { sortOrder: 'asc' },
        include: { page: true }
      }),
      prisma.location.findMany({
        where: { clientId, isActive: true },
        orderBy: { name: 'asc' }
      }),
      prisma.banner.findMany({
        where: { clientId },
        orderBy: [{ sortOrder: 'asc' }]
      })
    ])

    const headerSections = buildNavTree(navFlat)

    res.json({
      headerSections,
      pages,
      footerSections,
      unassignedFooterLinks,
      locations,
      banners
    })
  } catch (err) {
    console.error('Get navbar error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Upsert navigation headers (preserves stable ids so saves succeed and pages stay linked).
 */
async function upsertHeaderSections (tx, clientId, headerSections, pageById) {
  const navUrlFor = (pageId, fallbackUrl = '') => {
    if (!pageId) return fallbackUrl || ''
    const p = pageById.get(pageId)
    if (!p) return fallbackUrl || ''
    const s = (p.slug || '').replace(/^\//, '')
    return s ? `/${s}` : ''
  }

  const existing = await tx.navigationItem.findMany({ where: { clientId } })
  const keptIds = new Set()

  const upsertRoot = async (h, hi) => {
    const hUrl = h.url != null && h.url !== '' ? h.url : navUrlFor(h.pageId, '')
    const pageId = h.pageId && !isTempId(h.pageId) ? h.pageId : null
    const data = {
      label: String(h.label || '').trim() || 'Menu',
      url: hUrl || '',
      isActive: h.isActive !== false,
      sortOrder: hi,
      pageId,
      parentId: null
    }

    if (!isTempId(h.id)) {
      const row = await tx.navigationItem.findUnique({
        where: { id: h.id }
      })
      if (row && row.clientId === clientId) {
        await tx.navigationItem.update({
          where: { id: h.id },
          data
        })
        keptIds.add(h.id)
        return h.id
      }
    }

    const created = await tx.navigationItem.create({
      data: { ...data, clientId }
    })
    keptIds.add(created.id)
    return created.id
  }

  const upsertChild = async (c, parentId, ci) => {
    const pg = c.pageId && !isTempId(c.pageId) ? pageById.get(c.pageId) : null
    const label = String(c.label || '').trim() || (pg ? pg.title : 'Page')
    const cUrl = c.url != null && c.url !== '' ? c.url : navUrlFor(c.pageId, '')
    const pageId = c.pageId && !isTempId(c.pageId) ? c.pageId : null
    const data = {
      label,
      url: cUrl || '',
      isActive: c.isActive !== false,
      sortOrder: ci,
      pageId,
      parentId
    }

    if (!isTempId(c.id)) {
      const row = await tx.navigationItem.findUnique({
        where: { id: c.id }
      })
      if (row && row.clientId === clientId) {
        await tx.navigationItem.update({
          where: { id: c.id },
          data
        })
        keptIds.add(c.id)
        return c.id
      }
    }

    const created = await tx.navigationItem.create({
      data: { ...data, clientId }
    })
    keptIds.add(created.id)
    return created.id
  }

  for (let hi = 0; hi < headerSections.length; hi++) {
    const h = headerSections[hi]
    const rootId = await upsertRoot(h, hi)
    const children = Array.isArray(h.children) ? h.children : []
    for (let ci = 0; ci < children.length; ci++) {
      await upsertChild(children[ci], rootId, ci)
    }
  }

  const toRemove = existing.filter((e) => !keptIds.has(e.id))
  if (toRemove.length) {
    // Delete children first, then roots
    const childrenToRemove = toRemove.filter(e => e.parentId)
    const rootsToRemove = toRemove.filter(e => !e.parentId)
    
    if (childrenToRemove.length) {
      await tx.navigationItem.deleteMany({
        where: { id: { in: childrenToRemove.map(x => x.id) } }
      })
    }
    if (rootsToRemove.length) {
      await tx.navigationItem.deleteMany({
        where: { id: { in: rootsToRemove.map(x => x.id) } }
      })
    }
  }
}

/**
 * Replace footer sections (full replace)
 */
async function replaceFooterSections (tx, clientId, footerSections) {
  // Delete only footer links that are assigned to sections, preserve unassigned links
  await tx.footerLink.deleteMany({
    where: { footerSectionId: { not: null }, footerSection: { clientId } }
  })
  await tx.footerSection.deleteMany({ where: { clientId } })

  for (let si = 0; si < footerSections.length; si++) {
    const section = footerSections[si]
    const createdSection = await tx.footerSection.create({
      data: {
        title: String(section.title || '').trim() || 'Links',
        isActive: section.isActive !== false,
        clientId,
        sortOrder: si
      }
    })

    const links = Array.isArray(section.links) ? section.links : []
    for (let li = 0; li < links.length; li++) {
      const link = links[li]
      // Skip links without label or without both pageId and externalUrl
      if (!link.label || (!link.pageId && !link.externalUrl)) {
        continue
      }
      await tx.footerLink.create({
        data: {
          clientId,
          label: String(link.label || '').trim() || 'Link',
          pageId: link.pageId || null,
          externalUrl: link.externalUrl || null,
          footerSectionId: createdSection.id,
          sortOrder: li
        }
      })
    }
  }
}

/**
 * PUT — upsert navigation + optional footer
 */
router.put('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { headerSections, footerSections } = req.body

    // Ensure client exists first
    const clientExists = await prisma.client.findUnique({ where: { id: clientId } })
    if (!clientExists) {
      console.error('Client not found during navbar save:', clientId)
      return res.status(404).json({ error: 'Client not found' })
    }

    await prisma.$transaction(async (tx) => {
      const pages = await tx.page.findMany({ where: { clientId } })
      const pageById = new Map(pages.map((p) => [p.id, p]))

      if (Array.isArray(headerSections)) {
        await upsertHeaderSections(tx, clientId, headerSections, pageById)
      }

      if (Array.isArray(footerSections)) {
        await replaceFooterSections(tx, clientId, footerSections)
      }
    }, { timeout: 15000 })

    const navFlat = await prisma.navigationItem.findMany({
      where: { clientId },
      orderBy: [{ sortOrder: 'asc' }],
      include: { page: true }
    })
    const tree = buildNavTree(navFlat)

    res.json({ success: true, headerSections: tree })
  } catch (err) {
    console.error('Save navbar error:', err)
    res.status(500).json({ error: err.message })
  }
})

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

/**
 * DELETE — delete a footer link
 */
router.delete('/footer-links/:linkId', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const linkId = req.params.linkId

    const link = await prisma.footerLink.findUnique({
      where: { id: linkId }
    })

    if (!link || link.clientId !== clientId) {
      return res.status(404).json({ error: 'Footer link not found' })
    }

    await prisma.footerLink.delete({
      where: { id: linkId }
    })

    res.json({ success: true })
  } catch (err) {
    console.error('Delete footer link error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * PUT — update a footer link (assign to section or unassign)
 */
router.put('/footer-links/:linkId', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const linkId = req.params.linkId
    const { footerSectionId } = req.body

    const link = await prisma.footerLink.findUnique({
      where: { id: linkId }
    })

    if (!link || link.clientId !== clientId) {
      return res.status(404).json({ error: 'Footer link not found' })
    }

    const updated = await prisma.footerLink.update({
      where: { id: linkId },
      data: {
        footerSectionId: footerSectionId || null
      }
    })

    res.json(updated)
  } catch (err) {
    console.error('Update footer link error:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
