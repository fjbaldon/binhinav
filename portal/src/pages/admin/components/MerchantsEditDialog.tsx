import { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Merchant, MerchantPayload } from "@/api/types";
import { type UseMutationResult } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const merchantSchema = z.object({
    name: z.string().min(2, "Name is required."),
    username: z.string().min(4, "Username must be at least 4 characters."),
    password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal('')),
});

type MerchantFormValues = z.infer<typeof merchantSchema>;

interface MerchantsEditDialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    merchant: Merchant;
    updateMutation: UseMutationResult<Merchant, Error, { id: string; payload: Partial<MerchantPayload> }, unknown>;
}

export function MerchantsEditDialog({ isOpen, setIsOpen, merchant, updateMutation }: MerchantsEditDialogProps) {
    const form = useForm<MerchantFormValues>({
        resolver: zodResolver(merchantSchema),
        defaultValues: { name: '', username: '', password: '' }
    });

    useEffect(() => {
        if (merchant) {
            form.reset({ name: merchant.name, username: merchant.username, password: '' });
        }
    }, [merchant, form]);

    const onSubmit = (data: MerchantFormValues) => {
        const payload: Partial<MerchantPayload> = { name: data.name, username: data.username };
        if (data.password) {
            payload.password = data.password;
        }
        updateMutation.mutate({ id: merchant.id, payload });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Merchant</DialogTitle>
                    <DialogDescription>
                        Edit the merchant's details below. To change the assigned place, go to the Places page.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Merchant's Full Name</Label>
                        <Input id="name" {...form.register("name")} />
                        <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" {...form.register("username")} />
                        <p className="text-sm text-red-500">{form.formState.errors.username?.message}</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input id="password" type="password" {...form.register("password")} placeholder="Leave blank to keep unchanged" />
                        <p className="text-sm text-red-500">{form.formState.errors.password?.message}</p>
                    </div>
                    <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
