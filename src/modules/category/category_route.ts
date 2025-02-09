import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { categorySchema } from "./category_schema";
import { createCategory, deleteAllCategory, deleteCategory, getAllCategory, getCategory, getPaginateCategory, updateCategory } from "./category_controller";
import { checkAuth } from "../../middleware/check_permission";

const categoryRoutes = new Hono<{ Bindings: Env }>();

categoryRoutes.post("/", checkAuth(), zValidator("json", categorySchema), createCategory)

categoryRoutes.put("/", checkAuth(), updateCategory)

categoryRoutes.get('/all', checkAuth(), getAllCategory)

categoryRoutes.get('/', checkAuth(), getPaginateCategory)

categoryRoutes.get('/:id', checkAuth(), getCategory)

categoryRoutes.delete("/", checkAuth(), deleteCategory)

categoryRoutes.delete("/all", checkAuth(), deleteAllCategory)

categoryRoutes.post('/test', async (c) => {
    const body = await c.req.parseBody({ all: true })
    //body['tests[]']
    // const tests = await c.req.parseBody()
    const name = body['name[]'];
    const email = body['email'];

    const file = body['file'];

    if (Array.isArray(file)) {
        // Handle array of files if needed
        console.log('Received multiple files:', file);
    } else {
        // Handle single file
        console.log('Received single file:', file);
    }

    let gg;
    if (!Array.isArray(name)) {
        console.log("Is Array");
        gg = "Is Nor Array";
        return c.status(400);
    }
    let pp = [];
    for (let i = 0; i < name.length; i++) {
        console.log(name[i]);
        pp.push(name[i])
    }

    return c.json({ "list": name, "gg": gg, "file": file, "type": typeof name })
})

export default categoryRoutes;

