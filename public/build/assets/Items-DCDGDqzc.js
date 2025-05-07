var ge=Object.defineProperty;var xe=(h,l,p)=>l in h?ge(h,l,{enumerable:!0,configurable:!0,writable:!0,value:p}):h[l]=p;var G=(h,l,p)=>xe(h,typeof l!="symbol"?l+"":l,p);import{j as r}from"./AboutSimple-Cf8x2fCZ.js";import{B as be}from"./Base-DTCj5N6s.js";import{S as I}from"./SwitchFormGroup-DUGhyqoj.js";import{T as je}from"./TextareaFormGroup-CdwdsTk2.js";import{r as i}from"./index-BH53Isel.js";import{c as ve}from"./ReactAppend-DTVVXReZ.js";import{s as O}from"./DxBox-CTFD8z_X.js";import{S as ye}from"./ProductCard-C2H10lUi.js";import"./main-BSEyQEJW.js";import{B as we}from"./ModalImportItem-Cjgn8e-W.js";import{M as J}from"./Modal-BJ3DTV_x.js";import{T as Re}from"./Table-CP679pea.js";import{I as V}from"./ImageFormGroup-Dx5myhwn.js";import{I as F}from"./InputFormGroup-D5I6zpZc.js";import{Q as Ne}from"./QuillFormGroup-D8zDHSfJ.js";import{S as Q}from"./SelectAPIFormGroup-LjjPmM2C.js";import{S as H}from"./SelectFormGroup-BPkIDnvX.js";import{D as K}from"./DxButton-CsjWvhyj.js";import{C as Se}from"./CreateReactScript-C53VDHBb.js";import{N as W}from"./Number2Currency-e57Tgsuk.js";import{R as C}from"./ReactAppend-D7S498fx.js";import{S as Ce}from"./SetSelectValue-UxyCmHse.js";import"./index-yBjzXJbu.js";import"./Global-BM4Id4Pw.js";import"./tippy-react.esm-BWiGTO87.js";import"./index-rimy3MAc.js";import"./index-fNjTmf9T.js";/* empty css              */import"./Logout-CGCqvje3.js";import"./MenuItemContainer-BkmzVQNY.js";import"./index.esm-BE8-iLxT.js";import"./___vite-browser-external_commonjs-proxy-0zb4Agf2.js";/* empty css               */import"./General-BmbBKdsB.js";const De=({label:h,structure:l,onChange:p,typeOptions:f=[]})=>{const[c,u]=i.useState([]),y=()=>{u(typeof l=="object"?[...c,{...l}]:[...c,""])},b=m=>{const d=c.filter((a,n)=>n!==m);u(d),p(d)},j=(m,d,a)=>{const n=[...c];typeof n[m]=="object"?n[m][d]=a:n[m]=a,u(n),p(n)};return r.jsxs("div",{className:"dynamic-field-container",children:[r.jsx("label",{className:"form-label",children:h}),r.jsx("div",{className:"fields-list",children:c.map((m,d)=>r.jsxs("div",{className:"field-row",children:[typeof m=="object"?Object.keys(l).map(a=>r.jsx("div",{className:"field-input",children:a==="type"?r.jsxs("select",{className:"form-select select-type",value:m[a],onChange:n=>j(d,a,n.target.value),children:[r.jsx("option",{value:"",children:"Seleccionar..."}),f.map(n=>r.jsx("option",{value:n,children:n},n))]}):r.jsx("input",{type:"text",className:"form-control ",value:m[a],onChange:n=>j(d,a,n.target.value),placeholder:a.charAt(0).toUpperCase()+a.slice(1)})},a)):r.jsx("div",{className:"field-input",children:r.jsx("input",{type:"text",className:"form-control ",value:m,onChange:a=>j(d,null,a.target.value),placeholder:"Nueva característica"})}),r.jsx("button",{type:"button",className:"btn btn-sm btn-outline-danger remove-btn",onClick:()=>b(d),children:r.jsx("i",{className:"fas fa-times"})})]},d))}),r.jsxs("button",{type:"button",className:"btn btn-sm btn-outline-primary add-btn",onClick:y,children:[r.jsx("i",{className:"fas fa-plus me-1"})," Agregar"]}),r.jsx("style",{jsx:!0,children:`
                .dynamic-field-container {
                    margin-bottom: 1rem;
                }

                .fields-list {
                    margin-bottom: 0.5rem;
                }

                .field-row {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    align-items: center;
                }

                .field-input {
                    flex: 1;
                }

                .remove-btn {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                }

                .add-btn {
                    width: 100%;
                }
            `})]})};class X extends we{constructor(){super(...arguments);G(this,"path","admin/items");G(this,"hasFiles",!0);G(this,"importData",async p=>{console.log("FormData recibido en importData:",[...p.entries()]);try{const f=await fetch("/api/import-items",{method:"POST",body:p}),c=await f.json();if(console.log("Respuesta del servidor:",c),!f.ok)throw new Error((c==null?void 0:c.error)??(c==null?void 0:c.message)??"Error en la importación");return c}catch(f){throw console.error("Error en importData:",f.message),f}})}}const Ie=new X,Fe=({gridRef:h,modalRef:l})=>{const[p,f]=i.useState(null),[c,u]=i.useState(!1),[y,b]=i.useState(""),[j,m]=i.useState(!1),d=n=>{f(n.target.files[0])},a=async()=>{var w,R;if(!p){b("Por favor, selecciona un archivo."),m(!0);return}const n=new FormData;n.append("file",p),u(!0);try{const g=await Ie.importData(n);if(console.log(g),g.error){const D=Array.isArray(g.error)?g.error.join(`
`):g.error;b(`Error en la importación:
${D}`),m(!0)}else b(g.message),m(!1),$(h.current).dxDataGrid("instance").refresh(),l.current&&l.current.close()}catch(g){b("Error al importar: "+(((R=(w=g.response)==null?void 0:w.data)==null?void 0:R.error)||g.message)),m(!0)}u(!1)};return r.jsx("div",{className:"bg-white",children:r.jsxs("div",{className:"modal-content",children:[r.jsx("div",{children:r.jsx("input",{className:"form-control",type:"file",accept:".xlsx",onChange:d})}),r.jsx("button",{onClick:a,disabled:c,className:"btn btn-primary mt-2",type:"button",children:c?"Subiendo...":"Subir Archivo"}),y&&r.jsx("div",{className:`alert ${j?"alert-danger":"alert-success"} mt-2`,role:"alert",children:r.jsx("div",{className:"alert-message",children:y})})]})})},k=new X,ke=({categories:h,brands:l,collections:p})=>{const[f,c]=i.useState([]),u=i.useRef(),y=i.useRef(),b=i.useRef(),j=i.useRef(),m=i.useRef(),d=i.useRef(),a=i.useRef(),n=i.useRef(),w=i.useRef(),R=i.useRef(),g=i.useRef(),D=i.useRef(),T=i.useRef(),A=i.useRef(),B=i.useRef(),P=i.useRef(),Y=i.useRef([]),[Z,ee]=i.useState(!1),[re,te]=i.useState(null),[se,ie]=i.useState(null),[E,N]=i.useState([]),q=i.useRef(),[ne,le]=i.useState([]),[ae,L]=i.useState([]),[Te,Ee]=i.useState(!1),M=i.useRef(),oe=e=>{const s=Array.from(e.target.files).map(o=>({file:o,url:URL.createObjectURL(o)}));N(o=>[...o,...s])},ce=e=>{e.preventDefault();const s=Array.from(e.dataTransfer.files).map(o=>({file:o,url:URL.createObjectURL(o)}));N(o=>[...o,...s])},me=e=>e.preventDefault(),de=(e,t)=>{e.preventDefault(),E[t].id?N(o=>o.map((v,S)=>S===t?{...v,toDelete:!0}:v)):N(o=>o.filter((v,S)=>S!==t))};i.useEffect(()=>{if(f&&f.images){const e=f.images.map(t=>({id:t.id,url:`/storage/images/item_image/${t.url}`}));N(e)}},[f]);const U=e=>{var t,s;c(e||null),ee(!!(e!=null&&e.id)),b.current.value=(e==null?void 0:e.id)||"",$(j.current).val((e==null?void 0:e.category_id)||null).trigger("change"),$(m.current).val((e==null?void 0:e.collection_id)||null).trigger("change"),Ce(d.current,(t=e==null?void 0:e.subcategory)==null?void 0:t.id,(s=e==null?void 0:e.subcategory)==null?void 0:s.name),$(a.current).val((e==null?void 0:e.brand_id)||null).trigger("change"),n.current.value=(e==null?void 0:e.name)||"",w.current.value=(e==null?void 0:e.color)||"",R.current.value=(e==null?void 0:e.summary)||"",g.current.value=(e==null?void 0:e.price)||0,D.current.value=(e==null?void 0:e.discount)||0,P.current.value=(e==null?void 0:e.stock)||0,T.current.value=null,T.image.src=`/storage/images/item/${(e==null?void 0:e.image)??"undefined"}`,A.image.src=`/storage/images/item/${(e==null?void 0:e.texture)??"undefined"}`,B.editor.root.innerHTML=(e==null?void 0:e.description)??"",le((e==null?void 0:e.features)||[]),L((e==null?void 0:e.specifications)||[]),$(y.current).modal("show")},pe=async e=>{e.preventDefault();const t={id:b.current.value||void 0,category_id:j.current.value,collection_id:m.current.value||null,subcategory_id:d.current.value,brand_id:a.current.value,name:n.current.value,color:w.current.value,summary:R.current.value,price:g.current.value,discount:D.current.value,description:B.current.value,stock:P.current.value},s=new FormData;for(const x in t)s.append(x,t[x]);s.append("features",JSON.stringify(ne)),s.append("specifications",JSON.stringify(ae));const o=T.current.files[0];o&&s.append("image",o);const v=A.current.files[0];v&&s.append("texture",v),E.forEach((x,z)=>{x.toDelete||(x.file?s.append(`gallery[${z}]`,x.file):s.append(`gallery_ids[${z}]`,x.id))});const S=E.filter(x=>x.toDelete).map(x=>parseInt(x.id,10));S.length>0&&s.append("deleted_images",JSON.stringify(S)),await k.save(s)&&($(u.current).dxDataGrid("instance").refresh(),$(y.current).modal("hide"),N([]))},ue=async({id:e,value:t})=>{await k.boolean({id:e,field:"visible",value:t})&&$(u.current).dxDataGrid("instance").refresh()},_=async({id:e,field:t,value:s})=>{await k.boolean({id:e,field:t,value:s})&&$(u.current).dxDataGrid("instance").refresh()},fe=async e=>{const{isConfirmed:t}=await ye.fire({title:"Eliminar Item",text:"¿Estás seguro de eliminar este Item?",icon:"warning",showCancelButton:!0,confirmButtonText:"Sí, eliminar",cancelButtonText:"Cancelar"});!t||!await k.delete(e)||$(u.current).dxDataGrid("instance").refresh()},he=()=>{$(M.current).modal("show")};return r.jsxs(r.Fragment,{children:[r.jsx(Re,{gridRef:u,title:"Items",rest:k,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(u.current).dxDataGrid("instance").refresh()}}),e.unshift({widget:"dxButton",location:"after",options:{icon:"plus",text:"Agregar",hint:"Agregar",onClick:()=>U()}}),e.unshift({widget:"dxButton",location:"after",options:{icon:"upload",text:"Importar Datos",hint:"Importar Datos",onClick:()=>he()}})},exportable:!0,exportableName:"Items",columns:[{dataField:"id",caption:"ID",visible:!1},{dataField:"category.name",caption:"Categoría",width:"120px",cellTemplate:(e,{data:t})=>{var s,o,v;e.html(O.renderToString(r.jsxs(r.Fragment,{children:[r.jsx("b",{className:"d-block fst-italic text-muted",children:(s=t.collection)==null?void 0:s.name}),r.jsx("b",{className:"d-block",children:(o=t.category)==null?void 0:o.name}),r.jsx("small",{className:"text-muted",children:(v=t.subcategory)==null?void 0:v.name})]})))}},{dataField:"subcategory.name",caption:"Subcategoría",visible:!1},{dataField:"brand.name",caption:"Marca",width:"120px"},{dataField:"name",caption:"Nombre",width:"300px",cellTemplate:(e,{data:t})=>{e.html(O.renderToString(r.jsxs(r.Fragment,{children:[r.jsx("b",{children:t.name}),r.jsx("br",{}),r.jsx("span",{className:"truncate",children:t.summary})]})))}},{dataField:"final_price",caption:"Precio",dataType:"number",width:"75px",cellTemplate:(e,{data:t})=>{e.html(O.renderToString(r.jsxs(r.Fragment,{children:[t.discount>0&&r.jsxs("small",{className:"d-block text-muted",style:{textDecoration:"line-through"},children:["S/.",W(t.price)]}),r.jsxs("span",{children:["S/.",W(t.discount>0?t.discount:t.price)]})]})))}},{dataField:"image",caption:"Imagen",width:"90px",allowFiltering:!1,cellTemplate:(e,{data:t})=>{C(e,r.jsx("img",{src:`/storage/images/item/${t.image}`,style:{width:"80px",height:"48px",objectFit:"cover",objectPosition:"center",borderRadius:"4px"},onError:s=>s.target.src="/api/cover/thumbnail/null"}))}},{dataField:"is_new",caption:"Nuevo",dataType:"boolean",width:"80px",cellTemplate:(e,{data:t})=>{C(e,r.jsx(I,{checked:t.is_new,onChange:s=>_({id:t.id,field:"is_new",value:s.target.checked})}))}},{dataField:"offering",caption:"En oferta",dataType:"boolean",width:"80px",cellTemplate:(e,{data:t})=>{C(e,r.jsx(I,{checked:t.offering,onChange:s=>_({id:t.id,field:"offering",value:s.target.checked})}))}},{dataField:"recommended",caption:"Recomendado",dataType:"boolean",width:"80px",cellTemplate:(e,{data:t})=>{C(e,r.jsx(I,{checked:t.recommended,onChange:s=>_({id:t.id,field:"recommended",value:s.target.checked})}))}},{dataField:"featured",caption:"Destacado",dataType:"boolean",width:"80px",cellTemplate:(e,{data:t})=>{C(e,r.jsx(I,{checked:t.featured,onChange:s=>_({id:t.id,field:"featured",value:s.target.checked})}))}},{dataField:"visible",caption:"Visible",dataType:"boolean",width:"80px",cellTemplate:(e,{data:t})=>{C(e,r.jsx(I,{checked:t.visible,onChange:s=>ue({id:t.id,value:s.target.checked})}))}},{caption:"Acciones",width:"100px",cellTemplate:(e,{data:t})=>{e.css("text-overflow","unset"),e.append(K({className:"btn btn-xs btn-soft-primary",title:"Editar",icon:"fa fa-pen",onClick:()=>U(t)})),e.append(K({className:"btn btn-xs btn-soft-danger",title:"Eliminar",icon:"fa fa-trash",onClick:()=>fe(t.id)}))},allowFiltering:!1,allowExporting:!1}]}),r.jsxs(J,{modalRef:y,title:Z?"Editar Item":"Agregar Item",onSubmit:pe,size:"xl",children:[r.jsxs("div",{className:"row g-3",children:[r.jsx("div",{className:"col-md-4",id:"principal-container",children:r.jsxs("div",{className:"card",children:[r.jsx("div",{className:"card-header bg-light",children:r.jsx("h5",{className:"card-title mb-0",children:"Información Básica"})}),r.jsxs("div",{className:"card-body",children:[r.jsx("input",{ref:b,type:"hidden"}),r.jsx(H,{eRef:m,label:"Colección",dropdownParent:"#principal-container",onChange:e=>ie(e.target.value),children:p.map((e,t)=>r.jsx("option",{value:e.id,children:e.name},t))}),r.jsx(Q,{onChange:e=>te(e.target.value),eRef:j,label:"Categoría",searchAPI:"/api/admin/categories/paginate",searchBy:"name",filter:["collection_id","=",se],dropdownParent:"#principal-container"}),r.jsx(Q,{eRef:d,label:"Subcategoría",searchAPI:"/api/admin/subcategories/paginate",searchBy:"name",filter:["category_id","=",re],dropdownParent:"#principal-container"}),r.jsx(H,{eRef:a,label:"Marca",required:!0,dropdownParent:"#principal-container",children:l.map((e,t)=>r.jsx("option",{value:e.id,children:e.name},t))}),r.jsx(F,{eRef:n,label:"Nombre",required:!0}),r.jsx(F,{eRef:w,label:"Color",required:!0}),r.jsx(je,{eRef:R,label:"Resumen",rows:3,required:!0})]}),r.jsxs("div",{className:"card",children:[r.jsx("div",{className:"card-header bg-light",children:r.jsx("h5",{className:"card-title mb-0",children:"Precios y Stock"})}),r.jsxs("div",{className:"card-body",children:[r.jsx(F,{eRef:g,label:"Precio",type:"number",step:"0.01",required:!0}),r.jsx(F,{eRef:D,label:"Descuento",type:"number",step:"0.01"}),r.jsx(F,{label:"Stock",eRef:P,type:"number"})]})]})]})}),r.jsxs("div",{className:"col-md-8",children:[r.jsxs("div",{className:"card mt-3",children:[r.jsx("div",{className:"card-header bg-light",children:r.jsx("h5",{className:"card-title mb-0",children:"Especificaciones"})}),r.jsx("div",{className:"card-body",children:r.jsx(De,{ref:Y,label:"Especificaciones",structure:{type:"",title:"",description:""},onChange:L,typeOptions:["General","Principal"]})})]}),r.jsxs("div",{className:"card",children:[r.jsx("div",{className:"card-header bg-light",children:r.jsx("h5",{className:"card-title mb-0",children:"Imágenes"})}),r.jsxs("div",{className:"card-body",children:[r.jsxs("div",{className:"row",children:[r.jsx("div",{className:"col-md-6",children:r.jsx(V,{eRef:T,label:"Imagen Principal",aspect:1})}),r.jsx("div",{className:"col-md-6",children:r.jsx(V,{eRef:A,label:"Textura",aspect:1})})]}),r.jsxs("div",{className:"mt-3",children:[r.jsx("label",{className:"form-label",children:"Galería de Imágenes"}),r.jsx("input",{id:"input-item-gallery",ref:q,type:"file",multiple:!0,accept:"image/*",hidden:!0,onChange:oe}),r.jsx("div",{className:"gallery-upload-area",onClick:()=>q.current.click(),onDrop:ce,onDragOver:me,children:r.jsx("span",{className:"form-label d-block mb-1",children:"Arrastra y suelta imágenes aquí o haz clic para agregar"})}),r.jsx("div",{className:"gallery-preview mt-2",children:E.map((e,t)=>r.jsxs("div",{className:"gallery-thumbnail",children:[r.jsx("img",{src:`${e.url}`,alt:"preview"}),r.jsx("button",{className:"btn btn-xs btn-danger gallery-remove-btn",onClick:s=>de(s,t),children:"×"})]},t))})]})]})]})]})]}),r.jsxs("div",{className:"card mt-3",children:[r.jsx("div",{className:"card-header bg-light",children:r.jsx("h5",{className:"card-title mb-0",children:"Descripción Completa"})}),r.jsx("div",{className:"card-body",children:r.jsx(Ne,{eRef:B,label:""})})]})]}),r.jsx(J,{modalRef:M,title:"Importar Datos",size:"sm",children:r.jsx(Fe,{gridRef:u,modalRef:M})}),r.jsx("style",{jsx:!0,children:`
                .gallery-upload-area {
                    border: 2px dashed #ccc;
                    padding: 0px;
                    text-align: center;
                    cursor: pointer;
                    border-radius: 4px;
                    box-shadow: 2.5px 2.5px 5px rgba(0, 0, 0, 0.125);

                    height: 100px;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #f8f9fa;
                    transition: all 0.3s ease;
                }

                .gallery-upload-area:hover {
                    border-color: #0d6efd;
                    background-color: #e9f0ff;
                }

                .gallery-preview {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .gallery-thumbnail {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .gallery-thumbnail img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .gallery-remove-btn {
                    position: absolute;
                    top: 0;
                    right: 0;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                }
            `})]})};Se((h,l)=>{ve.createRoot(h).render(r.jsx(be,{...l,title:"Items",children:r.jsx(ke,{...l})}))});
