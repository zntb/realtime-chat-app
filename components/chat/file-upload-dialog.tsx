/* eslint-disable @next/next/no-img-element */
'use client';

import type React from 'react';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, FileIcon, ImageIcon } from 'lucide-react';

interface FileUploadDialogProps {
  onUpload: (file: File, caption: string) => void;
  children: React.ReactNode;
}

export function FileUploadDialog({
  onUpload,
  children,
}: FileUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile, caption);
      setOpen(false);
      setSelectedFile(null);
      setCaption('');
      setPreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='file'>Select File</Label>
            <Input
              id='file'
              type='file'
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept='image/*,.pdf,.doc,.docx,.txt'
            />
          </div>

          {selectedFile && (
            <div className='border border-border rounded-lg p-4'>
              <div className='flex items-start justify-between mb-2'>
                <div className='flex items-center gap-2'>
                  {preview ? (
                    <ImageIcon className='h-5 w-5 text-primary' />
                  ) : (
                    <FileIcon className='h-5 w-5' />
                  )}
                  <div>
                    <p className='text-sm font-medium'>{selectedFile.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button variant='ghost' size='icon' onClick={handleRemoveFile}>
                  <X className='h-4 w-4' />
                </Button>
              </div>

              {preview && (
                <div className='mt-2'>
                  <img
                    src={preview || '/placeholder.svg'}
                    alt='Preview'
                    className='w-full h-48 object-cover rounded-md'
                  />
                </div>
              )}
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='caption'>Caption (optional)</Label>
            <Input
              id='caption'
              placeholder='Add a caption...'
              value={caption}
              onChange={e => setCaption(e.target.value)}
            />
          </div>

          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile}>
              <Upload className='h-4 w-4 mr-2' />
              Upload
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
