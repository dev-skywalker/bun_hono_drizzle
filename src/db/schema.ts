import { relations } from 'drizzle-orm';
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    role: text('role').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
    sales: many(sales),
}));

export const products = sqliteTable("products", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    barcode: text("barcode", { length: 256 }),
    description: text("description"),
    productCost: integer('product_cost'),
    productPrice: integer('product_price'),
    stockAlert: integer('stock_alert'),
    quantityLimit: integer('quantity_limit'),
    expireDate: integer('expire_date'),
    imageUrl: text("image_url", { length: 256 }),
    tabletOnCard: integer("tablet_on_card"),
    cardOnBox: integer("card_on_box"),
    isLocalProduct: integer('is_local_product', { mode: 'boolean' }),
    unitId: integer("unit_id").references(() => units.id),
    brandId: integer("brand_id").references(() => brands.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
    unit: one(units, {
        fields: [products.unitId],
        references: [units.id]
    }),
    brand: one(brands, {
        fields: [products.brandId],
        references: [brands.id]
    }),
    productCategories: many(productCategories),
    purchaseItems: many(purchaseItems),
    manageStocks: many(manageStocks),
    saleItems: many(saleItems),
    transferItems: many(transferItems)
}));


export const units = sqliteTable("units", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    description: text("description", { length: 256 }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const unitsRelations = relations(units, ({ many }) => ({
    products: many(products)
}));

export const brands = sqliteTable("brands", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    description: text("description", { length: 256 }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const brandsRelations = relations(brands, ({ many }) => ({
    products: many(products)
}));


export const category = sqliteTable("category", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    description: text("description", { length: 256 }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const categoryRelations = relations(category, ({ many }) => ({
    productCategories: many(productCategories)
}));

export const productCategories = sqliteTable("productCategories", {
    productId: integer('product_id').notNull().references(() => products.id),
    categoryId: integer('category_id').notNull().references(() => category.id),
}, (t) => ({
    pk: primaryKey({ columns: [t.productId, t.categoryId] }),
}),
);

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
    category: one(category, {
        fields: [productCategories.categoryId],
        references: [category.id]
    }),
    product: one(products, {
        fields: [productCategories.productId],
        references: [products.id]
    })
}));

export const warehouses = sqliteTable("warehouses", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    phone: text("phone", { length: 256 }),
    email: text("email", { length: 256 }),
    city: text("city", { length: 256 }),
    address: text("address", { length: 256 }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const warehousesRelations = relations(warehouses, ({ many }) => ({
    purchases: many(purchases),
    manageStocks: many(manageStocks),
    sales: many(sales),
    toTransfer: many(transfers),
    fromTransfer: many(transfers),
}));

export const suppliers = sqliteTable("suppliers", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    phone: text("phone", { length: 256 }),
    email: text("email", { length: 256 }),
    city: text("city", { length: 256 }),
    address: text("address", { length: 256 }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const suppliersRelations = relations(suppliers, ({ many }) => ({
    purchases: many(purchases)
}));

export const customers = sqliteTable("customers", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    phone: text("phone", { length: 256 }),
    email: text("email", { length: 256 }),
    city: text("city", { length: 256 }),
    address: text("address", { length: 256 }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const customersRelations = relations(customers, ({ many }) => ({
    sales: many(sales)
}));


export const purchases = sqliteTable("purchases", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: integer("date").notNull(),
    refCode: text("ref_code", { length: 256 }),
    note: text("note", { length: 256 }),
    status: integer("status").notNull(),
    amount: integer("amount").notNull(),
    shipping: integer("shipping").notNull(),
    warehouseId: integer("warehouse_id").references(() => warehouses.id),
    supplierId: integer("supplier_id").references(() => suppliers.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
    warehouse: one(warehouses, {
        fields: [purchases.warehouseId],
        references: [warehouses.id]
    }),
    supplier: one(suppliers, {
        fields: [purchases.supplierId],
        references: [suppliers.id]
    }),
    purchaseItems: many(purchaseItems),
}));

export const purchaseItems = sqliteTable("purchaseItems", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    quantity: integer("quantity").notNull(),
    productCost: integer("product_cost").notNull(),
    subTotal: integer("sub_total").notNull(),
    productId: integer("product_id").references(() => products.id),
    purchaseId: integer("purchase_id").references(() => purchases.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
    product: one(products, {
        fields: [purchaseItems.productId],
        references: [products.id]
    }),
    purchase: one(purchases, {
        fields: [purchaseItems.purchaseId],
        references: [purchases.id]
    })
}));

export const manageStocks = sqliteTable("manageStocks", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    quantity: integer("quantity").notNull(),
    alert: integer("alert").notNull(),
    productId: integer("product_id").references(() => products.id),
    warehouseId: integer("warehouse_id").references(() => warehouses.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const manageStocksRelations = relations(manageStocks, ({ one }) => ({
    product: one(products, {
        fields: [manageStocks.productId],
        references: [products.id]
    }),
    warehouse: one(warehouses, {
        fields: [manageStocks.warehouseId],
        references: [warehouses.id]
    }),
}));

export const sales = sqliteTable("sales", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: integer("date").notNull(),
    note: text("note", { length: 256 }),
    status: integer("status").notNull(),
    amount: integer("amount").notNull(),
    shipping: integer("shipping").notNull(),
    warehouseId: integer("warehouse_id").references(() => warehouses.id),
    userId: integer("user_id").references(() => users.id),
    customerId: integer("customer_id").references(() => customers.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const salesRelations = relations(sales, ({ one, many }) => ({
    warehouse: one(warehouses, {
        fields: [sales.warehouseId],
        references: [warehouses.id]
    }),
    customer: one(customers, {
        fields: [sales.customerId],
        references: [customers.id]
    }),
    user: one(users, {
        fields: [sales.userId],
        references: [users.id]
    }),
    saleItems: many(saleItems),
}));

export const saleItems = sqliteTable("saleItems", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    quantity: integer("quantity").notNull(),
    productPrice: integer("product_price").notNull(),
    subTotal: integer("sub_total").notNull(),
    productId: integer("product_id").references(() => products.id),
    saleId: integer("sale_id").references(() => sales.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
    product: one(products, {
        fields: [saleItems.productId],
        references: [products.id]
    }),
    sale: one(sales, {
        fields: [saleItems.saleId],
        references: [sales.id]
    })
}));

export const transfers = sqliteTable("transfers", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: integer("date").notNull(),
    note: text("note", { length: 256 }),
    status: integer("status").notNull(),
    amount: integer("amount").notNull(),
    shipping: integer("shipping").notNull(),
    fromWarehouseId: integer("from_warehouse_id").references(() => warehouses.id),
    toWarehouseId: integer("to_warehouse_id").references(() => warehouses.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const transfersRelations = relations(transfers, ({ one, many }) => ({
    fromWarehouse: one(warehouses, {
        fields: [transfers.fromWarehouseId],
        references: [warehouses.id]
    }),
    toWarehouse: one(warehouses, {
        fields: [transfers.toWarehouseId],
        references: [warehouses.id]
    }),
    transferItems: many(transferItems),
}));

export const transferItems = sqliteTable("transferItems", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    quantity: integer("quantity").notNull(),
    productPrice: integer("product_price").notNull(),
    subTotal: integer("sub_total").notNull(),
    productId: integer("product_id").references(() => products.id),
    transferId: integer("transfer_id").references(() => transfers.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const transferItemsRelations = relations(transferItems, ({ one }) => ({
    product: one(products, {
        fields: [transferItems.productId],
        references: [products.id]
    }),
    transferId: one(transfers, {
        fields: [transferItems.transferId],
        references: [transfers.id]
    })
}));

