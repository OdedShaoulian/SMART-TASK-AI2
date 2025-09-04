#!/usr/bin/env node

/**
 * Environment Variable Checker
 * Prints the presence/absence of required environment variables
 * Masks secret values for security
 */

/**
 * Mask secret values for logging
 * @param {string} value - The secret value to mask
 * @param {number} visibleChars - Number of characters to show (default: 4)
 * @returns {string} Masked value
 */
function maskSecret(value, visibleChars = 4) {
  if (!value || value.length <= visibleChars) {
    return '***';
  }
  return value.substring(0, visibleChars) + '*'.repeat(Math.max(0, value.length - visibleChars));
}

/**
 * Check environment variables and print results
 */
function checkEnvironmentVariables() {
  console.log('🔍 Environment Variable Check\n');
  
  // Server environment variables
  console.log('📋 Server Environment Variables:');
  const serverVars = [
    'DATABASE_URL',
    'JWT_SECRET', 
    'COOKIE_SECRET',
    'CSRF_SECRET',
    'CORS_ORIGIN',
    'PORT',
    'NODE_ENV'
  ];
  
  let serverValid = true;
  serverVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      const maskedValue = ['JWT_SECRET', 'COOKIE_SECRET', 'CSRF_SECRET', 'DATABASE_URL'].includes(varName) 
        ? maskSecret(value) 
        : value;
      console.log(`  ✅ ${varName}: ${maskedValue}`);
    } else {
      console.log(`  ❌ ${varName}: MISSING`);
      serverValid = false;
    }
  });
  
  // Client environment variables
  console.log('\n📋 Client Environment Variables:');
  const clientVars = ['VITE_API_URL'];
  
  let clientValid = true;
  clientVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: ${value}`);
    } else {
      console.log(`  ❌ ${varName}: MISSING`);
      clientValid = false;
    }
  });
  
  // Azure deployment variables (for CI/CD)
  console.log('\n📋 Azure Deployment Variables:');
  const azureVars = [
    'AZURE_WEBAPP_NAME',
    'AZURE_WEBAPP_PUBLISH_PROFILE',
    'AZURE_STATIC_WEB_APPS_API_TOKEN',
    'AZURE_STATIC_WEB_APP_NAME',
    'PRODUCTION_API_URL'
  ];
  
  let azureValid = true;
  azureVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      const maskedValue = ['AZURE_WEBAPP_PUBLISH_PROFILE', 'AZURE_STATIC_WEB_APPS_API_TOKEN'].includes(varName)
        ? maskSecret(value, 8)
        : value;
      console.log(`  ✅ ${varName}: ${maskedValue}`);
    } else {
      console.log(`  ❌ ${varName}: MISSING`);
      azureValid = false;
    }
  });
  
  console.log('\n📊 Summary:');
  console.log(`  Server Environment: ${serverValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`  Client Environment: ${clientValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`  Azure Deployment: ${azureValid ? '✅ Valid' : '❌ Invalid'}`);
  
  if (!serverValid || !clientValid || !azureValid) {
    console.log('\n❌ Environment validation failed. Please set missing variables.');
    process.exit(1);
  }
  
  console.log('\n✅ All environment variables are properly configured!');
}

// Run the check
try {
  checkEnvironmentVariables();
} catch (error) {
  console.error('❌ Error checking environment variables:', error.message);
  process.exit(1);
}
