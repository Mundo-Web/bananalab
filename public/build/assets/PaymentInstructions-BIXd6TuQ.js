import{j as e}from"./AboutSimple-Cf8x2fCZ.js";import{r as m}from"./index-BOnQTV8N.js";import{c as g}from"./ReactAppend-DTVVXReZ.js";import{C as h}from"./CreateReactScript-CrlrjA2p.js";import"./index-yBjzXJbu.js";import"./_commonjsHelpers-D6-XlEtG.js";import"./index-fNjTmf9T.js";import"./index.esm-DFiNGWUA.js";import"./___vite-browser-external_commonjs-proxy-DDYoOVPM.js";import"./main-Bp3JhiuO.js";import"./Global-BM4Id4Pw.js";/* empty css               *//* empty css              */import"./General-BmbBKdsB.js";const f=({paymentMethod:a,amount:i=0})=>{const[r,c]=m.useState(null),[s,d]=m.useState({});if(m.useEffect(()=>{a&&(c(a.instructions||{}),d(a.configuration||{}))},[a]),!a||!r)return e.jsxs("div",{className:"alert alert-info",children:[e.jsx("i",{className:"mdi mdi-information-outline me-2"}),"Selecciona un método de pago para ver las instrucciones."]});const o=n=>n?n.replace(/{amount}/g,`S/ ${i.toFixed(2)}`).replace(/{phone_number}/g,s.phone_number||"[Número no configurado]").replace(/{bank_name}/g,s.bank_name||"[Banco no configurado]").replace(/{account_type}/g,s.account_type||"[Tipo de cuenta no configurado]").replace(/{account_number}/g,s.account_number||"[Número de cuenta no configurado]").replace(/{cci}/g,s.cci||"[CCI no configurado]").replace(/{account_holder}/g,s.account_holder||"[Titular no configurado]").replace(/{document_number}/g,s.document_number||"[Documento no configurado]").replace(/{currency}/g,s.currency||"PEN").replace(/{contact_person}/g,s.contact_person||"[Contacto no configurado]").replace(/{contact_phone}/g,s.contact_phone||"[Teléfono no configurado]").replace(/{pickup_address}/g,s.pickup_address||"[Dirección no configurada]").replace(/{pickup_hours}/g,s.pickup_hours||"[Horarios no configurados]").replace(/{reference}/g,s.reference||"[Referencia no configurada]"):"",u=()=>!r.qr_display||!s.qr_code?null:e.jsxs("div",{className:"text-center mb-4",children:[e.jsxs("div",{className:"qr-container bg-light p-3 rounded border d-inline-block",children:[e.jsx("img",{src:`/storage/payment_config/${s.qr_code}`,alt:`Código QR ${a.display_name}`,className:"img-fluid",style:{maxWidth:"200px",maxHeight:"200px"},onError:n=>{n.target.style.display="none",n.target.nextSibling.style.display="block"}}),e.jsxs("div",{style:{display:"none"},className:"text-muted p-4",children:[e.jsx("i",{className:"mdi mdi-qrcode fs-1"}),e.jsx("p",{className:"mb-0",children:"QR no disponible"})]})]}),r.show_phone&&s.phone_number&&e.jsx("div",{className:"mt-2",children:e.jsxs("small",{className:"text-muted",children:["O busca manualmente: ",e.jsx("strong",{children:s.phone_number})]})})]}),l=(n,t)=>!t||t.length===0?null:e.jsxs("div",{className:"mb-4",children:[e.jsxs("h6",{className:"text-primary mb-3",children:[e.jsx("i",{className:"mdi mdi-information me-2"}),n]}),e.jsx("div",{className:"info-list bg-light p-3 rounded",children:t.map((p,x)=>e.jsx("div",{className:"mb-2",dangerouslySetInnerHTML:{__html:o(p)}},x))})]});return e.jsxs("div",{className:"payment-instructions",children:[e.jsxs("div",{className:"card",children:[e.jsx("div",{className:"card-header bg-primary text-white",children:e.jsxs("h5",{className:"mb-0",children:[e.jsx("i",{className:`mdi ${b(a.type)} me-2`}),r.title||`Instrucciones para ${a.display_name}`]})}),e.jsxs("div",{className:"card-body",children:[u(),i>0&&e.jsx("div",{className:"alert alert-success text-center mb-4",children:e.jsxs("h4",{className:"mb-0",children:[e.jsx("i",{className:"mdi mdi-cash me-2"}),"Monto a pagar: ",e.jsxs("strong",{children:["S/ ",i.toFixed(2)]})]})}),l("Datos bancarios",r.bank_info),l("Información de contacto",r.contact_info),l("Datos de la cuenta",r.account_info),r.steps&&r.steps.length>0&&e.jsxs("div",{className:"mb-4",children:[e.jsxs("h6",{className:"text-primary mb-3",children:[e.jsx("i",{className:"mdi mdi-format-list-numbered me-2"}),"Pasos a seguir:"]}),e.jsx("ol",{className:"steps-list",children:r.steps.map((n,t)=>e.jsx("li",{className:"mb-2",dangerouslySetInnerHTML:{__html:o(n)}},t))})]}),s.instructions_text&&e.jsxs("div",{className:"mb-4",children:[e.jsxs("h6",{className:"text-primary mb-3",children:[e.jsx("i",{className:"mdi mdi-message-text me-2"}),"Instrucciones adicionales:"]}),e.jsx("div",{className:"alert alert-info",children:s.instructions_text})]}),r.note&&e.jsxs("div",{className:"alert alert-warning",children:[e.jsx("i",{className:"mdi mdi-alert-circle-outline me-2"}),e.jsx("strong",{children:"Importante:"})," ",o(r.note)]}),a.requires_proof&&e.jsxs("div",{className:"alert alert-danger",children:[e.jsx("i",{className:"mdi mdi-camera me-2"}),e.jsx("strong",{children:"Comprobante requerido:"})," No olvides subir la imagen del comprobante de pago para completar tu pedido."]})]})]}),e.jsx("style",{jsx:!0,children:`
                .payment-instructions {
                    max-width: 600px;
                    margin: 0 auto;
                }
                
                .qr-container {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .info-list {
                    border-left: 4px solid #007bff;
                }
                
                .steps-list li {
                    padding: 8px 0;
                    border-bottom: 1px solid #eee;
                }
                
                .steps-list li:last-child {
                    border-bottom: none;
                }
                
                @media (max-width: 768px) {
                    .payment-instructions {
                        margin: 0 10px;
                    }
                    
                    .qr-container img {
                        max-width: 150px !important;
                        max-height: 150px !important;
                    }
                }
            `})]})},b=a=>{switch(a){case"qr":return"mdi-qrcode";case"manual":return"mdi-bank";case"gateway":return"mdi-credit-card";default:return"mdi-credit-card"}};h((a,i)=>{const{method:r,amount:c}=i;g.createRoot(a).render(e.jsx(f,{paymentMethod:r,amount:c||0,...i}))});
