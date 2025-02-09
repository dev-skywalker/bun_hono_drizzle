import { Hono } from "hono";
import { Env } from "../../config/env";
import { deleteImage, uploadImage } from "./image_controller";
import { zValidator } from "@hono/zod-validator";
import { imageSchema } from "./image_schema";
import { checkAuth } from "../../middleware/check_permission";

const imageRoutes = new Hono<{ Bindings: Env }>();

imageRoutes.post("/", checkAuth(), zValidator('form', imageSchema), uploadImage)
imageRoutes.delete("/", checkAuth(), deleteImage)

export default imageRoutes;