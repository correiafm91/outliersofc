
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
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [user, form, toast]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: values.username,
          sector: values.sector,
          avatar_url: values.avatar_url,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seu perfil.",
        variant: "destructive",
      });
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
            <FormItem>
              <FormLabel>URL da foto de perfil</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://exemplo.com/sua-foto.jpg"
                  className="bg-zinc-900 border-zinc-700"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
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
