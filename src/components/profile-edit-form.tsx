
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Instagram, Linkedin, Facebook, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  bio: z.string().optional(),
  avatar_url: z.string().optional(),
  banner_url: z.string().optional(),
  instagram_url: z.string().optional(),
  linkedin_url: z.string().optional(),
  facebook_url: z.string().optional(),
  youtube_url: z.string().optional(),
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
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      sector: "",
      bio: "",
      avatar_url: "",
      banner_url: "",
      instagram_url: "",
      linkedin_url: "",
      facebook_url: "",
      youtube_url: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username, sector, bio, avatar_url, banner_url, instagram_url, linkedin_url, facebook_url, youtube_url")
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
            bio: data.bio || "",
            avatar_url: data.avatar_url || "",
            banner_url: data.banner_url || "",
            instagram_url: data.instagram_url || "",
            linkedin_url: data.linkedin_url || "",
            facebook_url: data.facebook_url || "",
            youtube_url: data.youtube_url || "",
          });

          if (data.avatar_url) {
            setAvatarPreview(data.avatar_url);
          }
          
          if (data.banner_url) {
            setBannerPreview(data.banner_url);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview the selected image
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      
      if (type === 'avatar') {
        setAvatarPreview(result);
        setAvatarFile(file);
      } else {
        setBannerPreview(result);
        setBannerFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
    try {
      // First check if the bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error("Error checking buckets:", listError);
        return false;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        // Create the bucket if it doesn't exist
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
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao verificar/criar bucket:", error);
      return false;
    }
  };

  const uploadFile = async (file: File | null, bucketName: string, oldUrl: string | null | undefined): Promise<string | null> => {
    if (!file || !user) return oldUrl || null;

    // Ensure the bucket exists
    const bucketExists = await ensureBucketExists(bucketName);
    if (!bucketExists) return oldUrl || null;

    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

      // Upload the file
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error(`Erro ao fazer upload para ${bucketName}:`, error);
      toast({
        title: "Erro",
        description: `Não foi possível fazer o upload da imagem para ${bucketName}. Verifique o formato e tamanho.`,
        variant: "destructive",
      });
      return oldUrl || null;
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

      // Upload avatar and banner if selected
      const avatarUrl = await uploadFile(avatarFile, 'user-avatars', values.avatar_url);
      const bannerUrl = await uploadFile(bannerFile, 'user-banners', values.banner_url);

      // Update profile in database
      const { error } = await supabase
        .from("profiles")
        .update({
          username: values.username,
          sector: values.sector || null,
          bio: values.bio || null,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          instagram_url: values.instagram_url || null,
          linkedin_url: values.linkedin_url || null,
          facebook_url: values.facebook_url || null,
          youtube_url: values.youtube_url || null
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-8">
          {/* Banner image */}
          <div>
            <FormLabel>Imagem de capa</FormLabel>
            <div className="relative group h-40 mt-2 rounded-xl overflow-hidden bg-zinc-800">
              {bannerPreview ? (
                <img 
                  src={bannerPreview} 
                  alt="Banner preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  Sem imagem de capa
                </div>
              )}
              <label 
                htmlFor="banner-upload" 
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              >
                <span className="text-white text-sm font-medium">Alterar imagem de capa</span>
              </label>
              <input 
                id="banner-upload" 
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'banner')}
              />
            </div>
          </div>

          {/* Avatar image */}
          <div className="flex justify-center">
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
                onChange={(e) => handleFileChange(e, 'avatar')}
              />
            </div>
          </div>

          {/* Basic info */}
          <div className="grid gap-4">
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
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Conte um pouco sobre você..."
                      className="bg-zinc-900 border-zinc-700 min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Social media links */}
          <div>
            <h3 className="text-lg font-medium mb-4">Redes sociais</h3>
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="instagram_url"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <Instagram className="mr-2 h-4 w-4" />
                      <FormLabel>Instagram</FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="https://instagram.com/seu_usuario"
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
                name="linkedin_url"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <Linkedin className="mr-2 h-4 w-4" />
                      <FormLabel>LinkedIn</FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="https://linkedin.com/in/seu_usuario"
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
                name="facebook_url"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <Facebook className="mr-2 h-4 w-4" />
                      <FormLabel>Facebook</FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="https://facebook.com/seu_usuario"
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
                name="youtube_url"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <Youtube className="mr-2 h-4 w-4" />
                      <FormLabel>YouTube</FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="https://youtube.com/c/seu_canal"
                        className="bg-zinc-900 border-zinc-700"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

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

          <FormField
            control={form.control}
            name="banner_url"
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
        </div>

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
