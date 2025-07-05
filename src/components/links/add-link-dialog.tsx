"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LinkForm } from "@/components/links/link-form";
import { Link, Data } from "@/types/links";

interface AddLinkDialogProps {
  data: Data;
  onAddLink: (link: Partial<Link>) => void;
}

export function AddLinkDialog({ data, onAddLink }: AddLinkDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = (link: Partial<Link>) => {
    onAddLink({
      ...link,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Link</DialogTitle>
          <DialogDescription>
            Fill out the form below to add a new link. Tags will be automatically suggested based on your content.
          </DialogDescription>
        </DialogHeader>
        <LinkForm data={data} onSubmit={handleSubmit} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}
