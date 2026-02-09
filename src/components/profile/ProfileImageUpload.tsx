import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileImageUploadProps {
  avatarUrl?: string | null;
  userName?: string;
  userId?: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

export function ProfileImageUpload({
  avatarUrl,
  userName,
  userId,
  size = 'md',
  editable = true,
}: ProfileImageUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const targetUserId = userId || user?.id;

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUserId) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 2MB', variant: 'destructive' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${targetUserId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      const urlWithTimestamp = `${publicUrl.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithTimestamp })
        .eq('user_id', targetUserId);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast({ title: 'Success', description: 'Profile image updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Upload failed', variant: 'destructive' });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = previewUrl || avatarUrl;

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary to-primary/70',
          sizeClasses[size],
          editable && 'cursor-pointer'
        )}
        onClick={() => editable && fileInputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className={cn('text-primary-foreground animate-spin', iconSizes[size])} />
        ) : displayUrl ? (
          <img
            src={displayUrl}
            alt={userName || 'Profile'}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className={cn('text-primary-foreground', iconSizes[size])} />
        )}
      </div>

      {editable && (
        <>
          <div
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-md"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-3 h-3 text-primary-foreground" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </>
      )}
    </div>
  );
}
