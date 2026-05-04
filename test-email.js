const nodemailer = require('nodemailer');

// Test your SMTP configuration
async function testEmailConfig() {
  console.log('Testing SMTP configuration...\n');
  
  // Replace with your actual settings from CMS
  const config = {
    smtpHost: 'smtp.gmail.com',  // Replace with your actual host
    smtpPort: 587,               // Replace with your actual port
    smtpUser: 'your-actual-gmail@gmail.com', // Replace with your actual email
    smtpPassword: 'your-16-char-app-password',   // Replace with your actual app password
    smtpFrom: 'noreply@yourrestaurant.com' // Replace with your actual from email
  };

  console.log('Configuration:');
  console.log('Host:', config.smtpHost);
  console.log('Port:', config.smtpPort);
  console.log('User:', config.smtpUser);
  console.log('From:', config.smtpFrom);
  console.log('Password:', config.smtpPassword ? '***SET***' : 'NOT SET');
  console.log('');

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword
      }
    });

    console.log('Testing connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Test sending email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: config.smtpFrom,
      to: config.smtpUser, // Send to yourself for testing
      subject: '🧪 DineDesk Email Test',
      html: `
        <h2>SMTP Configuration Test</h2>
        <p>This is a test email from DineDesk to verify your SMTP settings.</p>
        <p><strong>Host:</strong> ${config.smtpHost}</p>
        <p><strong>Port:</strong> ${config.smtpPort}</p>
        <p><strong>From:</strong> ${config.smtpFrom}</p>
        <p><strong>If you receive this, your email configuration is working!</strong></p>
        <hr>
        <p>Time sent: ${new Date().toLocaleString()}</p>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Check your inbox (and spam folder) for the test email.');

  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error:', error.message);
    
    // Provide specific troubleshooting based on error
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Troubleshooting tips for EAUTH:');
      console.log('1. Make sure you\'re using an App Password (not your regular password)');
      console.log('2. Ensure 2-factor authentication is enabled on your Google account');
      console.log('3. Double-check the email address is correct');
      console.log('4. Verify the App Password was copied correctly (16 characters)');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🔧 Troubleshooting tips for ECONNECTION:');
      console.log('1. Check if smtp.gmail.com is correct');
      console.log('2. Verify port 587 is correct');
      console.log('3. Check your internet connection');
      console.log('4. Make sure firewall isn\'t blocking SMTP');
    } else if (error.code === 'EMESSAGE') {
      console.log('\n🔧 Troubleshooting tips for EMESSAGE:');
      console.log('1. Check if the "from" email address is valid');
      console.log('2. Verify recipient email address');
      console.log('3. Check email content format');
    }
  }
}

// Run the test
testEmailConfig().catch(console.error);
