import {describe,it,expect} from 'vitest';
import {bookingSchema,contactSchema,filterGallery,defaults,stateSchema,safeSocial} from '@/lib/noir-data';
describe('NOIR PINK demo rules',()=>{
 const booking={service:'nails',name:'Demo Visitor',email:'demo@example.com',phone:'',date:'2026-10-11',time:'14:00'};
 for(const field of ['service','name','email','date','time'] as const)it(`requires booking ${field}`,()=>{expect(bookingSchema.safeParse({...booking,[field]:''}).success).toBe(false)});
 it('accepts a complete preferred appointment without optional phone',()=>expect(bookingSchema.safeParse(booking).success).toBe(true));
 it('rejects invalid contact email',()=>expect(contactSchema.safeParse({name:'Demo',email:'invalid',message:'Hello there'}).success).toBe(false));
 it('requires a contact message',()=>expect(contactSchema.safeParse({name:'Demo',email:'demo@example.com',message:''}).success).toBe(false));
 it('filters gallery to matching category',()=>expect(filterGallery(defaults.gallery,'NAILS').map(g=>g.id)).toEqual(['g1']));
 it('shows every gallery entry for ALL',()=>expect(filterGallery(defaults.gallery,'ALL')).toHaveLength(4));
 it('rejects an invalid editable accent',()=>expect(stateSchema.safeParse({...defaults,accent:'url(javascript:alert(1))'}).success).toBe(false));
 it('rejects executable social links',()=>expect(safeSocial('javascript:alert(1)')).toBeUndefined());
 it('accepts prototype defaults without any real bookings',()=>{expect(stateSchema.safeParse(defaults).success).toBe(true);expect(defaults.bookings).toEqual([])});
});
