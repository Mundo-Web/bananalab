import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import DxButton from '../Components/dx/DxButton';
import ReactAppend from '../Utils/ReactAppend';
import Swal from 'sweetalert2';
import SalesRest from '../Actions/Admin/SalesRest';
import Global from '../Utils/Global';
import Number2Currency from '../Utils/Number2Currency';
import Modal from '../Components/Adminto/Modal';
import Tippy from '@tippyjs/react';
import SaleStatusesRest from '../Actions/Admin/SaleStatusesRest';

const salesRest = new SalesRest()
const saleStatusesRest = new SaleStatusesRest()

const Sales = ({ statuses = [] }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  const [saleLoaded, setSaleLoaded] = useState(null);
  const [saleStatuses, setSaleStatuses] = useState([]);

  const onStatusChange = async (e) => {
    const result = await salesRest.save({
      id: saleLoaded.id,
      status_id: e.target.value
    })
    if (!result) return
    setSaleLoaded(result.data)
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Anular pedido',
      text: '¿Estas seguro de anular este pedido?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, anular',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await salesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onModalOpen = async (saleId) => {
    const newSale = await salesRest.get(saleId)
    setSaleLoaded(newSale)
    $(modalRef.current).modal('show');
  }

 /* useEffect(() => {
    if (!saleLoaded) return
    saleStatusesRest.bySale(saleLoaded.id).then((data) => {
      if (data) setSaleStatuses(data)
      else setSaleStatuses([])
    })
  }, [saleLoaded]) */

  const totalAmount = Number(saleLoaded?.amount)
    + Number(saleLoaded?.delivery)
    - Number(saleLoaded?.bundle_discount)
    - Number(saleLoaded?.renewal_discount)
    - Number(saleLoaded?.coupon_discount)

  return (<>
    <Table gridRef={gridRef} title='Pedidos' rest={salesRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
      }}
      columns={[
        {
          dataField: 'id',
          caption: 'ID',
          visible: false
        },
        {
          dataField: 'name',
          caption: 'Orden',
          width: '250px',
          cellTemplate: (container, { data }) => {
            container.css('cursor', 'pointer')
            container.on('click', () => {
              onModalOpen(data.id)
            })
            ReactAppend(container, <p className='mb-0' style={{ width: '100%' }}>
              <b className='d-block'>{data.name} {data.lastname}</b>
              <small className='text-nowrap text-muted' style={{
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                fontFamily: 'monospace'
              }}>#{Global.APP_CORRELATIVE}-{data.code}</small>
            </p>)
          }
        },
        {
          dataField: 'created_at',
          caption: 'Fecha',
          dataType: 'date',
          sortOrder: 'desc',
          cellTemplate: (container, { data }) => {
            container.text(moment(data.created_at).fromNow())
          }
        },
        {
          dataField: 'status.name',
          caption: 'Estado',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <span className='badge rounded-pill' style={{
              backgroundColor: data.status.color ? `${data.status.color}2e` : '#3333332e',
              color: data.status.color ?? '#333'
            }}>{data.status.name}</span>)
          }
        },
        {
          dataField: 'amount',
          caption: 'Total',
          dataType: 'number',
          cellTemplate: (container, { data }) => {
            const amount = Number(data.amount) || 0
            const delivery = Number(data.delivery) || 0
            const bundle_discount = Number(data.bundle_discount) || 0
            const renewal_discount = Number(data.renewal_discount) || 0
            const coupon_discount = Number(data.coupon_discount) || 0
            container.text(`S/. ${Number2Currency(amount + delivery - bundle_discount - renewal_discount - coupon_discount)}`);
          }
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            container.append(DxButton({
              className: 'btn btn-xs btn-light',
              title: 'Ver pedido',
              icon: 'fa fa-eye',
              onClick: () => onModalOpen(data.id)
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Anular pedido',
              icon: 'fa fa-trash',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={`Detalles del pedido #${Global.APP_CORRELATIVE}-${saleLoaded?.code}`} size='lg' bodyStyle={{
      backgroundColor: '#ebeff2'
    }} hideButtonSubmit >
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header p-2">
              <h5 className="card-title mb-0">Detalles de Venta</h5>
            </div>
            <div className="card-body p-2">
              <table className="table table-borderless table-sm mb-0">
                <tbody>
                  <tr>
                    <th>Nombres:</th>
                    <td>{saleLoaded?.name} {saleLoaded?.lastname}</td>
                  </tr>
                  <tr>
                    <th>Email:</th>
                    <td>{saleLoaded?.email}</td>
                  </tr>
                  <tr>
                    <th>Teléfono:</th>
                    <td>{saleLoaded?.phone}</td>
                  </tr>
                  <tr>
                    <th>Dirección:</th>
                    <td>{saleLoaded?.address} {saleLoaded?.number}
                      <small className='text-muted d-block'>{saleLoaded?.province ?? saleLoaded?.district}, {saleLoaded?.department}, {saleLoaded?.country} {saleLoaded?.zip_code && <>- {saleLoaded?.zip_code}</>}</small>
                    </td>
                  </tr>
                  {
                    saleLoaded?.reference &&
                    <tr>
                      <th>Referencia:</th>
                      <td>{saleLoaded?.reference}</td>
                    </tr>
                  }
                  {
                    saleLoaded?.comment &&
                    <tr>
                      <th>Comentario:</th>
                      <td>{saleLoaded?.comment}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header p-2">
              <h5 className="card-title mb-0">Artículos</h5>
            </div>
            <div className="card-body p-2 table-responsive">
              <table className="table table-striped table-bordered table-sm table-hover mb-0">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Colores</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    saleLoaded?.details?.map((detail, index) => {
                      const quantity = (detail.quantity * 100) / 100
                      const totalPrice = detail.price * detail.quantity
                      return <tr key={index}>
                        <td>{detail.name}</td>
                        <td>
                          {
                            detail?.colors?.map((color, index) => {
                              return <Tippy key={index} content={color.name}>
                                <i className='mdi mdi-circle' style={{
                                  color: color.hex,
                                  WebkitTextStroke: '1px #808080'
                                }}></i>
                              </Tippy>
                            })
                          }
                        </td>
                        <td align='right'>S/ {Number2Currency(detail.price)}</td>
                        <td align='center'>{quantity}</td>
                        <td align='right'>S/ {Number2Currency(totalPrice)}</td>
                      </tr>
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header p-2">
              <h5 className="card-title mb-0">Resumen</h5>
            </div>
            <div className="card-body p-2">
              <div className="d-flex justify-content-between">
                <b>Subtotal:</b>
                <span>S/ {Number2Currency(saleLoaded?.amount)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <b>Envío:</b>
                <span>S/ {Number2Currency(saleLoaded?.delivery)}</span>
              </div>
              {saleLoaded?.bundle && (
                <div className="d-flex justify-content-between">
                  <b>
                    Descuento x paquete:
                    <small className="d-block text-muted" style={{ fontWeight: "lighter" }}>
                      Elegiste {saleLoaded?.bundle?.name} (-{(saleLoaded?.bundle?.percentage * 10000) / 100}%)
                    </small>
                  </b>
                  <span>S/ -{Number2Currency(saleLoaded?.bundle_discount)}</span>
                </div>
              )}
              {saleLoaded?.renewal && (
                <div className="d-flex justify-content-between">
                  <b>
                    Subscripción:
                    <small className="d-block text-muted" style={{ fontWeight: "lighter" }}>
                      {saleLoaded?.renewal?.name} (-{(saleLoaded?.renewal?.percentage * 10000) / 100}%)
                    </small>
                  </b>
                  <span>S/ -{Number2Currency(saleLoaded?.renewal_discount)}</span>
                </div>
              )}
              {saleLoaded?.coupon && (
                <div className="d-flex justify-content-between">
                  <b>
                    Cupón aplicado:
                    <small className="d-block text-muted" style={{ fontWeight: "lighter" }}>
                      {saleLoaded?.coupon?.name} (-{(saleLoaded?.coupon?.amount * 100) / 100}%)
                    </small>
                  </b>
                  <span>S/ -{Number2Currency(saleLoaded?.coupon_discount)}</span>
                </div>
              )}
              <hr className='my-2' />
              <div className="d-flex justify-content-between">
                <b>Total:</b>
                <span>
                  <strong>S/ {Number2Currency(totalAmount)}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header p-2">
              <h5 className="card-title mb-0">Estado</h5>
            </div>
            <div className="card-body p-2">
              <div className="">
                <label htmlFor="statusSelect" className="form-label">Estado Actual</label>
                <select className="form-select" id="statusSelect" value={saleLoaded?.status_id} onChange={onStatusChange} disabled={!saleLoaded?.status?.reversible}>
                  {
                    statuses.map((status, index) => {
                      return <option value={status.id}>{status.name}</option>
                    })
                  }
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header p-2">
              <h5 className="card-title mb-0">Cambios de Estado</h5>
            </div>
            <div className="card-body p-2 d-flex flex-column gap-1">
              {
                saleStatuses?.map((ss, index) => {
                  return <article key={index} class="border py-1 px-2 ms-3" style={{
                    position: 'relative',
                    borderRadius: '16px 4px 4px 16px',
                    backgroundColor: ss.status.color ? `${ss.status.color}2e` : '#3333332e',
                  }}>
                    <i className='mdi mdi-circle left-2' style={{
                      color: ss.status.color || '#333',
                      position: 'absolute',
                      left: '-25px',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}></i>
                    <b style={{ color: ss.status.color || '#333' }}>{ss?.status?.name}</b>
                    <small className='d-block text-truncate'>{ss?.user?.name} {ss?.user?.lastname}</small>
                    <small className='d-block text-muted'>{moment(ss.created_at).format('YYYY-MM-DD HH:mm')}</small>
                  </article>
                })
              }
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {

  createRoot(el).render(<BaseAdminto {...properties} title='Pedidos'>
    <Sales {...properties} />
  </BaseAdminto>);
})