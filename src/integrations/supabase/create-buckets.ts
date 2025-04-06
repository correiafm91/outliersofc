
import { supabase } from './client';

export const REQUIRED_BUCKETS = ['images', 'user-avatars', 'user-banners'];

// Function to create required storage buckets
export async function createRequiredBuckets(): Promise<boolean> {
  try {
    console.log("Starting to create required buckets...");
    const results = await Promise.allSettled(
      REQUIRED_BUCKETS.map(async (bucketName) => {
        return await ensureBucketExists(bucketName);
      })
    );
    
    // Check if all buckets were created successfully
    const allSucceeded = results.every(
      (result) => result.status === 'fulfilled' && result.value === true
    );
    
    console.log(`Buckets creation finished. All succeeded: ${allSucceeded}`);
    console.log("Results:", results);
    return allSucceeded;
  } catch (error) {
    console.error('Error creating required buckets:', error);
    return false;
  }
}

// Function to ensure a bucket exists
export async function ensureBucketExists(bucketName: string): Promise<boolean> {
  try {
    console.log(`Checking if bucket exists: ${bucketName}`);
    // First try to get the bucket to check if it exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`Error listing buckets:`, listError);
      return false;
    }
    
    const bucketExists = existingBuckets?.some(bucket => bucket.name === bucketName);
    
    // If bucket doesn't exist, create it
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} does not exist, creating...`);
      try {
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true
        });
        
        if (createError) {
          if (createError.message.includes("duplicate key value violates unique constraint")) {
            console.log(`Bucket ${bucketName} already exists (race condition).`);
            return true;
          }
          console.error(`Error creating bucket ${bucketName}:`, createError);
          return false;
        }
        
        console.log(`Successfully created bucket: ${bucketName}`);
        
        // Update public policy for the bucket - Fix: Remove error property access
        const publicUrlData = supabase.storage.from(bucketName).getPublicUrl('test-policy');
        console.log(`Public URL for ${bucketName}:`, publicUrlData);
        
        return true;
      } catch (createCatchError) {
        // Special handling for duplicate key errors which might happen in race conditions
        if (createCatchError instanceof Error && 
            createCatchError.message.includes("duplicate key value violates unique constraint")) {
          console.log(`Bucket ${bucketName} already exists (race condition).`);
          return true;
        }
        console.error(`Error creating bucket ${bucketName}:`, createCatchError);
        return false;
      }
    } else {
      console.log(`Bucket ${bucketName} already exists.`);
      return true;
    }
  } catch (error) {
    console.error(`Error ensuring bucket ${bucketName} exists:`, error);
    return false;
  }
}
