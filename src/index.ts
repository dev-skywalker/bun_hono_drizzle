import { Hono } from 'hono';
import userRoutes from './modules/users/user_route';
import unitRoutes from './modules/units/unit_route';
import productRoutes from './modules/products/product_route';
import { cors } from 'hono/cors';
import categoryRoutes from './modules/category/category_route';
import productCategoryRoutes from './modules/productCategory/product_category_route';
import brandRoutes from './modules/brands/brand_route';
import imageRoutes from './modules/images/image_route';

const app = new Hono().basePath('/api');

app.use('*', cors({
  origin: 'http://localhost:58160',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
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
app.route('/product_category', productCategoryRoutes)
app.route('/image', imageRoutes)


export default app;