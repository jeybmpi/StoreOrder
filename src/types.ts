export interface Brand{id:string;name:string;color:string}
export interface Product{id:string;name:string;image_url:string|null;suggested_price:number;real_price:number|null;payment_method:string;color:string|null;brand_id:string|null;position:number;created_at?:string;updated_at?:string}
export interface Unit{id:string;product_id:string;sold:boolean;sold_at:string|null;real_price:number|null;payment_method:string|null}
export interface PayMethod{id:string;name:string}
export interface Api{
 reload():Promise<void>
 updProduct(id:string,d:Partial<Product>):void
 delProduct(id:string):void
 createProduct(d:Partial<Product>,qty:number):Promise<void>
 addUnits(pid:string,n:number):Promise<void>
 updUnit(id:string,d:Partial<Unit>):void
 delUnit(id:string):void
 setOrder(ids:string[]):void
}
export interface Data{products:Product[];brands:Brand[];unitsBy:Map<string,Unit[]>;api:Api;methods:string[];pms:PayMethod[];canDelete:boolean}
export const EMPTY:Unit[]=[]
