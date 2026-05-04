const nodemailer = require('nodemailer');

async function testSMTPConnectivity() {
  console.log('[TEST] Testing SMTP connectivity on Railway...');
  
  const config = {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpUser: 'het.dinedesk@gmail.com',
    smtpPassword: 'inwoatqaexkcfuyc'
  };

  try {
    console.log('[TEST] Creating test transporter...');
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: true,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000
    });

    console.log('[TEST] Verifying connection...');
    await transporter.verify();
    console.log('[TEST] SMTP connection successful!');
    
    // Try sending a test email
    console.log('[TEST] Sending test email...');
    await transporter.sendMail({
      from: 'noreply@captaincons.com',
      to: 'hetshah704@gmail.com',
      subject: '🧪 Railway SMTP Test',
      html: '<p>This is a test email from Railway to verify SMTP connectivity.</p>'
    });
    console.log('[TEST] Test email sent successfully!');
    
  } catch (error) {
    console.error('[TEST] SMTP test failed:', error.message);
    console.error('[TEST] Error code:', error.code);
    console.error('[TEST] Full error:', error);
  }
}

// Run the test
testSMTPConnectivity().catch(console.error);
