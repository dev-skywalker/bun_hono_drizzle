import { Hono } from "hono";
import { deleteAllUsers, deleteUser, getAllUser, userLogin, userRegister } from "./user_controller";
import { zValidator } from "@hono/zod-validator";
import { loginSchema, registrationSchema } from "./user_schema";
import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";

const userRoutes = new Hono<{ Bindings: Env }>();

userRoutes.post("/register", zValidator("json", registrationSchema), userRegister)

userRoutes.post("/login", zValidator("json", loginSchema), userLogin)

//userRoutes.get('/', checkPermissions(["read"]), getAllUser)
userRoutes.get('/', getAllUser)

userRoutes.delete("/", deleteUser)

userRoutes.delete("/all", deleteAllUsers)

export default userRoutes;

