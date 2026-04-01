const express = require('express')
const multer  = require('multer')
const router = express.Router()
const upload = multer({ dest: 'uploads/' })

// Upload image
router.post('/', upload.single('file'), async (req, res) => {
  try {
    // TODO: Upload to R2
    const url = `https://r2.dinedesk.com.au/${req.params.clientId}/${req.file.filename}`
    res.json({ url, filename: req.file.filename })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
