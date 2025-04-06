
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function EditArticle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchArticle = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        if (!data) {
          toast({
            title: "Artigo não encontrado",
            description: "Este artigo não existe ou foi removido.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        // Check if user is the author
        if (data.author_id !== user.id) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para editar este artigo.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        setTitle(data.title);
        setContent(data.content);
        setImageUrl(data.image_url);
        setCategory(data.category);
      } catch (error) {
        console.error("Error fetching article:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do artigo.",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [id, navigate, user, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !category.trim() || !imageUrl.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          title: title.trim(),
          content: content.trim(),
          category: category.trim(),
          image_url: imageUrl.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Artigo atualizado",
        description: "Seu artigo foi atualizado com sucesso!",
      });
      
      navigate(`/article/${id}`);
    } catch (error) {
      console.error("Error updating article:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o artigo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      
      <div className="container mx-auto px-4 py-16 mt-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Editar Artigo</h1>
          
          {isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título do artigo"
                  className="bg-zinc-900 border-zinc-700"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Categoria do artigo"
                  className="bg-zinc-900 border-zinc-700"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL da Imagem</Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="URL da imagem"
                  className="bg-zinc-900 border-zinc-700"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Conteúdo do artigo"
                  className="min-h-[300px] bg-zinc-900 border-zinc-700"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/article/${id}`)}
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-white text-black hover:bg-zinc-200"
                >
                  {isSaving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
