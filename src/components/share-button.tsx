
import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  articleTitle: string;
  articleUrl: string;
  variant?: "icon" | "button";
  className?: string;
}

export function ShareButton({ articleTitle, articleUrl, variant = "icon", className }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const shareOptions = [
    {
      name: "Copiar link",
      action: () => {
        navigator.clipboard.writeText(articleUrl);
        toast({
          title: "Link copiado!",
          description: "O link do artigo foi copiado para a área de transferência",
        });
        setIsOpen(false);
      },
    },
    {
      name: "WhatsApp",
      action: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${articleTitle} - ${articleUrl}`)}`, "_blank");
        setIsOpen(false);
      },
    },
    {
      name: "Twitter / X",
      action: () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${articleTitle}`)}&url=${encodeURIComponent(articleUrl)}`, "_blank");
        setIsOpen(false);
      },
    },
    {
      name: "LinkedIn",
      action: () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`, "_blank");
        setIsOpen(false);
      },
    },
    {
      name: "Facebook",
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`, "_blank");
        setIsOpen(false);
      },
    },
  ];

  if (variant === "icon") {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center justify-center p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors",
              className
            )}
          >
            <Share2 className="h-5 w-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 bg-zinc-900 border-zinc-800 p-2">
          <div className="grid gap-1">
            {shareOptions.map((option) => (
              <Button
                key={option.name}
                variant="ghost"
                size="sm"
                className="justify-start font-normal text-zinc-300 hover:text-white hover:bg-zinc-800"
                onClick={option.action}
              >
                {option.name}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("border-zinc-700 hover:bg-zinc-800", className)}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Compartilhar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 bg-zinc-900 border-zinc-800 p-2">
        <div className="grid gap-1">
          {shareOptions.map((option) => (
            <Button
              key={option.name}
              variant="ghost"
              size="sm"
              className="justify-start font-normal text-zinc-300 hover:text-white hover:bg-zinc-800"
              onClick={option.action}
            >
              {option.name}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
