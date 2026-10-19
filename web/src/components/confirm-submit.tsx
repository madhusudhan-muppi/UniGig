"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/** Submit button that asks for confirmation first (for actions that can't be undone). */
export function ConfirmSubmit({
  confirm: message,
  pendingLabel,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { confirm: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      {...props}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
