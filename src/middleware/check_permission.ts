import { verify } from "hono/jwt";

const rolesPermissions = {
    admin: ['create', 'read', 'update', 'delete'],
    casher: ['create', 'read', 'update']
};
export const checkAuth = () => {
    return async (c: any, next: () => any) => {
        const authHeader = c.req.header("Authorization") ?? "";
        const token = authHeader.split(" ")[1];

        if (!token) {
            c.status(401);
            return c.json({ message: 'Unauthorized' });
            //throw new HTTPException(401, { message: "Unauthorized" });
        }
        try {
            await verify(token, "jwt-secret");

            await next();
        } catch (e) {
            c.status(401);
            return c.json({ message: 'Unauthorized' });
        }
        //const decoded = decode(token);
    };
}
// export const checkPermissions = (requiredPermissions: string[]) => {
//     return async (c: any, next: () => any) => {
//         const authHeader = c.req.header("Authorization") ?? "";
//         const token = authHeader.split(" ")[1];

//         if (!token) {
//             c.status(401);
//             return c.json({ message: 'Unauthorized' });
//             //throw new HTTPException(401, { message: "Unauthorized" });
//         }
//         try {
//             const verifyToken = await verify(token, "jwt-secret");

//             const userRole = verifyToken.role;
//             if (!userRole || !rolesPermissions[(userRole as keyof typeof rolesPermissions)]) {
//                 c.status(403);
//                 return c.json({ message: 'User Role and Permission not found' });
//             }

//             const userPermissions = rolesPermissions[(userRole as keyof typeof rolesPermissions)];
//             const hasPermission = requiredPermissions.every(permission => userPermissions.includes(permission));

//             if (!hasPermission) {
//                 c.status(403);
//                 return c.json({ message: 'User not have permission' });
//             }

//             await next();
//         } catch (e) {
//             c.status(401);
//             return c.json({ message: 'Unauthorized' });
//         }
//         //const decoded = decode(token);
//     };
//};




