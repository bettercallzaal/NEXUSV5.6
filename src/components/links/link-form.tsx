"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { generateTagsForLink, extractKeywordsFromText } from "@/lib/auto-tagger";
import { Data, Link } from "@/types/links";

// Define form schema with Zod
const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  url: z.string().url({ message: "Please enter a valid URL." }),
  description: z.string().min(5, { message: "Description must be at least 5 characters." }),
  category: z.string().min(1, { message: "Please select a category." }),
  subcategory: z.string().min(1, { message: "Please select a subcategory." }),
});

type FormValues = z.infer<typeof formSchema>;

interface LinkFormProps {
  data: Data;
  onSubmit: (link: Partial<Link>) => void;
  onCancel: () => void;
}

export function LinkForm({ data, onSubmit, onCancel }: LinkFormProps) {
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // Initialize form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
      category: "",
      subcategory: "",
    },
  });

  const { watch, setValue } = form;
  const selectedCategory = watch("category");

  // Update subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const category = data.categories.find((cat) => cat.name === selectedCategory);
      if (category) {
        setSubcategories(category.subcategories.map((subcat) => subcat.name));
        setValue("subcategory", ""); // Reset subcategory when category changes
      }
    } else {
      setSubcategories([]);
    }
  }, [selectedCategory, data.categories, setValue]);

  // Auto-generate tags when form values change
  const title = watch("title");
  const description = watch("description");
  const url = watch("url");
  const category = watch("category");
  const subcategory = watch("subcategory");

  // Function to generate tags using AI
  const handleGenerateTags = async () => {
    if (!title && !description && !url) return;

    setIsGeneratingTags(true);
    try {
      // First try with AI service
      const aiTags = await generateTagsForLink({
        title,
        description,
        url,
        category,
        subcategory,
      });

      if (aiTags && aiTags.length > 0) {
        setTags(aiTags);
      } else {
        // Fallback to keyword extraction
        const combinedText = `${title} ${description}`;
        const extractedTags = extractKeywordsFromText(combinedText);
        setTags(extractedTags);
      }
    } catch (error) {
      console.error("Error generating tags:", error);
      // Fallback to keyword extraction
      const combinedText = `${title} ${description}`;
      const extractedTags = extractKeywordsFromText(combinedText);
      setTags(extractedTags);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  // Add a custom tag
  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      tags,
      isNew: true,
      id: `link-${Date.now()}`, // Generate a temporary ID
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter link title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter a brief description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {data.categories.map((category) => (
                      <SelectItem key={category.name} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subcategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcategory</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCategory}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subcategory" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <FormLabel>Tags</FormLabel>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleGenerateTags}
              disabled={isGeneratingTags || (!title && !description && !url)}
            >
              {isGeneratingTags ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Auto-generate Tags"
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {tag} tag</span>
                </Button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add a custom tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addTag}
              disabled={!newTag}
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Submit Link</Button>
        </div>
      </form>
    </Form>
  );
}
