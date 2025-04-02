
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  articleId: string;
}

export function LikeButton({ articleId }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se o artigo já foi curtido pelo usuário
    const likedArticles = JSON.parse(localStorage.getItem("likedArticles") || "{}");
    setLiked(!!likedArticles[articleId]);
    
    // Obter contagem de curtidas (simulado, seria Supabase)
    setLikeCount(Math.floor(Math.random() * 50));
  }, [articleId]);

  const handleLike = () => {
    const likedArticles = JSON.parse(localStorage.getItem("likedArticles") || "{}");
    
    // Toggle like
    if (liked) {
      delete likedArticles[articleId];
      setLikeCount((prev) => prev - 1);
      toast({
        title: "Curtida removida",
        description: "Você removeu sua curtida deste artigo",
      });
    } else {
      likedArticles[articleId] = true;
      setLikeCount((prev) => prev + 1);
      setIsAnimating(true);
      toast({
        title: "Artigo curtido!",
        description: "Você curtiu este artigo",
      });
    }
    
    // Atualizar localStorage e estado
    localStorage.setItem("likedArticles", JSON.stringify(likedArticles));
    setLiked(!liked);
    
    // Finalizar animação
    setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <button 
      onClick={handleLike}
      className={cn(
        "flex items-center space-x-2 py-2 px-4 rounded-full border transition-all duration-300",
        liked 
          ? "bg-pink-500/10 border-pink-500/30 text-pink-500" 
          : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
      )}
    >
      <Heart 
        className={cn(
          "h-5 w-5 transition-transform", 
          isAnimating && "animate-[heartbeat_1s_ease-in-out]",
          liked && "fill-pink-500"
        )} 
      />
      <span>{likeCount}</span>
      
      <style jsx>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
      `}</style>
    </button>
  );
}
