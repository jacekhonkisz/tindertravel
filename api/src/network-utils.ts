import { networkInterfaces } from 'os';

/**
 * Get the local network IP address
 * This is used to display connection information on server startup
 */
export function getLocalNetworkIP(): string {
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    const netInterface = nets[name];
    if (!netInterface) continue;
    
    for (const net of netInterface) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
      if (net.family === familyV4Value && !net.internal) {
        return net.address;
      }
    }
  }
  
  return 'localhost';
}

/**
 * Display server connection information
 * Shows all available URLs for connecting to the server
 */
export function displayServerInfo(port: number): void {
  const networkIP = getLocalNetworkIP();
  
  console.log('\n' + '='.repeat(60));
  console.log('🌐 GLINTZ API SERVER - CONNECTION INFORMATION');
  console.log('='.repeat(60));
  console.log('');
  console.log('📱 MOBILE APP CONFIGURATION:');
  console.log(`   Update API_BASE_URL in app/src/api/client.ts to:`);
  console.log(`   👉 http://${networkIP}:${port}`);
  console.log('');
  console.log('🔗 Available Endpoints:');
  console.log(`   Local:     http://localhost:${port}`);
  console.log(`   Network:   http://${networkIP}:${port}`);
  console.log('');
  console.log('🧪 Quick Test:');
  console.log(`   curl http://${networkIP}:${port}/health`);
  console.log('');
  console.log('📋 Health Check:');
  console.log(`   http://${networkIP}:${port}/health`);
  console.log('');
  console.log('🏨 Hotels API:');
  console.log(`   http://${networkIP}:${port}/api/hotels?limit=5`);
  console.log('');
  console.log('⚠️  IMPORTANT FOR MOBILE:');
  console.log('   Make sure your mobile device/simulator is on the same network!');
  console.log('   Network IP: ' + networkIP);
  console.log('');
  console.log('='.repeat(60));
  console.log('');
}

