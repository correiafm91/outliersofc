
import { supabase } from './client';

export const REQUIRED_BUCKETS = ['images', 'user-avatars', 'user-banners'];

// Function to create required storage buckets
export async function createRequiredBuckets(): Promise<boolean> {
  try {
    const results = await Promise.allSettled(
      REQUIRED_BUCKETS.map(async (bucketName) => {
        return await ensureBucketExists(bucketName);
      })
    );
    
    // Check if all buckets were created successfully
    const allSucceeded = results.every(
      (result) => result.status === 'fulfilled' && result.value === true
    );
    
    return allSucceeded;
  } catch (error) {
    console.error('Error creating required buckets:', error);
    return false;
  }
}

// Function to ensure a bucket exists
async function ensureBucketExists(bucketName: string): Promise<boolean> {
  try {
    // First try to get the bucket to check if it exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`Error listing buckets:`, listError);
      return false;
    }
    
    const bucketExists = existingBuckets?.some(bucket => bucket.name === bucketName);
    
    // If bucket doesn't exist, create it
    if (!bucketExists) {
      try {
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
        });
        
        if (createError) {
          console.error(`Error creating bucket ${bucketName}:`, createError);
          return false;
        }
        
        console.log(`Successfully created bucket: ${bucketName}`);
        
        // Set bucket to public (removed setPublic which doesn't exist)
        // Instead, we'll use specific RLS policies if needed
      } catch (createCatchError) {
        console.error(`Error creating bucket ${bucketName}:`, createCatchError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error ensuring bucket ${bucketName} exists:`, error);
    return false;
  }
}
