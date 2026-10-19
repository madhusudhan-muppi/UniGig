import { Mail, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Contact } from "@/db/queries";

/** Phone and email of the other party, shown only after a bid is accepted. */
export function ContactCard({
  title,
  description,
  contact,
}: {
  title: string;
  description: string;
  contact: Pick<Contact, "name" | "email" | "phone">;
}) {
  return (
    <Card className="border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <span className="font-medium">{contact.name}</span>
        <a href={`mailto:${contact.email}`} className="flex w-fit items-center gap-2 text-sm hover:underline">
          <Mail className="size-4 text-muted-foreground" />
          {contact.email}
        </a>
        {contact.phone && (
          <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex w-fit items-center gap-2 text-sm hover:underline">
            <Phone className="size-4 text-muted-foreground" />
            {contact.phone}
          </a>
        )}
      </CardContent>
    </Card>
  );
}
