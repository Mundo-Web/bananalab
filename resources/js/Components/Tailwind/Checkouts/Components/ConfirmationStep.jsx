import Number2Currency from "../../../../Utils/Number2Currency";
import ButtonPrimary from "./ButtonPrimary";

export default function ConfirmationStep({ cart, code, delivery, sale }) {
    console.log('🎉 ConfirmationStep: Mostrando confirmación', { cart, code, delivery, sale });

    // Si tenemos datos de la venta, usar esos datos
    let finalCart = cart;
    let finalTotal = 0;
    let finalDelivery = delivery || 0;
    
    if (sale && sale.details && sale.details.length > 0) {
        // Usar datos de la venta desde la base de datos
        finalCart = sale.details.map(detail => ({
            id: detail.item_id,
            name: detail.name,
            image: detail.item?.image || 'default.jpg',
            price: detail.price,
            final_price: detail.price,
            quantity: detail.quantity,
            brand: detail.item?.brand || { name: 'N/A' },
            sku: detail.item?.sku || 'N/A'
        }));
        finalTotal = parseFloat(sale.amount || 0);
        finalDelivery = parseFloat(sale.delivery || 0);
    } else {
        // Usar datos del carrito
        const totalPrice = cart.reduce((acc, item) => {
            const finalPrice = item.final_price;
            return acc + finalPrice * item.quantity;
        }, 0);
        finalTotal = totalPrice + parseFloat(delivery || 0);
    }

    // Calcular subtotal e IGV basado en el total final
    const subTotal = ((finalTotal - finalDelivery) / 1.18).toFixed(2);
    const igv = (subTotal * 0.18).toFixed(2);




    // Calcular el total final (subtotal sin IGV + IGV + envío)
    const totalFinal = parseFloat(subTotal) + parseFloat(igv) + parseFloat(delivery);
    return (
        <div className="mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center space-y-4">
                    <h2 className="text-[20px] customtext-neutral-light">Gracias por tu compra 🎉</h2>
                    <p className="customtext-neutral-dark text-5xl font-semibold">Tu orden ha sido recibida</p>

                    <div className="py-4">
                        <div className=" customtext-neutral-light">Código de pedido</div>
                        <div className="customtext-neutral-dark text-lg font-semibold">{`#${code}`}</div>
                    </div>

                    <div className="space-y-4 max-w-lg bg-[#F7F9FB] mx-auto p-8 rounded-xl">
                        <div className="space-y-6 border-b-2 pb-6">
                            {finalCart.map((item, index) => (
                                <div key={index} className="rounded-lg">
                                    <div className="flex gap-4">
                                        <div className="bg-white p-2 rounded-xl w-max">
                                            <img
                                                src={item.image ? `/storage/images/item/${item.image}` : '/assets/img/default-product.jpg'}
                                                alt={item.name}
                                                className="w-20 h-20 object-cover rounded"
                                                onError={(e) => {
                                                    e.target.src = '/assets/img/default-product.jpg';
                                                }}
                                            />
                                        </div>
                                        <div className="text-start">
                                            <h3 className="font-medium text-lg mb-2">{item.name}</h3>
                                            <p className="text-sm customtext-neutral-light">Marca: <span className="customtext-neutral-dark">{item.brand?.name || 'N/A'}</span></p>
                                            <p className="text-sm customtext-neutral-light">Cantidad: <span className="customtext-neutral-dark">{item.quantity}</span></p>
                                            <p className="text-sm customtext-neutral-light">SKU: <span className="customtext-neutral-dark">{item.sku || 'N/A'}</span></p>
                                            <p className="text-sm customtext-neutral-light">Precio: <span className="customtext-neutral-dark">S/ {Number2Currency(item.price || item.final_price)}</span></p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4 mt-6">
                            <div className="flex justify-between">
                                <span className="customtext-neutral-dark">Subtotal</span>
                                <span className="font-semibold">S/ {Number2Currency(subTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="customtext-neutral-dark">IGV</span>
                                <span className="font-semibold">S/ {Number2Currency(igv)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="customtext-neutral-dark">Envío</span>
                                <span className="font-semibold">S/ {Number2Currency(finalDelivery)}</span>
                            </div>
                            <div className="py-3 border-y-2 mt-6">
                                <div className="flex justify-between font-bold text-[20px] items-center">
                                    <span>Total</span>
                                    <span>S/ {Number2Currency(finalTotal)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-3">
                            <ButtonPrimary href="/catalogo" >  Seguir Comprando</ButtonPrimary>

                        </div>

                    </div>


                </div>
            </div>
        </div>
    )
}

