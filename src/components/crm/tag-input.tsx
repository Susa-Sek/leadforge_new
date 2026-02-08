'use client';

import { useState } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { useTags } from '@/hooks/use-crm';
import { TAG_COLOR_OPTIONS } from '@/lib/crm/schemas';
import type { ContactTag } from '@/lib/crm/types';

interface TagInputProps {
  selectedTags: ContactTag[];
  onChange: (tags: ContactTag[]) => void;
  maxTags?: number;
  disabled?: boolean;
}

export function TagInput({ selectedTags, onChange, maxTags = 20, disabled }: TagInputProps) {
  const { tags, isLoading } = useTags();
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLOR_OPTIONS[0].value);

  const availableTags = tags.filter(
    (tag) => !selectedTags.find((t) => t.id === tag.id)
  );

  const canAddMore = selectedTags.length < maxTags;

  const addTag = (tag: ContactTag) => {
    if (!canAddMore) return;
    onChange([...selectedTags, tag]);
    setIsOpen(false);
  };

  const removeTag = (tagId: string) => {
    onChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const createAndAddTag = async () => {
    if (!newTagName.trim() || !canAddMore) return;

    // Check if tag with this name already exists
    const existingTag = tags.find(
      (t) => t.name.toLowerCase() === newTagName.trim().toLowerCase()
    );

    if (existingTag) {
      addTag(existingTag);
      setNewTagName('');
      return;
    }

    // For new tags, we'd need to create them via API
    // For now, create a temporary tag
    const tempTag: ContactTag = {
      id: `temp-${Date.now()}`,
      user_id: '',
      name: newTagName.trim(),
      color: newTagColor,
      created_at: new Date().toISOString(),
    };

    onChange([...selectedTags, tempTag]);
    setNewTagName('');
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[36px] p-2 border rounded-md bg-background">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            style={{ backgroundColor: tag.color, color: '#fff' }}
            className="flex items-center gap-1 px-2 py-1"
          >
            {tag.name}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        {!disabled && canAddMore && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground"
                disabled={disabled}
              >
                <Plus className="h-4 w-4 mr-1" />
                Tag hinzufügen
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <div className="p-3">
                <p className="text-sm font-medium mb-2">Vorhandene Tags</p>
                <ScrollArea className="h-32">
                  {isLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-6 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                  ) : availableTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Keine Tags verfügbar
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1 pr-4">
                      {availableTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => addTag(tag)}
                          className="text-xs px-2 py-1 rounded-full transition-transform hover:scale-105"
                          style={{ backgroundColor: tag.color, color: '#fff' }}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              <Separator />
              <div className="p-3">
                <p className="text-sm font-medium mb-2">Neuer Tag</p>
                <div className="space-y-2">
                  <Input
                    placeholder="Tag-Name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="h-8"
                  />
                  <div className="flex flex-wrap gap-1">
                    {TAG_COLOR_OPTIONS.slice(0, 6).map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewTagColor(color.value)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          newTagColor === color.value
                            ? 'border-gray-900'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color.value }}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    onClick={createAndAddTag}
                    disabled={!newTagName.trim()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Erstellen & Hinzufügen
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
        {selectedTags.length === 0 && disabled && (
          <span className="text-sm text-muted-foreground">Keine Tags</span>
        )}
      </div>
      {selectedTags.length >= maxTags && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxTags} Tags erreicht
        </p>
      )}
    </div>
  );
}
