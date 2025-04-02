
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { AnimatedElement } from "@/components/ui/animated-element";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function CreateArticle() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("negocios");
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect if user is not logged in
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // If user is null, don't render anything while redirecting
  if (!user) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      
      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content || !category || !image) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos e selecione uma imagem",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload da imagem para o bucket 'images'
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `article-images/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('images')
        .upload(filePath, image);

      if (uploadError) {
        console.error('Erro no upload da imagem:', uploadError);
        throw new Error('Erro ao fazer upload da imagem');
      }

      // Gerar URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Inserir artigo no banco de dados
      const { data: article, error } = await supabase
        .from('articles')
        .insert([
          {
            title,
            content,
            category,
            image_url: publicUrl,
            author_id: user.id
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir artigo:', error);
        throw new Error('Erro ao criar artigo');
      }

      toast({
        title: "Artigo criado com sucesso!",
        description: "Seu artigo foi publicado."
      });

      // Redirecionar para a página do artigo
      navigate(`/article/${article.id}`);
    } catch (error) {
      console.error('Erro ao criar artigo:', error);
      toast({
        title: "Erro ao criar artigo",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <AnimatedElement>
            <h1 className="text-3xl font-bold mb-8 border-b border-zinc-800 pb-4">
              Criar novo artigo
            </h1>

            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Título
                </label>
                <Input
                  id="title"
                  placeholder="Título do seu artigo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-zinc-900 border-zinc-700"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-2">
                  Categoria
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="negocios">Negócios</SelectItem>
                    <SelectItem value="economia">Economia</SelectItem>
                    <SelectItem value="tecnologia">Tecnologia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="image" className="block text-sm font-medium mb-2">
                  Imagem de capa
                </label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="bg-zinc-900 border-zinc-700"
                />
                {imageUrl && (
                  <div className="mt-4 rounded-lg overflow-hidden h-40">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium mb-2">
                  Conteúdo
                </label>
                <Textarea
                  id="content"
                  placeholder="Escreva seu artigo aqui..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[250px] bg-zinc-900 border-zinc-700"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-white text-black hover:bg-zinc-200"
                >
                  {isSubmitting ? "Publicando..." : "Publicar artigo"}
                </Button>
              </div>
            </form>
          </AnimatedElement>
        </div>
      </div>

      <Footer />
    </div>
  );
}
