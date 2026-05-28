const express = require('express')
const { prisma } = require('../lib/prisma')
const { authenticateToken } = require('../middleware/auth')
const router = express.Router({ mergeParams: true })
router.use(authenticateToken)

// Helper to get clientId from params (handles both /:clientId and /:id)
const getClientId = (req) => req.params.clientId || req.params.id

// Get homepage sections
router.get('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const sections = await prisma.homeSection.findMany({
      where: { clientId },
      orderBy: { sortOrder: 'asc' },
      include: {
        memberDepartments: {
          include: {
            department: true
          }
        }
      }
    })
    // Transform to include departmentIds array
    const sectionsWithDepartments = sections.map(section => ({
      ...section,
      departmentIds: section.memberDepartments.map(md => md.departmentId),
      departments: section.memberDepartments.map(md => md.department)
    }))
    res.json(sectionsWithDepartments)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Save homepage sections
router.put('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const sections = req.body

    // Delete all member department relationships first
    await prisma.memberDepartment.deleteMany({
      where: {
        homeSection: {
          clientId
        }
      }
    }).catch(() => {})

    // Delete all existing sections
    await prisma.homeSection.deleteMany({ where: { clientId } }).catch(() => {})

    // Create new sections and department relationships
    for (let section of sections) {
      const { departmentIds, ...sectionData } = section

      // Handle content - if it's an object, stringify it
      let content = section.content
      if (typeof content === 'object' && content !== null) {
        content = JSON.stringify(content)
      }

      const createdSection = await prisma.homeSection.create({
        data: {
          clientId,
          type: section.type,
          title: section.title,
          content: content,
          imageUrl: section.imageUrl,
          buttonText: section.buttonText,
          buttonUrl: section.buttonUrl,
          sortOrder: section.sortOrder,
          isActive: section.isActive !== false
        }
      })

      // Create department relationships if departmentIds is provided
      if (departmentIds && Array.isArray(departmentIds) && departmentIds.length > 0) {
        for (const deptId of departmentIds) {
          await prisma.memberDepartment.create({
            data: {
              homeSectionId: createdSection.id,
              departmentId: deptId
            }
          })
        }
      }
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create single section (for POST)
router.post('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { departmentIds } = req.body
    let content = req.body.content
    if (typeof content === 'object' && content !== null) {
      content = JSON.stringify(content)
    }
    const section = await prisma.homeSection.create({
      data: {
        clientId,
        type: req.body.type || 'about',
        title: req.body.title,
        content,
        imageUrl: req.body.imageUrl,
        buttonText: req.body.buttonText,
        buttonUrl: req.body.buttonUrl,
        sortOrder: req.body.sortOrder ?? 0,
        isActive: req.body.isActive !== false
      }
    })
    if (departmentIds && Array.isArray(departmentIds) && departmentIds.length > 0) {
      for (const deptId of departmentIds) {
        await prisma.memberDepartment.create({ data: { homeSectionId: section.id, departmentId: deptId } })
      }
    }
    res.json(section)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update single section
router.put('/:id', async (req, res) => {
  try {
    const { departmentIds } = req.body
    let content = req.body.content
    if (typeof content === 'object' && content !== null) {
      content = JSON.stringify(content)
    }
    const section = await prisma.homeSection.update({
      where: { id: req.params.id },
      data: {
        title: req.body.title,
        content,
        imageUrl: req.body.imageUrl,
        buttonText: req.body.buttonText,
        buttonUrl: req.body.buttonUrl,
        sortOrder: req.body.sortOrder,
        isActive: req.body.isActive,
        type: req.body.type
      }
    })
    if (departmentIds !== undefined) {
      await prisma.memberDepartment.deleteMany({ where: { homeSectionId: req.params.id } })
      if (Array.isArray(departmentIds) && departmentIds.length > 0) {
        for (const deptId of departmentIds) {
          await prisma.memberDepartment.create({ data: { homeSectionId: req.params.id, departmentId: deptId } })
        }
      }
    }
    res.json(section)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete single section
router.delete('/:id', async (req, res) => {
  try {
    await prisma.homeSection.delete({
      where: { id: req.params.id }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router

