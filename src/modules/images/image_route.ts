import { Hono } from "hono";
import { Env } from "../../config/env";
import { deleteImage, uploadImage } from "./image_controller";
import { zValidator } from "@hono/zod-validator";
import { imageSchema } from "./image_schema";

const imageRoutes = new Hono<{ Bindings: Env }>();

imageRoutes.post("/", zValidator('form', imageSchema), uploadImage)
imageRoutes.delete("/", deleteImage)

export default imageRoutes;