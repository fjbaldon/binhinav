import { useState } from 'react';
import { apiClient } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ProvisioningPageProps {
    onSuccess: (id: string) => void;
}

export default function ProvisioningPage({ onSuccess }: ProvisioningPageProps) {
    const [key, setKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleProvision = async () => {
        if (!key || key.length < 6) {
            toast.error('Invalid Key', { description: 'Please enter a valid pairing key.' });
            return;
        }
        setIsLoading(true);
        try {
            const response = await apiClient.post('/kiosks/provision', { key });
            toast.success(`Kiosk "${response.data.name}" provisioned successfully!`);
            onSuccess(response.data.id);
        } catch (error: any) {
            toast.error('Provisioning Failed', {
                description: error.response?.data?.message || 'An unknown error occurred.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-4">
            <div className="flex items-center gap-4 mb-8">
                <img src="/binhinav-logo.svg" alt="Binhinav Logo" className="h-16 w-16" />
                <h1 className="text-5xl font-bold text-primary">Kiosk Setup</h1>
            </div>
            <div className="w-full max-w-sm space-y-4">
                <p className="text-center text-muted-foreground">
                    Please enter the pairing key from the Admin Portal to provision this device.
                </p>
                <Input
                    value={key}
                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                    placeholder="e.g., ABC-123"
                    className="h-14 text-center text-2xl tracking-widest"
                />
                <Button onClick={handleProvision} disabled={isLoading} className="w-full h-12 text-lg">
                    {isLoading ? 'Provisioning...' : 'Provision Kiosk'}
                </Button>
            </div>
        </div>
    );
}
