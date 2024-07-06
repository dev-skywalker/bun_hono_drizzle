import { Hono } from 'hono';
import userRoutes from './modules/users/user_route';
import unitRoutes from './modules/units/unit_route';
import productRoutes from './modules/products/product_route';
import { cors } from 'hono/cors';

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
app.route('/products', productRoutes)


export default app;