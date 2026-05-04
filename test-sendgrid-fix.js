// Test script to verify SendGrid data persistence fix
const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';
const TEST_CLIENT_ID = 'test-client';

async function testSendGridPersistence() {
  console.log('🧪 Testing SendGrid data persistence fix...\n');
  
  try {
    // 1. Test initial config (should be empty or have existing data)
    console.log('1. Getting initial config...');
    const initialConfig = await axios.get(`${API_BASE}/clients/${TEST_CLIENT_ID}/config`);
    console.log('Initial notifications config:', initialConfig.data.notifications || 'undefined');
    
    // 2. Test saving SendGrid data
    console.log('\n2. Saving SendGrid configuration...');
    const testSendGridData = {
      notifications: {
        smtpHost: '',
        smtpPort: '587',
        smtpUser: '',
        smtpPassword: '',
        smtpFrom: '',
        sendCustomerReceipt: true,
        sendRestaurantNotification: true,
        sendgridApiKey: 'SG.test123456789',
        sendgridFrom: 'test@restaurant.com',
        useSendGrid: true
      }
    };
    
    const saveResponse = await axios.put(`${API_BASE}/clients/${TEST_CLIENT_ID}/config`, testSendGridData);
    console.log('Save response status:', saveResponse.status);
    console.log('Saved notifications data:', saveResponse.data.notifications);
    
    // 3. Test retrieving saved data
    console.log('\n3. Retrieving saved config...');
    const retrievedConfig = await axios.get(`${API_BASE}/clients/${TEST_CLIENT_ID}/config`);
    console.log('Retrieved notifications config:', retrievedConfig.data.notifications);
    
    // 4. Verify SendGrid fields are preserved
    const notifications = retrievedConfig.data.notifications;
    if (notifications && notifications.sendgridApiKey === 'SG.test123456789' && notifications.sendgridFrom === 'test@restaurant.com') {
      console.log('\n✅ SUCCESS: SendGrid data is correctly saved and retrieved!');
    } else {
      console.log('\n❌ FAILURE: SendGrid data was not preserved correctly');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testSendGridPersistence();
