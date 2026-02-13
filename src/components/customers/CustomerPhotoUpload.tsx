import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerPhotoUploadProps {
  photoUrl?: string | null;
  customerName?: string;
  customerId?: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  onPhotoUploaded?: (url: string) => void;
}

const sizeClasses = { sm: 'w-12 h-12', md: 'w-16 h-16', lg: 'w-20 h-20' };
const iconSizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-10 h-10' };

export function CustomerPhotoUpload({
  photoUrl,
  customerName,
  customerId,
  size = 'md',
  editable = false,
  onPhotoUploaded,
}: CustomerPhotoUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      const targetId = customerId || `temp_${Date.now()}`;
      const filePath = `${targetId}/photo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('customer-kyc')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('customer-kyc')
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

      if (signedUrlError) throw signedUrlError;
      const url = signedUrlData.signedUrl;
      onPhotoUploaded?.(url);
      toast({ title: 'Success', description: 'Photo uploaded' });
    } catch (_error: unknown) {
      toast({ title: 'Error', description: 'Failed to upload photo. Please try again.', variant: 'destructive' });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = previewUrl || photoUrl;

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
          <img src={displayUrl} alt={customerName || 'Customer'} className="w-full h-full object-cover" />
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
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </>
      )}
    </div>
  );
}
