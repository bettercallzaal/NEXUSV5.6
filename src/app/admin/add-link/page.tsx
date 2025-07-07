"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddLinkForm } from "@/components/links/add-link-form";
import { LinkService, AddLinkRequest } from "@/services/link-service";

export default function AddLinkPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: AddLinkRequest) => {
    setIsLoading(true);

    try {
      // Use the LinkService to add the new link
      const newLink = await LinkService.addLink(data);

      // Log the new link for debugging
      console.log("New link created:", newLink);

      // Show success message
      toast.success("Link added successfully!");

      // Redirect to the links page
      router.push("/");
    } catch (error) {
      console.error("Error adding link:", error);
      toast.error("Failed to add link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add New Link</CardTitle>
          <CardDescription>
            Add a new link to the ZAO Nexus with AI-powered tag suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddLinkForm 
            onSubmit={handleSubmit} 
            onCancel={() => router.back()}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
