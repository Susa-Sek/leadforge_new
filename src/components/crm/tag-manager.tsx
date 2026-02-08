'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X, Edit2, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/use-crm';
import { tagSchema, type TagFormData, TAG_COLOR_OPTIONS, defaultTagValues } from '@/lib/crm/schemas';
import type { ContactTag } from '@/lib/crm/types';

interface TagManagerProps {
  onSelect?: (tag: ContactTag) => void;
  selectable?: boolean;
  selectedTagIds?: string[];
}

export function TagManager({ onSelect, selectable, selectedTagIds = [] }: TagManagerProps) {
  const { tags, isLoading, mutate } = useTags();
  const { trigger: createTag, isMutating: isCreating } = useCreateTag();
  const { trigger: updateTag } = useUpdateTag('');
  const { trigger: deleteTag } = useDeleteTag();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<ContactTag | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: defaultTagValues,
  });

  const editForm = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: defaultTagValues,
  });

  const handleCreate = async (data: TagFormData) => {
    try {
      await createTag(data);
      toast.success('Tag erstellt');
      setIsCreateDialogOpen(false);
      form.reset(defaultTagValues);
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Erstellen');
    }
  };

  const handleEdit = (tag: ContactTag) => {
    setEditingTag(tag);
    editForm.reset({
      name: tag.name,
      color: tag.color,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (data: TagFormData) => {
    if (!editingTag) return;
    try {
      await updateTag(data, { arg: editingTag.id } as any);
      toast.success('Tag aktualisiert');
      setIsEditDialogOpen(false);
      setEditingTag(null);
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Aktualisieren');
    }
  };

  const handleDelete = async () => {
    if (!deletingTagId) return;
    try {
      await deleteTag(deletingTagId as any);
      toast.success('Tag gelöscht');
      setIsDeleteDialogOpen(false);
      setDeletingTagId(null);
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Löschen');
    }
  };

  const confirmDelete = (tagId: string) => {
    setDeletingTagId(tagId);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Tags verwalten
        </h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Neu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuer Tag</DialogTitle>
              <DialogDescription>
                Erstelle einen neuen Tag für deine Kontakte
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. VIP, Hot Lead" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Farbe</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {TAG_COLOR_OPTIONS.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => field.onChange(color.value)}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                field.value === color.value
                                  ? 'border-gray-900 scale-110'
                                  : 'border-transparent hover:scale-105'
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.label}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Wird erstellt...' : 'Erstellen'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[300px]">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Noch keine Tags erstellt</p>
          </div>
        ) : (
          <div className="space-y-2 pr-4">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                  selectedTagIds.includes(tag.id)
                    ? 'bg-primary/5 border-primary'
                    : 'hover:bg-muted'
                } ${selectable ? 'cursor-pointer' : ''}`}
                onClick={() => selectable && onSelect?.(tag)}
              >
                <div className="flex items-center gap-2">
                  <Badge style={{ backgroundColor: tag.color, color: '#fff' }}>
                    {tag.name}
                  </Badge>
                </div>
                {!selectable && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(tag);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(tag.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag bearbeiten</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Farbe</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {TAG_COLOR_OPTIONS.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => field.onChange(color.value)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              field.value === color.value
                                ? 'border-gray-900 scale-110'
                                : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit">Speichern</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Tag wird von allen Kontakten entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingTagId(null)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
