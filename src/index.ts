import { Hono } from 'hono';
import userRoutes from './modules/users/user_route';
import unitRoutes from './modules/units/unit_route';
import productRoutes from './modules/products/product_route';
import { cors } from 'hono/cors';
import categoryRoutes from './modules/category/category_route';
import productCategoryRoutes from './modules/productCategory/product_category_route';
import brandRoutes from './modules/brands/brand_route';
import imageRoutes from './modules/images/image_route';
import warehouseRoutes from './modules/warehouse/warehouse_route';
import supplierRoutes from './modules/suppliers/supplier_route';
import purchaseRoutes from './modules/purchases/purchase_route';
import purchaseItemRoutes from './modules/purchaseItem/purchase_item_route';
import manageStockRoutes from './modules/manageStock/manage_stock_route';
import customerRoutes from './modules/customers/customer_route';
import saleRoutes from './modules/sales/sale_route';
import saleItemRoutes from './modules/saleItem/sale_item_route';
import transferRoutes from './modules/transfers/transfer_route';
import transferItemRoutes from './modules/transferItem/transfer_item_route';
import reportRoutes from './modules/reports/report_route';
import lostDamageRoutes from './modules/lostDamageItem/lost_damage_route';
import saleReturnRoutes from './modules/saleReturn/sale_return_route';
import purchaseReturnRoutes from './modules/purchaseReturn/purchase_return_route';
import paymentTypeRoutes from './modules/paymentType/payment_type_route';

const app = new Hono().basePath('/api');

app.use('*', cors({
  origin: 'https://ssp.pyaesone.com',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'PUT', 'DELETE'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}))

app.options('*', (c) => {
  return c.text('', 204)
})

app.get('/status', async (c) => {
  return c.json({ status: "success" })
})
app.route('/users', userRoutes)
app.route('/units', unitRoutes)
app.route('/brands', brandRoutes)
app.route('/products', productRoutes)
app.route('/category', categoryRoutes)
app.route('/warehouses', warehouseRoutes)
app.route('/suppliers', supplierRoutes)
app.route('/customers', customerRoutes)
app.route('/purchases', purchaseRoutes)
app.route('/purchase_items', purchaseItemRoutes)
app.route('/sales', saleRoutes)
app.route('/reports', reportRoutes)
app.route('/sale_items', saleItemRoutes)
app.route('/transfers', transferRoutes)
app.route('/lost_damage', lostDamageRoutes)
app.route('/sale_return', saleReturnRoutes)
app.route('/purchase_return', purchaseReturnRoutes)
app.route('/transfer_items', transferItemRoutes)
app.route('/payment_type', paymentTypeRoutes)
app.route('/manage_stocks', manageStockRoutes)
app.route('/product_category', productCategoryRoutes)
app.route('/image', imageRoutes)


export default app;