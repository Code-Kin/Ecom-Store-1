// Sarah's Boutique — Database schema (PostgreSQL via Drizzle ORM)
// Tables: users, products, orders, order_items, cart_items, messages, reviews
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  real,
} from "drizzle-orm/pg-core";

// ─── Users (customers + admins) ──────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("customer"), // customer | admin
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  zip: text("zip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Products ────────────────────────────────────────────────────────────────
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  priceCents: integer("price_cents").notNull(),
  compareAtCents: integer("compare_at_cents"),
  category: text("category").notNull().default("Dresses"), // Dresses, Tops, Bottoms, Outerwear, Accessories
  imageUrl: text("image_url").notNull().default(""),
  stock: integer("stock").notNull().default(0),
  sizes: text("sizes").notNull().default("XS,S,M,L,XL"),
  featured: boolean("featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  rating: real("rating").notNull().default(4.5),
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Orders ──────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending | processing | shipped | delivered | cancelled
  totalCents: integer("total_cents").notNull(),
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  shippingCents: integer("shipping_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  shippingName: text("shipping_name").notNull().default(""),
  shippingAddress: text("shipping_address").notNull().default(""),
  shippingCity: text("shipping_city").notNull().default(""),
  shippingZip: text("shipping_zip").notNull().default(""),
  customerEmail: text("customer_email").notNull().default(""),
  paymentMethod: text("payment_method").notNull().default("card"),
  paymentStatus: text("payment_status").notNull().default("paid"), // pending | paid | failed | refunded
  trackingNumber: text("tracking_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Order items (snapshot of product at purchase time) ──────────────────────
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  productImage: text("product_image").notNull().default(""),
  quantity: integer("quantity").notNull(),
  priceCents: integer("price_cents").notNull(),
  size: text("size").notNull().default("M"),
});

// ─── Cart items (per logged-in user) ─────────────────────────────────────────
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  quantity: integer("quantity").notNull().default(1),
  size: text("size").notNull().default("M"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Contact + feedback messages ─────────────────────────────────────────────
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull(),
  type: text("type").notNull().default("contact"), // contact | feedback
  status: text("status").notNull().default("new"), // new | read | replied | archived
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Product reviews ─────────────────────────────────────────────────────────
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  userId: integer("user_id").references(() => users.id),
  userName: text("user_name").notNull().default("Guest"),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Types ───────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Review = typeof reviews.$inferSelect;
