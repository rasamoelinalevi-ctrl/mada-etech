import { Confirmation } from "@/components/confirmation";
import {user} from '@/server/auth';
import {ownedOrder,publicOrder} from '@/server/commerce';
import {redirect,notFound} from 'next/navigation';
import {HttpError} from '@/server/validation';
export const metadata={robots:{index:false,follow:false},title:'Votre commande'};
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u=await user();if(!u)redirect('/connexion');const {id}=await params;
  try{const row=await ownedOrder(id,u.id,u.role==='admin');return <Confirmation id={id} initialOrder={publicOrder(row)}/>;}catch(e){if(e instanceof HttpError&&e.status===404)notFound();throw e;}
}
