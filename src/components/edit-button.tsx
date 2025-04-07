
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Link } from "react-router-dom";

interface EditButtonProps {
  articleId: string;
}

export function EditButton({ articleId }: EditButtonProps) {
  return (
    <Link to={`/edit-article/${articleId}`}>
      <Button variant="outline" size="sm" className="flex items-center gap-2">
        <Pencil className="h-4 w-4" />
        <span>Editar</span>
      </Button>
    </Link>
  );
}
