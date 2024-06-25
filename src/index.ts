import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';

import { posts } from './db/schema';

export type Env = {
  DB: D1Database;
  MY_DATA: R2Bucket
};


function getHighResolutionTime() {
  return performance.now() / 1e6; // Convert nanoseconds to milliseconds
}

const api = new Hono<{ Bindings: Env }>();
api
  .get('/posts', async (c) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(posts).all();
    return c.json(result);
  })
  .get('/posts/:id', async (c) => {
    const db = drizzle(c.env.DB);
    const id = Number(c.req.param('id'));
    const result = await db.select().from(posts).where(eq(posts.id, id));
    return c.json(result);
  })
  .post('/posts', async (c) => {
    const db = drizzle(c.env.DB);
    //const { title, content } = await c.req.json();
    const body = await c.req.parseBody();
    let title: any = body['title'];
    let content: any = body['content']
    const result = await db
      .insert(posts)
      .values({ title, content })
      .returning();
    return c.json(result);
  }).post('/upload', async (c) => {
    const body = await c.req.parseBody();
    let file: any = body['file'];
    await c.env.MY_DATA.put("my-test.png", file).then((v) => {
      console.log(v);
      console.log("upload complete");
    })
    return c.json({ "status": "Success" })
  }).get('/p', async (c) => {
    const start = getHighResolutionTime()

    // Example of some business logic
    calculatePrimes(10000000)

    const end = getHighResolutionTime()
    const cpuTime = end - start
    console.log(`CPU time: ${cpuTime}ms`)

    return c.text('Hello, world!')
  });

function calculatePrimes(max: number) {
  let primes = []
  for (let i = 2; i <= max; i++) {
    let isPrime = true
    for (let j = 2; j * j <= i; j++) {
      if (i % j === 0) {
        isPrime = false
        break
      }
    }
    if (isPrime) {
      primes.push(i)
    }
  }
  return primes
}

const app = new Hono();
app.route('/api', api);

export default app;