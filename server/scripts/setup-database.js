const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🔧 Setting up Azure SQL Database...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Run migrations
    console.log('📦 Running database migrations...');
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Database migrations completed');
    
    // Generate Prisma client
    console.log('🔨 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
