import { Link } from "react-router-dom";
import { BookmarkButton } from "@/components/bookmark-button";

export interface ArticleCardProps {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  authorName: string;
  authorAvatar?: string;
  imageUrl?: string | null;
  featured?: boolean;
  showActions?: boolean;
  className?: string;
}

export function ArticleCard(props: ArticleCardProps) {
  return (
    <div className={`relative rounded-lg overflow-hidden shadow-md bg-zinc-900/50 ${props.className}`}>
      {props.imageUrl && (
        <Link to={`/article/${props.id}`}>
          <img
            src={props.imageUrl}
            alt={props.title}
            className="w-full h-52 object-cover"
          />
        </Link>
      )}
      <div className="p-4">
        <Link to={`/article/${props.id}`}>
          <h3 className="text-lg font-semibold mb-2 hover:text-zinc-300 transition-colors duration-200">
            {props.title}
          </h3>
        </Link>
        <p className="text-zinc-400 text-sm mb-4">{props.excerpt}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to={`/profile`}>
              <img
                src={props.authorAvatar || 'https://avatar.iran.liara.run/public/boy?username=amir'}
                alt={props.authorName}
                className="w-6 h-6 rounded-full object-cover"
              />
            </Link>
            <Link to={`/profile`} className="hover:underline">
              <span className="text-zinc-500 text-xs">{props.authorName}</span>
            </Link>
          </div>
          <span className="text-zinc-500 text-xs">{props.date}</span>
        </div>
      </div>

      {props.showActions && (
        <div className="flex gap-2 absolute top-3 right-3">
          <BookmarkButton 
            articleId={props.id} 
            className={props.featured ? "" : "scale-90"} 
          />
        </div>
      )}
    </div>
  );
}
