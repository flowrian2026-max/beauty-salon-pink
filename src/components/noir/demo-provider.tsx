import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { defaults, stateSchema, type DemoState } from '@/lib/noir-data';
const Context=createContext<{data:DemoState;update:(next:DemoState)=>boolean;storageError:string}>({data:defaults,update:()=>false,storageError:''});
export function DemoProvider({children}:{children:ReactNode}){
 const [data,setData]=useState<DemoState>(defaults);const [ready,setReady]=useState(false);const [storageError,setError]=useState('');
 useEffect(()=>{try{const saved=localStorage.getItem('noir-pink-demo');if(saved){const result=stateSchema.safeParse(JSON.parse(saved));if(result.success)setData(result.data)}}catch{setError('Local storage is unavailable. Changes will last only for this visit.')}setReady(true)},[]);
 useEffect(()=>{if(ready)document.documentElement.style.setProperty('--primary',data.accent)},[data.accent,ready]);
 function update(next:DemoState){const parsed=stateSchema.safeParse(next);if(!parsed.success)return false;setData(parsed.data);try{localStorage.setItem('noir-pink-demo',JSON.stringify(parsed.data));setError('');return true}catch{setError('Could not save on this device. Changes last only for this visit.');return false}}
 return <Context.Provider value={{data,update,storageError}}>{children}</Context.Provider>
}
export const useDemo=()=>useContext(Context);
