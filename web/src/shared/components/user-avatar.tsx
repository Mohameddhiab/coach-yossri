import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function UserAvatar({
  prenom,
  nom,
  src,
  className,
}: {
  prenom: string;
  nom: string;
  src?: string | null;
  className?: string;
}) {
  const initials =
    `${prenom.trim().charAt(0) || ""}${nom.trim().charAt(0) || ""}` || "؟";
  return (
    <Avatar className={cn("size-9 border border-border", className)}>
      {src && <AvatarImage src={src} alt={`${prenom} ${nom}`} />}
      <AvatarFallback className="bg-primary/15 text-primary font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
