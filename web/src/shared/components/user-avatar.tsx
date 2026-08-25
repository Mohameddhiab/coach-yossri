import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function UserAvatar({
  prenom,
  nom,
  className,
}: {
  prenom: string;
  nom: string;
  className?: string;
}) {
  const initials = `${prenom.trim().charAt(0) || ""}${nom.trim().charAt(0) || ""}` || "؟";
  return (
    <Avatar className={cn("size-9 border border-border", className)}>
      <AvatarFallback className="bg-primary/15 text-primary font-bold">{initials}</AvatarFallback>
    </Avatar>
  );
}