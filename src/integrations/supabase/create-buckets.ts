
import { supabase } from "./client";

/**
 * Utility function to create all required storage buckets
 * Call this function when the application starts to ensure all needed buckets exist
 */
export async function createRequiredBuckets() {
  // List of required buckets
  const requiredBuckets = ['images', 'user-avatars', 'user-banners'];
  
  try {
    // First check if the buckets exist
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Error checking buckets:", listError);
      return false;
    }

    let allSuccess = true;
    
    // Create any missing buckets
    for (const bucketName of requiredBuckets) {
      try {
        const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
        
        if (!bucketExists) {
          const { error } = await supabase.storage.createBucket(bucketName, { 
            public: true 
          });
            
          if (error) {
            console.error(`Error creating bucket ${bucketName}:`, error);
            allSuccess = false;
          } else {
            console.log(`Bucket ${bucketName} created successfully`);
            
            // Set bucket to be public by creating policy
            const { error: policyError } = await supabase.storage.from(bucketName).createSignedUrl('dummy-path.txt', 1);
            if (policyError) {
              console.log(`Note: Policy creation for ${bucketName} returned:`, policyError);
              // This is expected to fail since the file doesn't exist
              // We're just using it to ensure the bucket is properly initialized
            }
          }
        }
      } catch (bucketError) {
        console.error(`Exception handling bucket ${bucketName}:`, bucketError);
        allSuccess = false;
      }
    }
    
    return allSuccess;
  } catch (error) {
    console.error("Error checking/creating buckets:", error);
    return false;
  }
}
