const express = require('express');
const puppeteer = require('puppeteer-core');

const app = express();
const PORT = process.env.PORT || 3000;

let testResults = {
  status: 'pending',
  message: 'Test not yet run',
  timestamp: null,
  details: {}
};

async function testBrowserConnection() {
  console.log('='.repeat(60));
  console.log('BROWSER CONNECTION TEST');
  console.log('='.repeat(60));
  
  const wsEndpoint = process.env.BROWSER_WS_ENDPOINT_PRIVATE;
  console.log('\nConfiguration:');
  console.log('  WebSocket Endpoint:', wsEndpoint || 'NOT SET');
  
  if (!wsEndpoint) {
    const error = 'BROWSER_WS_ENDPOINT_PRIVATE environment variable is not set';
    console.error('\n❌ ERROR:', error);
    console.error('\nPlease set the environment variable:');
    console.error('  BROWSER_WS_ENDPOINT_PRIVATE=${browserless.BROWSER_WS_ENDPOINT_PRIVATE}');
    testResults = {
      status: 'failed',
      message: error,
      timestamp: new Date().toISOString(),
      details: { error: 'Missing environment variable' }
    };
    return;
  }
  
  let browser;
  const startTime = Date.now();
  
  try {
    // Test 1: Connect to browser
    console.log('\n[1/7] Connecting to browser service...');
    browser = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
      timeout: 15000
    });
    console.log('✅ Connected successfully!');
    testResults.details.connection = 'success';
    
    // Test 2: Get browser version
    console.log('\n[2/7] Getting browser version...');
    const version = await browser.version();
    console.log('✅ Browser version:', version);
    testResults.details.version = version;
    
    // Test 3: Create new page
    console.log('\n[3/7] Creating new page...');
    const page = await browser.newPage();
    console.log('✅ Page created successfully!');
    testResults.details.pageCreation = 'success';
    
    // Test 4: Navigate to test page
    console.log('\n[4/7] Navigating to example.com...');
    await page.goto('https://example.com', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    console.log('✅ Navigation successful!');
    testResults.details.navigation = 'success';
    
    // Test 5: Get page title
    console.log('\n[5/7] Getting page title...');
    const title = await page.title();
    console.log('✅ Page title:', title);
    testResults.details.pageTitle = title;
    
    // Test 6: Get page content
    console.log('\n[6/7] Getting page content...');
    const content = await page.content();
    console.log('✅ Page content length:', content.length, 'characters');
    testResults.details.contentLength = content.length;
    
    // Test 7: Close page
    console.log('\n[7/7] Closing page...');
    await page.close();
    console.log('✅ Page closed successfully!');
    
    const duration = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log(`\nTotal duration: ${duration}ms`);
    console.log('\nBrowser service is working correctly.');
    console.log('You can now use it in your agent services.');
    console.log('\n' + '='.repeat(60));
    
    testResults = {
      status: 'success',
      message: 'All tests passed',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      details: testResults.details
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED!');
    console.error('='.repeat(60));
    console.error('\nError:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    
    const errorMsg = error.message.toLowerCase();
    
    if (errorMsg.includes('econnrefused') || errorMsg.includes('connection refused')) {
      console.error('\n📋 Troubleshooting:');
      console.error('  • Check that browserless service is running');
      console.error('  • Verify both services are in the same Railway project');
      console.error('  • Ensure Railway private networking is enabled');
      console.error('  • Check the browserless service logs for errors');
    } else if (errorMsg.includes('timeout')) {
      console.error('\n📋 Troubleshooting:');
      console.error('  • Browser service might be overloaded');
      console.error('  • Increase timeout value');
      console.error('  • Check browser service memory allocation (2GB minimum)');
      console.error('  • Check browser service logs for errors');
    } else if (errorMsg.includes('websocket')) {
      console.error('\n📋 Troubleshooting:');
      console.error('  • Verify the WebSocket endpoint URL is correct');
      console.error('  • Check if the token is included in the URL');
      console.error('  • Ensure the browserless service is exposing the correct port');
    }
    
    console.error('\n' + '='.repeat(60));
    
    testResults = {
      status: 'failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      details: {
        ...testResults.details,
        error: error.message,
        stack: error.stack
      }
    };
    
  } finally {
    if (browser) {
      await browser.close();
      console.log('\nBrowser connection closed.');
    }
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'browser-test-service',
    status: 'running',
    testResults
  });
});

// Test results endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Browser Test Service',
    description: 'Tests connection to browserless service',
    testResults,
    endpoints: {
      '/': 'This page',
      '/health': 'Health check and test results',
      '/test': 'Run test manually'
    }
  });
});

// Manual test trigger endpoint
app.get('/test', async (req, res) => {
  res.json({
    message: 'Test started, check logs for results',
    currentResults: testResults
  });
  
  // Run test in background
  testBrowserConnection().catch(err => {
    console.error('Test error:', err);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\nBrowser Test Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Manual test: http://localhost:${PORT}/test\n`);
  
  // Run test automatically on startup
  console.log('Running automatic browser connection test...\n');
  testBrowserConnection().catch(err => {
    console.error('Startup test error:', err);
  });
});
