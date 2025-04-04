
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BookmarkButton } from "@/components/bookmark-button";
import { LikeButton } from "@/components/like-button";
import { ShareButton } from "@/components/share-button";

interface ArticleCardProps {
  id: string;
  title: string;
  excerpt: string;
  category?: string;
  imageUrl?: string;
  date: string;
  authorName: string;
  authorAvatar?: string;
  featured?: boolean;
  showActions?: boolean;
  className?: string;
}

export function ArticleCard({
  id,
  title,
  excerpt,
  category,
  imageUrl,
  date,
  authorName,
  authorAvatar,
  featured = false,
  showActions = false,
  className,
}: ArticleCardProps) {
  return (
    <div 
      className={cn(
        "group rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-all duration-300",
        featured ? "flex flex-col md:flex-row" : "flex flex-col",
        className
      )}
    >
      {/* Image */}
      <Link to={`/article/${id}`} className={cn(
        "block overflow-hidden",
        featured ? "md:w-1/2" : "aspect-video"
      )}>
        <img
          src={imageUrl || "https://placehold.co/1200x800/111111/333333"}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      {/* Content */}
      <div className={cn(
        "flex flex-col p-4",
        featured ? "md:w-1/2 md:p-8" : ""
      )}>
        {/* Category and date */}
        {category && (
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>{category}</span>
            <span>{date}</span>
          </div>
        )}

        {/* Title and excerpt */}
        <Link to={`/article/${id}`}>
          <h3 className={cn(
            "font-bold text-white group-hover:text-zinc-200 transition line-clamp-2",
            featured ? "text-2xl md:text-3xl mb-3" : "text-xl mb-2"
          )}>
            {title}
          </h3>
        </Link>

        <p className={cn(
          "text-zinc-400 line-clamp-2 mb-4",
          featured ? "md:line-clamp-4" : ""
        )}>
          {excerpt}
        </p>

        {/* Author */}
        <div className="mt-auto flex items-center justify-between">
          <Link to={`/article/${id}`} className="flex items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center mr-2">
              {authorAvatar ? (
                <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-zinc-400">{authorName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="text-sm text-zinc-300">{authorName}</span>
          </Link>
          
          {/* Action buttons */}
          {showActions && (
            <div className="flex space-x-2">
              <LikeButton articleId={id} />
              <BookmarkButton articleId={id} variant="icon" className="p-1" />
              <ShareButton 
                articleTitle={title}
                articleUrl={`${window.location.origin}/article/${id}`}
                variant="icon" 
                className="p-1"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
