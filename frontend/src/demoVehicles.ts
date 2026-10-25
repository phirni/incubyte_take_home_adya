import type { Vehicle } from './types';

const seeded = [
 ['Toyota','Corolla','sedan',2200000,8],['Toyota','Camry','sedan',2800000,5],
 ['Honda','Civic','sedan',2400000,6],['Honda','CR-V','suv',3300000,4],
 ['Ford','F-150','truck',4500000,3],['Ford','Mustang','coupe',4100000,2],
 ['Tesla','Model 3','sedan',4200000,1],['BMW','X5','suv',6500000,0],
 ['Mazda','MX-5','convertible',3200000,3],['Subaru','Outback','wagon',3100000,7],
] as const;
const timestamp='2026-01-01T00:00:00.000Z';
export const demoVehicles: Vehicle[]=seeded.map(([make,model,category,priceCents,quantity],index)=>({
 id:`preview-vehicle-${index+1}`,make,model,category,priceCents,quantity,createdAt:timestamp,updatedAt:timestamp,
}));
