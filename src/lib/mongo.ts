import mongoose from 'mongoose';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  throw new Error('Please define the MONGO_URL environment variable');
}

interface ConnectionCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const cache: ConnectionCache = {
  conn: null,
  promise: null
};

async function connectDB(): Promise<typeof mongoose> {
  const startTime = performance.now();
  
  if (!MONGO_URL) {
    throw new Error('Please define the MONGO_URL environment variable');
  }

  // In serverless environments, check if we have a valid connection
  if (cache.conn && mongoose.connection.readyState === 1) {
    const cacheTime = performance.now() - startTime;
    console.log(chalk.grey(`Using existing MongoDB connection (${cacheTime.toFixed(2)}ms)`));
    return cache.conn;
  }

  // Reset cache if connection is not ready
  if (cache.conn && mongoose.connection.readyState !== 1) {
    cache.conn = null;
    cache.promise = null;
  }

  if (!cache.promise) {
    const connectionStartTime = performance.now();
    console.log(chalk.green('Creating new MongoDB connection'));
    
    const opts = {
      bufferCommands: false,
      // SSL Configuration for Vercel
      ssl: true,
      
      // Connection timeouts optimized for serverless
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      
      // Connection pool settings for serverless
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
      
      // Additional options for stability
      heartbeatFrequencyMS: 10000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    cache.promise = mongoose.connect(MONGO_URL, opts).then((mongoose) => {
      const connectionTime = performance.now() - connectionStartTime;
      console.log(chalk.green(`MongoDB connection established (${connectionTime.toFixed(2)}ms)`));
      return mongoose;
    }).catch((error) => {
      const connectionTime = performance.now() - connectionStartTime;
      console.error(chalk.red(`MongoDB connection failed after ${connectionTime.toFixed(2)}ms:`), error);
      cache.promise = null;
      throw error;
    });
  }

  try {
    cache.conn = await cache.promise;
    const totalTime = performance.now() - startTime;
    console.log(chalk.blue(`Total connectDB execution time: ${totalTime.toFixed(2)}ms`));
  } catch (e) {
    cache.promise = null;
    cache.conn = null;
    const totalTime = performance.now() - startTime;
    console.error(chalk.red(`MongoDB connection error after ${totalTime.toFixed(2)}ms:`), e);
    throw e;
  }

  return cache.conn;
}

// Handle connection errors with more detailed logging
mongoose.connection.on('error', (err) => {
  console.error(chalk.red('MongoDB connection error:'), err);
  // Reset cache on error to force reconnection
  cache.conn = null;
  cache.promise = null;
});

// Log when successfully connected
mongoose.connection.once('open', () => {
  const timestamp = new Date().toISOString();
  console.log(chalk.green(`Connected to MongoDB successfully at ${timestamp}`));
});

// Handle disconnection
mongoose.connection.on('disconnected', () => {
  const timestamp = new Date().toISOString();
  console.warn(chalk.yellow(`MongoDB disconnected at ${timestamp}`));
  cache.conn = null;
  cache.promise = null;
});

// Handle reconnection
mongoose.connection.on('reconnected', () => {
  const timestamp = new Date().toISOString();
  console.log(chalk.green(`MongoDB reconnected at ${timestamp}`));
});

// Handle process termination - but avoid in serverless
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log(chalk.grey('MongoDB connection closed through app termination'));
    } catch (error) {
      console.error(chalk.red('Error closing MongoDB connection:'), error);
    }
    process.exit(0);
  });
}

export { connectDB };