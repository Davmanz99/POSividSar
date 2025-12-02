import { Sale, Local, User } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PrintReceiptProps {
    sale: Sale;
    local?: Local;
    seller?: User;
}

export const printReceipt = ({ sale, local, seller }: PrintReceiptProps) => {
    const dateFormatted = format(new Date(sale.date), 'dd/MM/yyyy HH:mm', { locale: es });
    const paymentMethodMap = {
        'CASH': 'Efectivo',
        'CARD': 'Tarjeta',
        'TRANSFER': 'Transferencia'
    };

    const receiptContent = `
        <html>
            <head>
                <title>Boleta de Venta</title>
                <style>
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        width: 80mm;
                        margin: 0;
                        padding: 5px;
                        font-size: 12px;
                        color: #000;
                        background: #fff;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 10px;
                    }
                    .divider {
                        border-top: 1px dashed #000;
                        margin: 5px 0;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 2px 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 5px 0;
                    }
                    th, td {
                        text-align: left;
                        padding: 2px 0;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .total-section {
                        margin-top: 10px;
                        text-align: right;
                        font-size: 14px;
                        font-weight: bold;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2 style="margin: 0;">${local?.name || 'NEXUS POS'}</h2>
                    <p style="margin: 2px 0;">${local?.address || 'Dirección Principal'}</p>
                </div>
                
                <div class="divider"></div>
                
                <div class="info-row">
                    <span>Fecha:</span>
                    <span>${dateFormatted}</span>
                </div>
                <div class="info-row">
                    <span>Ticket:</span>
                    <span>#${sale.id.slice(0, 8)}</span>
                </div>
                <div class="info-row">
                    <span>Vendedor:</span>
                    <span>${seller?.name || 'Cajero'}</span>
                </div>

                <div class="divider"></div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 40%">Item</th>
                            <th style="width: 20%" class="text-right">Cant</th>
                            <th style="width: 40%" class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sale.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td class="text-right">${item.quantity}</td>
                                <td class="text-right">$${(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="divider"></div>

                <div class="total-section">
                    <div class="info-row">
                        <span>TOTAL:</span>
                        <span>$${sale.total.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="info-row" style="margin-top: 5px;">
                    <span>Método Pago:</span>
                    <span>${paymentMethodMap[sale.paymentMethod]}</span>
                </div>

                <div class="footer">
                    <p>¡Gracias por su preferencia!</p>
                    <p>Copia Cliente</p>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    }
                </script>
            </body>
        </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
        printWindow.document.write(receiptContent);
        printWindow.document.close();
    } else {
        alert('Por favor permite las ventanas emergentes para imprimir.');
    }
};
