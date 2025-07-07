"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { aiTaggingService, TaggingRequest } from "@/services/ai-tagging-service";
import { toast } from "sonner";

interface AITagSuggesterProps {
  title: string;
  description?: string;
  url?: string;
  existingTags?: string[];
  onTagsSelected: (tags: string[]) => void;
}

export function AITagSuggester({
  title,
  description,
  url,
  existingTags = [],
  onTagsSelected
}: AITagSuggesterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const generateTags = async () => {
    if (!title) {
      toast.error("Please provide a title to generate tags");
      return;
    }

    setIsLoading(true);

    try {
      const request: TaggingRequest = {
        title,
        description,
        url,
        existingTags
      };

      const response = await aiTaggingService.generateTags(request);
      
      // Filter out tags that are already in existingTags
      const newSuggestedTags = response.suggestedTags.filter(
        tag => !existingTags.includes(tag)
      );
      
      setSuggestedTags(newSuggestedTags);
      setSelectedTags([]);
      
      if (newSuggestedTags.length === 0) {
        toast.info("No new tags to suggest");
      }
    } catch (error) {
      console.error("Error generating tags:", error);
      toast.error("Failed to generate tags. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const applySelectedTags = () => {
    onTagsSelected(selectedTags);
    setSuggestedTags([]);
    setSelectedTags([]);
    toast.success(`${selectedTags.length} tags applied`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generateTags}
          disabled={isLoading || !title}
          className="flex items-center gap-1"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span>Suggest Tags</span>
        </Button>
        
        {suggestedTags.length > 0 && selectedTags.length > 0 && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={applySelectedTags}
            className="flex items-center gap-1"
          >
            Apply {selectedTags.length} Tags
          </Button>
        )}
      </div>

      {suggestedTags.length > 0 && (
        <div className="border rounded-md p-3 bg-secondary/20">
          <p className="text-sm font-medium mb-2">AI Suggested Tags:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
