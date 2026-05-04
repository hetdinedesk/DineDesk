const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { sendEnquiryEmail } = require('../lib/email');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/enquiries - Submit enquiry form
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message, clientId } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: name, email, subject, message' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Get client data
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        settings: true,
        colours: true
      }
    });

    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client not found' 
      });
    }

    // Get notification config from client settings
    const notificationConfig = {
      smtpHost: client.settings?.smtpHost,
      smtpPort: client.settings?.smtpPort || 587,
      smtpUser: client.settings?.smtpUser,
      smtpPassword: client.settings?.smtpPassword,
      smtpFrom: client.settings?.smtpFrom
    };

    // Send email
    const emailResult = await sendEnquiryEmail(
      { name, email, phone, subject, message },
      client.name,
      notificationConfig,
      client
    );

    if (!emailResult.success) {
      console.error('[ENQUIRY] Failed to send email:', emailResult.message);
      // Still return success to user, but log the error
      // This prevents exposing SMTP configuration issues to users
    }

    res.json({ 
      success: true, 
      message: 'Enquiry submitted successfully' 
    });
  } catch (error) {
    console.error('[ENQUIRY] Error submitting enquiry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit enquiry' 
    });
  }
});

module.exports = router;
