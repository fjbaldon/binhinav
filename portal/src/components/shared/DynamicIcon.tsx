import { cn } from "@/lib/utils";
import {
    Store, Utensils, Shirt, Home, Smartphone, HeartPulse, Music, Car, Star, ConciergeBell, ShoppingBag, Salad, Book, Watch, Gem, Gift, Building2, Ticket, Camera, Scissors, Banknote, ToyBrick,
    Landmark, Coffee, CakeSlice, Dumbbell, Pill, PawPrint, Film, Wrench, Glasses, Baby
} from 'lucide-react';

export const availableIcons = [
    { name: 'Store', component: Store }, { name: 'Utensils', component: Utensils }, { name: 'Shirt', component: Shirt }, { name: 'Home', component: Home }, { name: 'Smartphone', component: Smartphone }, { name: 'HeartPulse', component: HeartPulse }, { name: 'Music', component: Music }, { name: 'Car', component: Car }, { name: 'Star', component: Star }, { name: 'ConciergeBell', component: ConciergeBell }, { name: 'ShoppingBag', component: ShoppingBag }, { name: 'Salad', component: Salad }, { name: 'Book', component: Book }, { name: 'Watch', component: Watch }, { name: 'Gem', component: Gem }, { name: 'Gift', component: Gift }, { name: 'Building2', component: Building2 }, { name: 'Ticket', component: Ticket }, { name: 'Camera', component: Camera }, { name: 'Scissors', component: Scissors }, { name: 'Banknote', component: Banknote }, { name: 'ToyBrick', component: ToyBrick }, { name: 'Landmark', component: Landmark }, { name: 'Coffee', component: Coffee }, { name: 'CakeSlice', component: CakeSlice }, { name: 'Dumbbell', component: Dumbbell }, { name: 'Pill', component: Pill }, { name: 'PawPrint', component: PawPrint }, { name: 'Film', component: Film }, { name: 'Wrench', component: Wrench }, { name: 'Glasses', component: Glasses }, { name: 'Baby', component: Baby },
];

export const iconMap = new Map(availableIcons.map(i => [i.name, i.component]));

export const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = iconMap.get(name);
    return IconComponent ? <IconComponent className={cn("h-5 w-5", className)} /> : null;
};
