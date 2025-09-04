#!/usr/bin/env node

import { serverEnvSchema, clientEnvSchema, azureEnvSchema } from './env-schema';

/**
 * Environment variable checker that prints which variables are present/missing
 * without revealing actual secret values (masks all but first 4 chars)
 */

interface EnvCheckResult {
  name: string;
  present: boolean;
  maskedValue: string;
  required: boolean;
}

function maskSecret(value: string): string {
  if (value.length <= 4) {
    return '*'.repeat(value.length);
  }
  return value.substring(0, 4) + '*'.repeat(value.length - 4);
}

function checkEnvironmentVariables(): void {
  console.log('🔍 Environment Variable Check');
  console.log('=' .repeat(50));
  
  // Check server environment variables
  console.log('\n📋 Server Environment Variables:');
  const serverVars = checkSchemaVariables(serverEnvSchema, 'server');
  printResults(serverVars);
  
  // Check client environment variables
  console.log('\n📱 Client Environment Variables:');
  const clientVars = checkSchemaVariables(clientEnvSchema, 'client');
  printResults(clientVars);
  
  // Check Azure environment variables
  console.log('\n☁️  Azure Environment Variables:');
  const azureVars = checkSchemaVariables(azureEnvSchema, 'azure');
  printResults(azureVars);
  
  // Summary
  const allVars = [...serverVars, ...clientVars, ...azureVars];
  const missingRequired = allVars.filter(v => v.required && !v.present);
  const presentRequired = allVars.filter(v => v.required && v.present);
  
  console.log('\n📊 Summary:');
  console.log(`✅ Required variables present: ${presentRequired.length}`);
  console.log(`❌ Required variables missing: ${missingRequired.length}`);
  
  if (missingRequired.length > 0) {
    console.log('\n❌ Missing required variables:');
    missingRequired.forEach(v => console.log(`   - ${v.name}`));
    process.exit(1);
  } else {
    console.log('\n🎉 All required environment variables are present!');
  }
}

function checkSchemaVariables(schema: any, context: string): EnvCheckResult[] {
  const results: EnvCheckResult[] = [];
  const env = process.env;
  
  // Get all keys from the schema
  const schemaKeys = Object.keys(schema.shape);
  
  schemaKeys.forEach(key => {
    const value = env[key];
    const present = !!value;
    const required = !schema.shape[key].isOptional?.();
    
    results.push({
      name: key,
      present,
      maskedValue: present ? maskSecret(value) : 'NOT_SET',
      required
    });
  });
  
  return results;
}

function printResults(results: EnvCheckResult[]): void {
  results.forEach(result => {
    const status = result.present ? '✅' : '❌';
    const required = result.required ? ' (REQUIRED)' : ' (OPTIONAL)';
    const value = result.present ? ` = ${result.maskedValue}` : '';
    
    console.log(`   ${status} ${result.name}${required}${value}`);
  });
}

// Run the check if this file is executed directly
if (require.main === module) {
  try {
    checkEnvironmentVariables();
  } catch (error) {
    console.error('❌ Environment check failed:', error);
    process.exit(1);
  }
}

export { checkEnvironmentVariables, maskSecret };
