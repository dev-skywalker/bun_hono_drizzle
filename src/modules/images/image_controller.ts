import { Context } from "hono";
import { Env } from "../../config/env";

export const uploadImage = async (c: Context<{ Bindings: Env }>) => {
    const body = await c.req.parseBody();
    let key = body['key'].toString();
    try {
        if (body['file']) {
            const file = body['file'];
            const r2 = c.env.MY_DATA;

            const result = await r2.put(key, file)
            if (result != null) {
                let imageUrl = "https://cloud.pyaesone.com/" + result?.key

                c.status(201);
                return c.json({ imageUrl });
            } else {
                c.status(400);
                return c.json({ status: "Error Upload Image." });
            }


        }
    } catch (e) {
        c.status(400);
        return c.json({ status: "Error upload image." });
    }
}

export const deleteImage = async (c: Context<{ Bindings: Env }>) => {
    const { id } = await c.req.json();
    try {
        const r2 = c.env.MY_DATA;
        await r2.delete(id);
        c.status(200);
        return c.json({ "status": "success" });
    } catch (e) {
        c.status(400);
        return c.json({ status: "Error delete image." });
    }
}
