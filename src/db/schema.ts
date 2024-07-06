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
    inventoryInTransactions: many(inventoryInTransactions),
    inventoryOutTransactions: many(inventoryOutTransactions)
}));

export const products = sqliteTable("products", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    barcode: text("barcode", { length: 256 }),
    description: text("description"),
    imageUrl: text("image_url", { length: 256 }),
    tabletOnCard: integer("tablet_on_card"),
    cardOnBox: integer("card_on_box"),
    isLocalProduct: integer('is_local_product', { mode: 'boolean' }),
    unitId: integer("unit_id").references(() => units.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
    unit: one(units, {
        fields: [products.unitId],
        references: [units.id]
    }),
    productCategories: many(productCategories),
    inventoryInTransactionDetails: many(inventoryInTransactionDetails),
    inventoryStocks: many(inventoryStocks),
    inventoryOutTransactionDetails: many(inventoryOutTransactionDetails),
    storeStocks: many(storeStocks),
}));


export const units = sqliteTable("units", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const unitsRelations = relations(units, ({ many }) => ({
    products: many(products)
}));


export const category = sqliteTable("category", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
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


export const locations = sqliteTable("locations", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    city: text("city", { length: 256 }),
    state: text("state", { length: 256 }),
    address: text("address", { length: 256 }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const locationRelations = relations(locations, ({ many }) => ({
    warehouses: many(warehouses),
    stores: many(stores),
    suppliers: many(suppliers)
}));

export const warehouses = sqliteTable("warehouses", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    description: text("description", { length: 256 }),
    locationId: integer("location_id").references(() => locations.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
    location: one(locations, {
        fields: [warehouses.locationId],
        references: [locations.id]
    }),
    inventoryInTransactions: many(inventoryInTransactions),
    inventoryStocks: many(inventoryStocks)
}));

export const stores = sqliteTable("stores", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    description: text("description", { length: 256 }),
    locationId: integer("location_id").references(() => locations.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const storesRelations = relations(stores, ({ one }) => ({
    location: one(locations, {
        fields: [stores.locationId],
        references: [locations.id]
    })
}));

export const suppliers = sqliteTable("suppliers", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    description: text("description", { length: 256 }),
    locationId: integer("location_id").references(() => locations.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
    location: one(locations, {
        fields: [suppliers.locationId],
        references: [locations.id]
    }),
    inventoryInTransactions: many(inventoryInTransactions)
}));

export const inventoryInTransactions = sqliteTable("inventoryInTransactions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    transactionDate: integer("transaction_date"),
    description: text("description", { length: 256 }),
    invoiceNumber: text("invoice_number", { length: 256 }),
    warehouseId: integer("warehouse_id").references(() => warehouses.id),
    supplierId: integer("supplier_id").references(() => suppliers.id),
    userId: integer("user_id").references(() => users.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const inventoryInTransactionsRelations = relations(inventoryInTransactions, ({ one, many }) => ({
    warehouse: one(warehouses, {
        fields: [inventoryInTransactions.warehouseId],
        references: [warehouses.id]
    }),
    supplier: one(suppliers, {
        fields: [inventoryInTransactions.supplierId],
        references: [suppliers.id]
    }),
    userId: one(users, {
        fields: [inventoryInTransactions.userId],
        references: [users.id]
    }),
    inventoryInTransactionDetails: many(inventoryInTransactionDetails)
}));

export const inventoryInTransactionDetails = sqliteTable("inventoryInTransactionDetails", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    qty: integer("qty"),
    purchasePrice: integer("purchase_price"),
    sellingPrice: integer("selling_price"),
    transactionId: integer("transaction_id").references(() => inventoryInTransactions.id),
    productId: integer("product_id").references(() => products.id),
    expireDate: integer("expire_date"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const inventoryInTransactionDetailRelations = relations(inventoryInTransactionDetails, ({ one }) => ({
    transaction: one(inventoryInTransactions, {
        fields: [inventoryInTransactionDetails.transactionId],
        references: [inventoryInTransactions.id]
    }),
    product: one(products, {
        fields: [inventoryInTransactionDetails.productId],
        references: [products.id]
    })
}));


export const inventoryStocks = sqliteTable("inventoryStocks", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    qtyInStock: integer("qty_instock").notNull(),
    unitPrice: integer("unit_price"),
    lowStockAlert: integer("low_stock_alert"),
    warehouseId: integer("warehouse_id").references(() => warehouses.id),
    productId: integer("product_id").references(() => products.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const inventoryStockRelations = relations(inventoryStocks, ({ one, many }) => ({
    warehouse: one(warehouses, {
        fields: [inventoryStocks.warehouseId],
        references: [warehouses.id]
    }),
    product: one(products, {
        fields: [inventoryStocks.productId],
        references: [products.id]
    }),
    inventoryStockDetails: many(inventoryStockDetails)
}));

export const inventoryStockDetails = sqliteTable("inventoryStockDetails", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    qty: integer("qty").notNull(),
    purchasePrice: integer("purchase_price"),
    sellingPrice: integer("selling_price"),
    inventoryStockId: integer("inventory_stock_id").references(() => inventoryStocks.id),
    expireDate: integer("expire_date"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const inventoryStockDetailRelations = relations(inventoryStockDetails, ({ one }) => ({
    inventoryStock: one(inventoryStocks, {
        fields: [inventoryStockDetails.inventoryStockId],
        references: [inventoryStocks.id]
    }),

}));

export const inventoryOutTransactions = sqliteTable("inventoryOutTransactions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    transactionDate: integer("transaction_date"),
    description: text("description", { length: 256 }),
    invoiceNumber: text("invoice_number", { length: 256 }),
    warehouseId: integer("warehouse_id").references(() => warehouses.id),
    userId: integer("user_id").references(() => users.id),
    storeId: integer("store_id").references(() => stores.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const inventoryOutTransactionsRelations = relations(inventoryOutTransactions, ({ one, many }) => ({
    warehouse: one(warehouses, {
        fields: [inventoryOutTransactions.warehouseId],
        references: [warehouses.id]
    }),
    store: one(stores, {
        fields: [inventoryOutTransactions.storeId],
        references: [stores.id]
    }),
    userId: one(users, {
        fields: [inventoryOutTransactions.userId],
        references: [users.id]
    }),
    inventoryOutTransactionDetails: many(inventoryOutTransactionDetails)
}));

export const inventoryOutTransactionDetails = sqliteTable("inventoryOutTransactionDetails", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    qty: integer("qty"),
    purchasePrice: integer("purchase_price"),
    sellingPrice: integer("selling_price"),
    transactionId: integer("transaction_id").references(() => inventoryOutTransactions.id),
    productId: integer("product_id").references(() => products.id),
    expireDate: integer("expire_date"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const inventoryOutTransactionDetailRelations = relations(inventoryOutTransactionDetails, ({ one }) => ({
    transaction: one(inventoryOutTransactions, {
        fields: [inventoryOutTransactionDetails.transactionId],
        references: [inventoryOutTransactions.id]
    }),
    product: one(products, {
        fields: [inventoryOutTransactionDetails.productId],
        references: [products.id]
    })
}));


export const storeStocks = sqliteTable("storeStocks", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    qtyInStock: integer("qty_instock").notNull(),
    unitPrice: integer("unit_price"),
    lowStockAlert: integer("low_stock_alert"),
    storeId: integer("store_id").references(() => stores.id),
    productId: integer("product_id").references(() => products.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const storeStockRelations = relations(storeStocks, ({ one, many }) => ({
    store: one(stores, {
        fields: [storeStocks.storeId],
        references: [stores.id]
    }),
    product: one(products, {
        fields: [storeStocks.productId],
        references: [products.id]
    }),
    storeStockDetails: many(storeStockDetails)
}));

export const storeStockDetails = sqliteTable("storeStockDetails", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    qty: integer("qty").notNull(),
    purchasePrice: integer("purchase_price"),
    sellingPrice: integer("selling_price"),
    storeStockId: integer("store_stock_id").references(() => storeStocks.id),
    expireDate: integer("expire_date"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
});

export const storeStockDetailRelations = relations(storeStockDetails, ({ one }) => ({
    storeStock: one(storeStocks, {
        fields: [storeStockDetails.storeStockId],
        references: [storeStocks.id]
    }),
}));

