// Offline visual fixtures. Bundled only by build-design-lab.mjs, never imported by src/.
// These values are synthetic and never reach Supabase or a production bundle.
const stamp='2026-10-26T12:00:00Z';
const id=(n:number)=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const categories=[{id:id(10),name:'Iluminação',slug:'iluminacao',parent_id:null,position:0,is_active:true},{id:id(11),name:'Multimídia',slug:'multimidia',parent_id:null,position:1,is_active:true}];
const products=[['LED H4 / Kit de iluminação','LED-H4',149.9,'disponivel','led-h4.webp'],['Central multimídia 9 polegadas','MULT-09',899.9,'sob_consulta','multimedia.webp'],['Módulo amplificador','AMP-04',null,'indisponivel','audio.webp']].map((p,n)=>({id:id(n+1),sku:p[1],slug:'qa-produto-'+n,name:p[0],price:p[2],availability:p[3],brand:'QA / Produto fictício',description:'Dados fictícios exclusivos do laboratório visual.',category_id:categories[n%2].id,category_name:categories[n%2].name,position:n,is_active:n!==2,archived_at:null,specifications:{Potência:'Sob consulta'},created_at:stamp,updated_at:stamp,thumbnail:null,images:[],attributes:[]}));
const leads=['novo','em_atendimento','orcamento_enviado','convertido','perdido'].map((status,n)=>({id:id(100+n),full_name:'Pessoa fictícia '+String.fromCharCode(65+n),phone:'+5584900000000',status,source:'catalogo',created_at:stamp,updated_at:stamp,lead_items:[{id:id(200+n)}]}));
const tables:Record<string,any[]>={products,categories,product_images:[],product_attributes:[],leads,lead_items:[{id:id(200),lead_id:leads[0].id,product_id:products[0].id,name_snapshot:products[0].name,sku_snapshot:products[0].sku,quantity:2,price_snapshot:149.9,created_at:stamp}],lead_events:[{id:id(300),lead_id:leads[0].id,event_type:'solicitacao_registrada',note:'Evento fictício de laboratório visual.',actor_user_id:null,created_at:stamp}],admin_audit_logs:[],site_settings:[{key:'whatsapp_number',value:'5584987099386',is_public:true},{key:'footer_description',value:'Acessórios e serviços automotivos.',is_public:true}]};
const result=(data:any,count?:number)=>({data,error:null,count:count??(Array.isArray(data)?data.length:null)});
function query(table:string){let values=tables[table]||[],single=false;const chain:any={select(){return chain},eq(k:string,v:any){values=values.filter(x=>x[k]===v);return chain},in(k:string,vs:any[]){values=values.filter(x=>vs.includes(x[k]));return chain},is(k:string,v:any){values=values.filter(x=>x[k]===v);return chain},order(){return chain},limit(n:number){values=values.slice(0,n);return chain},range(a:number,b:number){values=values.slice(a,b+1);return chain},single(){single=true;return chain},then(resolve:any){return Promise.resolve(result(single?values[0]:values)).then(resolve)},update(){throw new Error('Laboratório visual somente leitura.')},insert(){throw new Error('Laboratório visual somente leitura.')},delete(){throw new Error('Laboratório visual somente leitura.')},upsert(){throw new Error('Laboratório visual somente leitura.')}};return chain;}
const client:any={
 from:query,
 auth:{async getUser(){return {data:{user:{id:id(999),email:'equipe@example.invalid',app_metadata:{eliteparts_role:'owner'}}},error:null}},onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},async signOut(){return {error:new Error('Use o login real fora deste laboratório.')}}},
 storage:{from(){return {getPublicUrl(){return {data:{publicUrl:'/images/catalog/led-h4.webp'}}}}}},
 functions:{async invoke(){return {error:new Error('Registro de leads desativado no laboratório visual.')}}},
 async rpc(fn:string,args:any={}){switch(fn){
 case 'elite_admin_dashboard':return result({total:products.length,active:2,unavailable:1,without_images:3,categories:2});
 case 'elite_admin_products':{const f=args.filters||{};const rows=products.filter(p=>(!f.query||(p.name+' '+p.sku).toLowerCase().includes(f.query.toLowerCase()))&&(!f.category||p.category_id===f.category)&&(!f.availability||p.availability===f.availability));return result({rows,total:rows.length})}
 case 'elite_catalog':{const f=args.filters||{};const rows=products.filter(p=>p.is_active&&(!f.slug||p.slug===f.slug)&&(!f.ids||f.ids.includes(p.id))&&(!f.query||(p.name+' '+p.sku).toLowerCase().includes(f.query.toLowerCase())));return result({rows,total:rows.length})}
 case 'elite_crm_dashboard':return result({total:5,statuses:{novo:1,em_atendimento:1,orcamento_enviado:1,convertido:1,perdido:1},recent:leads});
 case 'elite_list_leads':{const f=args.filters||{};const rows=leads.filter(l=>(!f.status||l.status===f.status)&&(!f.query||l.full_name.toLowerCase().includes(f.query.toLowerCase())));return result({rows,total:rows.length})}
 default:return {data:null,error:new Error('Laboratório visual somente leitura: nenhuma gravação foi enviada.')};
 }}
};
export const supabase=client;
export function db(){return client;}
export function message(e:any){return e?.message||'Falha no laboratório visual.';}
export function check(e:any){if(e)throw e;}
