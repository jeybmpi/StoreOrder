export interface Brand{id:string;name:string;color:string}
export interface Product{id:string;name:string;image_url:string|null;suggested_price:number;real_price:number|null;payment_method:string;sold:boolean;sold_at:string|null;color:string|null;brand_id:string|null;position:number}
