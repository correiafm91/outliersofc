
import { Link } from "react-router-dom";
import { AnimatedElement } from "@/components/ui/animated-element";
import { cn } from "@/lib/utils";

interface ArticleCardProps {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  imageUrl: string;
  date: string;
  authorName: string;
  authorAvatar?: string;
  className?: string;
  featured?: boolean;
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
  className,
  featured = false,
}: ArticleCardProps) {
  return (
    <AnimatedElement
      className={cn(
        "group",
        featured ? "col-span-full md:col-span-2" : "col-span-full md:col-span-1",
        className
      )}
    >
      <Link to={`/article/${id}`} className="block">
        <div className={cn(
          "overflow-hidden relative bg-zinc-900 rounded-lg border border-zinc-800 transition-all duration-300 group-hover:border-zinc-700",
          featured ? "md:flex md:h-96" : "h-full flex flex-col"
        )}>
          <div className={cn(
            "overflow-hidden",
            featured ? "md:w-2/3 h-56 md:h-full" : "h-48"
          )}>
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className={cn(
            "p-5 flex flex-col justify-between",
            featured ? "md:w-1/3" : "flex-grow"
          )}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {category}
                </span>
                <span className="text-xs text-zinc-400">{date}</span>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">
                {title}
              </h3>
              <p className="text-zinc-400 text-sm line-clamp-3">{excerpt}</p>
            </div>
            <div className="flex items-center mt-4 space-x-2">
              {authorAvatar ? (
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                  {authorName.charAt(0)}
                </div>
              )}
              <span className="text-sm text-zinc-400">{authorName}</span>
            </div>
          </div>
        </div>
      </Link>
    </AnimatedElement>
  );
}
