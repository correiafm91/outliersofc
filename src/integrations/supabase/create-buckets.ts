
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

    // Create any missing buckets
    for (const bucketName of requiredBuckets) {
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(bucketName, { 
          public: true 
        });
          
        if (error) {
          console.error(`Erro ao criar bucket ${bucketName}:`, error);
        } else {
          console.log(`Bucket ${bucketName} criado com sucesso`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao verificar/criar buckets:", error);
    return false;
  }
}
