
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";

interface Comment {
  id: string;
  text: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
}

interface CommentSectionProps {
  articleId: string;
}

export function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Verificar se o usuário já tem perfil salvo
  useEffect(() => {
    const storedProfile = localStorage.getItem("commentProfile");
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      setUserName(profile.name);
      setUserAvatar(profile.avatar);
    }
    
    // Carregar comentários (simulado, seria do Supabase)
    const mockComments = [
      {
        id: "1",
        text: "Análise incrível! Isso realmente me ajudou a entender melhor esse setor.",
        authorName: "Carlos Mendes",
        createdAt: "2023-05-15T10:23:00Z"
      },
      {
        id: "2",
        text: "Discordo de alguns pontos, mas a perspectiva é interessante. Gostaria de ver mais dados sobre o impacto disso no mercado a longo prazo.",
        authorName: "Ana Silva",
        authorAvatar: "https://randomuser.me/api/portraits/women/44.jpg",
        createdAt: "2023-05-14T18:45:00Z"
      }
    ];
    
    setComments(mockComments);
  }, []);

  const handleProfileSubmit = () => {
    if (!userName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira seu nome para continuar.",
        variant: "destructive",
      });
      return;
    }
    
    // Salvar perfil no localStorage
    const profile = { name: userName, avatar: userAvatar };
    localStorage.setItem("commentProfile", JSON.stringify(profile));
    
    setIsDialogOpen(false);
    toast({
      title: "Perfil salvo!",
      description: "Agora você pode fazer comentários.",
    });
  };

  const handleCommentSubmit = () => {
    if (!newComment.trim()) return;
    
    if (!userName) {
      setIsDialogOpen(true);
      return;
    }
    
    // Adicionar novo comentário (simulado, seria Supabase)
    const newCommentObj = {
      id: Date.now().toString(),
      text: newComment,
      authorName: userName,
      authorAvatar: userAvatar,
      createdAt: new Date().toISOString(),
    };
    
    setComments([newCommentObj, ...comments]);
    setNewComment("");
    
    toast({
      title: "Comentário publicado!",
      description: "Seu comentário foi adicionado com sucesso.",
    });
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mt-12 py-8 border-t border-zinc-800">
      <h3 className="text-2xl font-bold mb-6">Comentários ({comments.length})</h3>
      
      {/* Form para novos comentários */}
      <div className="mb-8">
        <Textarea
          placeholder="Deixe seu comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="bg-zinc-900 border-zinc-700 min-h-[100px] mb-3"
        />
        <Button 
          onClick={handleCommentSubmit}
          className="bg-white text-black hover:bg-zinc-200"
        >
          Publicar comentário
        </Button>
      </div>

      {/* Lista de comentários */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 animate-fade-in">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 border border-zinc-700">
                <AvatarImage src={comment.authorAvatar} />
                <AvatarFallback className="bg-zinc-800 text-zinc-400">
                  {comment.authorName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{comment.authorName}</h4>
                  <span className="text-xs text-zinc-500">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-zinc-300">{comment.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog para criar perfil */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl mb-4">Criar seu perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Seu nome</label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Digite seu nome"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL da sua foto (opcional)</label>
              <Input
                value={userAvatar}
                onChange={(e) => setUserAvatar(e.target.value)}
                placeholder="https://exemplo.com/sua-foto.jpg"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <Button 
              onClick={handleProfileSubmit}
              className="w-full bg-white text-black hover:bg-zinc-200"
            >
              Salvar perfil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
