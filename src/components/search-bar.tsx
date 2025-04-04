
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ articles: any[], authors: any[] }>({ articles: [], authors: [] });
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Search for articles
      const { data: articles } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          category,
          image_url,
          profiles:author_id (
            id,
            username,
            avatar_url
          )
        `)
        .ilike('title', `%${query}%`)
        .limit(3);
      
      // Search for authors
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, sector')
        .ilike('username', `%${query}%`)
        .limit(3);
      
      setResults({
        articles: articles || [],
        authors: authors || []
      });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleArticleClick = (articleId: string) => {
    navigate(`/article/${articleId}`);
    setIsOpen(false);
    setQuery("");
  };

  const handleAuthorClick = (authorId: string) => {
    navigate(`/user/${authorId}`);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-zinc-400 hover:text-white px-3"
        >
          <Search className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Pesquisar</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-zinc-900 border-zinc-800">
        <div className="flex items-center p-3 border-b border-zinc-800">
          <Input
            placeholder="Buscar artigos ou autores..."
            className="border-none bg-transparent focus-visible:ring-0 pl-0 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button 
            size="sm" 
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="ml-2 h-8 px-3 bg-white text-black hover:bg-zinc-200"
          >
            {isSearching ? "..." : "Buscar"}
          </Button>
        </div>

        <div className="max-h-[300px] overflow-y-auto py-2">
          {results.articles.length > 0 && (
            <div className="mb-3">
              <h3 className="text-xs font-medium text-zinc-500 px-3 mb-1">
                Artigos
              </h3>
              {results.articles.map((article) => (
                <button
                  key={article.id}
                  className="w-full text-left p-2 hover:bg-zinc-800 flex items-center gap-3"
                  onClick={() => handleArticleClick(article.id)}
                >
                  {article.image_url && (
                    <div className="h-10 w-10 rounded bg-zinc-800 overflow-hidden flex-shrink-0">
                      <img 
                        src={article.image_url} 
                        alt={article.title} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium truncate">{article.title}</div>
                    <div className="text-xs text-zinc-500">Por {article.profiles?.username}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.authors.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 px-3 mb-1">
                Autores
              </h3>
              {results.authors.map((author) => (
                <button
                  key={author.id}
                  className="w-full text-left p-2 hover:bg-zinc-800 flex items-center gap-3"
                  onClick={() => handleAuthorClick(author.id)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={author.avatar_url} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">
                      {author.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{author.username}</div>
                    {author.sector && (
                      <div className="text-xs text-zinc-500">{author.sector}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {query && 
           !isSearching && 
           results.articles.length === 0 && 
           results.authors.length === 0 && (
            <div className="px-3 py-6 text-center text-zinc-500">
              <p>Nenhum resultado encontrado para "{query}"</p>
            </div>
          )}

          {!query && !isSearching && (
            <div className="px-3 py-6 text-center text-zinc-500">
              <p>Digite para buscar artigos ou autores</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
