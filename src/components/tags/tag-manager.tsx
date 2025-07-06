import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { X, Plus, Tag, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface TagManagerProps {
  selectedTags: Tag[];
  availableTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  onCreateTag?: (tagName: string) => Promise<Tag>;
  maxTags?: number;
  readOnly?: boolean;
}

export function TagManager({
  selectedTags,
  availableTags,
  onTagsChange,
  onCreateTag,
  maxTags = 10,
  readOnly = false
}: TagManagerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const handleSelectTag = (tag: Tag) => {
    if (selectedTags.some(t => t.id === tag.id)) {
      onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    } else {
      if (selectedTags.length < maxTags) {
        onTagsChange([...selectedTags, tag]);
      }
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!inputValue.trim() || !onCreateTag) return;
    
    try {
      setIsCreatingTag(true);
      const newTag = await onCreateTag(inputValue.trim());
      onTagsChange([...selectedTags, newTag]);
      setInputValue('');
      setOpen(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsCreatingTag(false);
    }
  };

  const filteredTags = availableTags.filter(tag => 
    !selectedTags.some(selectedTag => selectedTag.id === tag.id)
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[36px]">
        {selectedTags.map(tag => (
          <Badge 
            key={tag.id} 
            variant="secondary"
            style={{ backgroundColor: tag.color }}
            className={cn(
              "flex items-center gap-1 px-2 py-1",
              tag.color && "text-white"
            )}
          >
            {tag.name}
            {!readOnly && (
              <button 
                className="ml-1 rounded-full hover:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-offset-2"
                onClick={() => handleRemoveTag(tag.id)}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}

        {!readOnly && selectedTags.length < maxTags && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1 border-dashed"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Tag</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Manage Tags</DialogTitle>
                <DialogDescription>
                  Select from existing tags or create a new one.
                </DialogDescription>
              </DialogHeader>
              
              <Command className="rounded-lg border shadow-md">
                <CommandInput 
                  placeholder="Search tags..." 
                  value={inputValue}
                  onValueChange={setInputValue}
                />
                <CommandList>
                  <CommandEmpty>
                    {inputValue && (
                      <div className="flex items-center justify-between px-4 py-2">
                        <span>Create "{inputValue}"</span>
                        <Button 
                          size="sm" 
                          disabled={isCreatingTag} 
                          onClick={handleCreateTag}
                        >
                          {isCreatingTag ? "Creating..." : "Create"}
                        </Button>
                      </div>
                    )}
                    {!inputValue && "No tags found."}
                  </CommandEmpty>
                  <CommandGroup heading="Available Tags">
                    {filteredTags.map(tag => (
                      <CommandItem 
                        key={tag.id}
                        onSelect={() => handleSelectTag(tag)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: tag.color || '#888888' }} 
                          />
                          <span>{tag.name}</span>
                        </div>
                        {selectedTags.some(t => t.id === tag.id) && (
                          <Check className="h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {selectedTags.length > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Selected Tags">
                        {selectedTags.map(tag => (
                          <CommandItem 
                            key={tag.id}
                            onSelect={() => handleSelectTag(tag)}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: tag.color || '#888888' }} 
                              />
                              <span>{tag.name}</span>
                            </div>
                            <X className="h-4 w-4" />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {!readOnly && selectedTags.length >= maxTags && (
        <p className="text-xs text-muted-foreground">
          Maximum of {maxTags} tags reached
        </p>
      )}
    </div>
  );
}
