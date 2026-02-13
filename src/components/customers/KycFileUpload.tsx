import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Image, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KycFileUploadProps {
  label: string;
  fileUrl?: string | null;
  customerId?: string;
  fieldName: string;
  onFileUploaded?: (url: string) => void;
}

export function KycFileUpload({ label, fileUrl, customerId, fieldName, onFileUploaded }: KycFileUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const displayUrl = uploadedUrl || fileUrl;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'File must be less than 5MB', variant: 'destructive' });
      return;
    }

    const allowed = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast({ title: 'Error', description: 'Only PNG, JPG, JPEG, PDF allowed', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const targetId = customerId || `temp_${Date.now()}`;
      const filePath = `${targetId}/${fieldName}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('customer-kyc')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('customer-kyc')
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

      if (signedUrlError) throw signedUrlError;
      const url = signedUrlData.signedUrl;
      setUploadedUrl(url);
      onFileUploaded?.(url);
      toast({ title: 'Uploaded', description: `${label} file uploaded successfully` });
    } catch (_error: unknown) {
      toast({ title: 'Error', description: 'Failed to upload file. Please try again.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const isPdf = displayUrl?.includes('.pdf');

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 gap-1.5"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        {uploading ? 'Uploading...' : 'Upload'}
      </Button>

      {displayUrl && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 text-primary"
          onClick={() => window.open(displayUrl, '_blank')}
        >
          {isPdf ? <FileText className="w-3.5 h-3.5" /> : <Image className="w-3.5 h-3.5" />}
          <Eye className="w-3.5 h-3.5" />
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpg,image/jpeg,application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
