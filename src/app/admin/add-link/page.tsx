"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddLinkForm } from "@/components/links/add-link-form";
import { v4 as uuidv4 } from "uuid";

interface LinkFormData {
  title: string;
  description: string;
  url: string;
  category: string;
  subcategory?: string;
  tags: string[];
  isNew: boolean;
  isOfficial: boolean;
}

export default function AddLinkPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: LinkFormData) => {
    setIsLoading(true);

    try {
      // Create a new link object
      const newLink = {
        id: uuidv4(),
        title: data.title,
        description: data.description,
        url: data.url,
        category: data.category,
        subcategory: data.subcategory || "",
        tags: data.tags,
        isNew: data.isNew,
        isOfficial: data.isOfficial,
        createdAt: new Date().toISOString(),
      };

      // In a real application, you would send this to your API
      // For now, we'll simulate an API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

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
