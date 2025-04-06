import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  actor_id: string;
  article_id: string | null;
  type: 'follow' | 'like' | 'comment' | 'comment_like' | 'comment_reply' | 'comment_mention';
  is_read: boolean;
  actor?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  article?: {
    id: string;
    title: string;
  };
}

export const getNotificationsWithActors = async (userId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        created_at,
        user_id,
        actor_id,
        article_id,
        type,
        is_read,
        actor:actor_id (
          id,
          username,
          avatar_url
        ),
        article:article_id (
          id,
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao buscar notificações:", error);
      return [];
    }

    return data.map(notification => ({
      ...notification,
      actor: notification.actor ? {
        id: notification.actor.id,
        username: notification.actor.username,
        avatar_url: notification.actor.avatar_url
      } : undefined,
      article: notification.article ? {
        id: notification.article.id,
        title: notification.article.title
      } : undefined
    })) as Notification[];
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return [];
  }
};

export const ensureColumnsExist = async () => {
  try {
    // Check if the 'sector' column exists in the 'profiles' table
    const { data: sectorColumn, error: sectorError } = await supabase
      .from('profiles')
      .select('sector')
      .limit(0);

    if (sectorError) {
      // If the 'sector' column doesn't exist, create it
      const { error: addSectorError } = await supabase.rpc(
        'add_column_if_not_exists',
        {
          table_name: 'profiles',
          column_name: 'sector',
          column_type: 'TEXT'
        }
      );

      if (addSectorError) {
        console.error("Erro ao adicionar coluna 'sector':", addSectorError);
      } else {
        console.log("Coluna 'sector' adicionada à tabela 'profiles'.");
      }
    } else {
      console.log("Coluna 'sector' já existe na tabela 'profiles'.");
    }

    // Check if the 'bio' column exists in the 'profiles' table
    const { data: bioColumn, error: bioError } = await supabase
      .from('profiles')
      .select('bio')
      .limit(0);

    if (bioError) {
      // If the 'bio' column doesn't exist, create it
      const { error: addBioError } = await supabase.rpc(
        'add_column_if_not_exists',
        {
          table_name: 'profiles',
          column_name: 'bio',
          column_type: 'TEXT'
        }
      );

      if (addBioError) {
        console.error("Erro ao adicionar coluna 'bio':", addBioError);
      } else {
        console.log("Coluna 'bio' adicionada à tabela 'profiles'.");
      }
    } else {
      console.log("Coluna 'bio' já existe na tabela 'profiles'.");
    }
    
    // Check if the 'banner_url' column exists in the 'profiles' table
    const { data: bannerColumn, error: bannerError } = await supabase
      .from('profiles')
      .select('banner_url')
      .limit(0);

    if (bannerError) {
      // If the 'banner_url' column doesn't exist, create it
      const { error: addBannerError } = await supabase.rpc(
        'add_column_if_not_exists',
        {
          table_name: 'profiles',
          column_name: 'banner_url',
          column_type: 'TEXT'
        }
      );

      if (addBannerError) {
        console.error("Erro ao adicionar coluna 'banner_url':", addBannerError);
      } else {
        console.log("Coluna 'banner_url' adicionada à tabela 'profiles'.");
      }
    } else {
      console.log("Coluna 'banner_url' já existe na tabela 'profiles'.");
    }
    
    // Check if the 'instagram_url' column exists in the 'profiles' table
    const { data: instagramColumn, error: instagramError } = await supabase
      .from('profiles')
      .select('instagram_url')
      .limit(0);

    if (instagramError) {
      // If the 'instagram_url' column doesn't exist, create it
      const { error: addInstagramError } = await supabase.rpc(
        'add_column_if_not_exists',
        {
          table_name: 'profiles',
          column_name: 'instagram_url',
          column_type: 'TEXT'
        }
      );

      if (addInstagramError) {
        console.error("Erro ao adicionar coluna 'instagram_url':", addInstagramError);
      } else {
        console.log("Coluna 'instagram_url' adicionada à tabela 'profiles'.");
      }
    } else {
      console.log("Coluna 'instagram_url' já existe na tabela 'profiles'.");
    }
    
    // Check if the 'linkedin_url' column exists in the 'profiles' table
    const { data: linkedinColumn, error: linkedinError } = await supabase
      .from('profiles')
      .select('linkedin_url')
      .limit(0);

    if (linkedinError) {
      // If the 'linkedin_url' column doesn't exist, create it
      const { error: addLinkedinError } = await supabase.rpc(
        'add_column_if_not_exists',
        {
          table_name: 'profiles',
          column_name: 'linkedin_url',
          column_type: 'TEXT'
        }
      );

      if (addLinkedinError) {
        console.error("Erro ao adicionar coluna 'linkedin_url':", addLinkedinError);
      } else {
        console.log("Coluna 'linkedin_url' adicionada à tabela 'profiles'.");
      }
    } else {
      console.log("Coluna 'linkedin_url' já existe na tabela 'profiles'.");
    }
    
        // Check if the 'facebook_url' column exists in the 'profiles' table
    const { data: facebookColumn, error: facebookError } = await supabase
      .from('profiles')
      .select('facebook_url')
      .limit(0);

    if (facebookError) {
      // If the 'facebook_url' column doesn't exist, create it
      const { error: addFacebookError } = await supabase.rpc(
        'add_column_if_not_exists',
        {
          table_name: 'profiles',
          column_name: 'facebook_url',
          column_type: 'TEXT'
        }
      );

      if (addFacebookError) {
        console.error("Erro ao adicionar coluna 'facebook_url':", addFacebookError);
      } else {
        console.log("Coluna 'facebook_url' adicionada à tabela 'profiles'.");
      }
    } else {
      console.log("Coluna 'facebook_url' já existe na tabela 'profiles'.");
    }
    
            // Check if the 'youtube_url' column exists in the 'profiles' table
    const { data: youtubeColumn, error: youtubeError } = await supabase
      .from('profiles')
      .select('youtube_url')
      .limit(0);

    if (youtubeError) {
      // If the 'youtube_url' column doesn't exist, create it
      const { error: addYoutubeError } = await supabase.rpc(
        'add_column_if_not_exists',
        {
          table_name: 'profiles',
          column_name: 'youtube_url',
          column_type: 'TEXT'
        }
      );

      if (addYoutubeError) {
        console.error("Erro ao adicionar coluna 'youtube_url':", addYoutubeError);
      } else {
        console.log("Coluna 'youtube_url' adicionada à tabela 'profiles'.");
      }
    } else {
      console.log("Coluna 'youtube_url' já existe na tabela 'profiles'.");
    }
    
                // Check if the 'twitter_url' column exists in the 'profiles' table
    const { data: twitterColumn, error: twitterError } = await supabase
      .from('profiles')
      .select('twitter_url')
      .limit(0);

    if (twitterError) {
      // If the 'twitter_url' column doesn't exist, create it
      const { error: addTwitterError } = await supabase.rpc(
        'add_column_if_not_exists',
        {
          table_name: 'profiles',
          column_name: 'twitter_url',
          column_type: 'TEXT'
        }
      );

      if (addTwitterError) {
        console.error("Erro ao adicionar coluna 'twitter_url':", addTwitterError);
      } else {
        console.log("Coluna 'twitter_url' adicionada à tabela 'profiles'.");
      }
    } else {
      console.log("Coluna 'twitter_url' já existe na tabela 'profiles'.");
    }
  } catch (error) {
    console.error("Erro ao verificar ou adicionar colunas:", error);
  }
};
