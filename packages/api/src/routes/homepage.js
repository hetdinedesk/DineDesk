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
    console.error('Get homepage error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Save homepage sections
router.put('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const sections = req.body
    await prisma.$transaction(async (tx) => {
      // Delete all member department relationships first
      await tx.memberDepartment.deleteMany({
        where: {
          homeSection: {
            clientId
          }
        }
      })
      
      // Delete all existing sections
      await tx.homeSection.deleteMany({ where: { clientId } })
      
      // Create new sections and department relationships
      for (let section of sections) {
        const { departmentIds, ...sectionData } = section
        
        const createdSection = await tx.homeSection.create({
          data: {
            clientId,
            type: section.type,
            title: section.title,
            content: section.content,
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
            await tx.memberDepartment.create({
              data: {
                homeSectionId: createdSection.id,
                departmentId: deptId
              }
            })
          }
        }
      }
    })
    res.json({ success: true })
  } catch (err) {
    console.error('Save homepage error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Create single section (for POST)
router.post('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const section = await prisma.homeSection.create({
      data: { ...req.body, clientId }
    })
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

