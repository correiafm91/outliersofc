
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const profileFormSchema = z.object({
  username: z.string().min(2, {
    message: "Nome de usuário deve ter pelo menos 2 caracteres.",
  }),
  sector: z.string().optional(),
  avatar_url: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileEditFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function ProfileEditForm({ onCancel, onSuccess }: ProfileEditFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormValues | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      sector: "",
      avatar_url: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username, sector, avatar_url")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Erro ao buscar perfil:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar seus dados de perfil.",
            variant: "destructive",
          });
        } else if (data) {
          setProfileData(data);
          form.reset({
            username: data.username || user.email?.split('@')[0] || "",
            sector: data.sector || "",
            avatar_url: data.avatar_url || "",
          });

          if (data.avatar_url) {
            setAvatarPreview(data.avatar_url);
          }
        }
      } catch (err) {
        console.error("Exceção ao buscar perfil:", err);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao buscar seus dados. Tente novamente.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [user, form, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview the selected image
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setAvatarFile(file);
  };

  const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
    // First check if the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      try {
        const { error } = await supabase.storage.createBucket(bucketName, { 
          public: true 
        });
          
        if (error) {
          console.error("Erro ao criar bucket:", error);
          toast({
            title: "Erro de armazenamento",
            description: "Não foi possível criar o bucket de armazenamento.",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Erro ao criar bucket:", error);
        toast({
          title: "Erro de armazenamento",
          description: "O sistema de armazenamento não está configurado corretamente.",
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;

    // Ensure the bucket exists
    const bucketExists = await ensureBucketExists('user-avatars');
    if (!bucketExists) return null;

    try {
      // Create a unique file path
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;  // Simplified path without subfolder

      // Remove old avatar if exists
      if (profileData?.avatar_url) {
        const oldFileName = profileData.avatar_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('user-avatars')
            .remove([oldFileName]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true, // Changed to true to overwrite if needed
        });

      if (uploadError) {
        console.error('Erro de upload:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer o upload da imagem. Verifique o formato e tamanho.",
        variant: "destructive",
      });
      return null;
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Check if the username already exists (but not for this user)
      if (values.username !== profileData?.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", values.username)
          .neq("id", user.id)
          .maybeSingle();

        if (checkError) {
          console.error("Erro ao verificar nome de usuário:", checkError);
        }

        if (existingUser) {
          form.setError("username", { 
            type: "manual", 
            message: "Este nome de usuário já está em uso. Por favor, escolha outro." 
          });
          setIsLoading(false);
          return;
        }
      }

      // Upload avatar if a new one was selected
      let avatarUrl = values.avatar_url;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username: values.username,
          sector: values.sector,
          avatar_url: avatarUrl
        })
        .eq("id", user.id);

      if (error) {
        if (error.code === '23505' && error.message.includes('profiles_username_key')) {
          form.setError("username", { 
            type: "manual", 
            message: "Este nome de usuário já está em uso. Por favor, escolha outro." 
          });
          throw new Error("Nome de usuário já em uso");
        } else {
          throw error;
        }
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      
      // Only show general error if it's not a username duplicate error
      // (which was already handled with the specific field error)
      if (!error.message || error.message !== "Nome de usuário já em uso") {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar seu perfil.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !profileData) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-zinc-700 rounded-full"></div>
          <p className="mt-4 text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
        <div className="flex justify-center mb-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-5xl text-zinc-400">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.email?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <label 
              htmlFor="avatar-upload" 
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
            >
              <span className="text-white text-sm font-medium">Alterar foto</span>
            </label>
            <input 
              id="avatar-upload" 
              type="file" 
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome de usuário</FormLabel>
              <FormControl>
                <Input
                  placeholder="Seu nome ou apelido"
                  className="bg-zinc-900 border-zinc-700"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sector"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Setor/Profissão</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Finanças, Tecnologia, Marketing..."
                  className="bg-zinc-900 border-zinc-700"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avatar_url"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Input
                  type="text"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-white text-black hover:bg-zinc-200"
          >
            {isLoading ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
