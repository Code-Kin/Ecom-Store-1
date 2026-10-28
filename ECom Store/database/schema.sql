-- =====================================================================
-- Sarah's Boutique — MySQL schema + demo data (South Africa, ZAR)
-- Import:  mysql -u root -p < database/schema.sql
-- All money columns are stored in CENTS (e.g. 134900 = R1,349.00).
-- Prices are VAT-inclusive (15% South African VAT).
-- =====================================================================
CREATE DATABASE IF NOT EXISTS sarahs_boutique CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sarahs_boutique;

DROP TABLE IF EXISTS order_items, orders, messages, products, users;

-- Customers + administrators (role-based permissions)
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,           -- password_hash() / bcrypt
  role          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  phone         VARCHAR(40)  NULL,
  address       VARCHAR(255) NULL,
  city          VARCHAR(120) NULL,
  postal_code   VARCHAR(10)  NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE products (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(190) NOT NULL,
  description      TEXT NOT NULL,
  price_cents      INT NOT NULL,
  compare_at_cents INT NULL,                      -- original price when on sale
  category         ENUM('Dresses','Tops','Bottoms','Outerwear','Accessories') NOT NULL DEFAULT 'Dresses',
  image_url        VARCHAR(500) NOT NULL DEFAULT '',
  stock            INT NOT NULL DEFAULT 0,
  sizes            VARCHAR(60) NOT NULL DEFAULT 'XS,S,M,L,XL',
  featured         TINYINT(1) NOT NULL DEFAULT 0,
  is_active        TINYINT(1) NOT NULL DEFAULT 1,
  rating           DECIMAL(2,1) NOT NULL DEFAULT 4.5,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  FULLTEXT idx_search (name, description)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT NULL,
  status             ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  payment_status     ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  subtotal_cents     INT NOT NULL,
  shipping_cents     INT NOT NULL DEFAULT 0,
  vat_cents          INT NOT NULL DEFAULT 0,        -- VAT portion included in the total
  total_cents        INT NOT NULL,
  customer_email     VARCHAR(190) NOT NULL,
  shipping_name      VARCHAR(120) NOT NULL,
  shipping_address   VARCHAR(255) NOT NULL,
  shipping_city      VARCHAR(120) NOT NULL,
  shipping_province  VARCHAR(60)  NOT NULL,
  shipping_postal    VARCHAR(10)  NOT NULL,
  stripe_session_id  VARCHAR(255) NULL,
  stripe_payment_id  VARCHAR(255) NULL,
  card_brand         VARCHAR(20)  NULL,             -- visa | mastercard
  card_last4         CHAR(4)      NULL,
  tracking_number    VARCHAR(60)  NULL,
  notes              TEXT NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT NOT NULL,
  product_id    INT NULL,
  product_name  VARCHAR(190) NOT NULL,             -- snapshot at time of purchase
  product_image VARCHAR(500) NOT NULL DEFAULT '',
  size          VARCHAR(10) NOT NULL DEFAULT 'M',
  quantity      INT NOT NULL,
  price_cents   INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Contact form + customer feedback
CREATE TABLE messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(190) NOT NULL,
  subject    VARCHAR(200) NOT NULL DEFAULT '',
  message    TEXT NOT NULL,
  type       ENUM('contact','feedback') NOT NULL DEFAULT 'contact',
  rating     TINYINT NULL,
  status     ENUM('new','read','replied','archived') NOT NULL DEFAULT 'new',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Demo data. Passwords: admin123 (admins) / password123 (customers)
-- CHANGE THESE before going live.
-- ---------------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role, phone, address, city, postal_code) VALUES
('Sarah Mitchell', 'admin@sarahsboutique.co.za', '$2y$10$SyedxT5Aa8Jfw4BilUz8CeHsb2iG3ZM.lqizV9sWm8NERyfjPlCeW', 'admin', '+27 21 422 0198', '84 Kloof Street, Gardens', 'Cape Town', '8001'),
('Emma Sullivan', 'emma@example.co.za', '$2y$10$AaWd4hLapLO51GlSuboGT.ijJ.JUAgmM9S9pb0so9lnZB/8/gg1ri', 'customer', '+27 82 201 8890', '48 Bree Street', 'Cape Town', '8001'),
('Olivia Bennett', 'olivia@example.co.za', '$2y$10$AaWd4hLapLO51GlSuboGT.ijJ.JUAgmM9S9pb0so9lnZB/8/gg1ri', 'customer', '+27 83 332 1174', '9 Beach Road', 'Sea Point', '8005'),
('Sophia Carter', 'sophia@example.co.za', '$2y$10$AaWd4hLapLO51GlSuboGT.ijJ.JUAgmM9S9pb0so9lnZB/8/gg1ri', 'customer', '+27 72 410 6632', '77 Jan Smuts Ave', 'Johannesburg', '2196');

INSERT INTO products (name, description, price_cents, compare_at_cents, category, image_url, stock, featured, rating) VALUES
('Rosalind Floral Midi Dress', 'Our signature garden-party midi in breathable cotton voile with a smocked bodice and twirl-approved skirt.', 134900, 179900, 'Dresses', 'https://images.pexels.com/photos/2859118/pexels-photo-2859118.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800', 14, 1, 4.9),
('Gingham Picnic Sundress', 'A sun-chasing sleeveless sundress with a flattering square neckline and pockets.', 99900, NULL, 'Dresses', 'https://images.pexels.com/photos/6181955/pexels-photo-6181955.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800', 22, 1, 4.8),
('Vintage Polka Dot Swing Dress', 'Retro fit-and-flare swing dress with a nipped waist and full skirt.', 119900, NULL, 'Dresses', 'https://images.pexels.com/photos/35027340/pexels-photo-35027340.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800', 9, 0, 4.7),
('Noir Evening Slip Dress', 'Bias-cut slip dress in lustrous black satin. Dress it up or down.', 144900, 189900, 'Dresses', 'https://images.pexels.com/photos/27288209/pexels-photo-27288209.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800', 7, 1, 4.9),
('Blossom Garden Maxi', 'Floor-length maxi with flutter sleeves and a flowing silhouette.', 139900, NULL, 'Dresses', 'https://images.pexels.com/photos/27857608/pexels-photo-27857608.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800', 11, 0, 4.6),
('Cloudspun Cream Knit Sweater', 'Ultra-soft knit that feels like a hug — perfect for Highveld winters.', 94900, NULL, 'Tops', 'https://images.pexels.com/photos/14642651/pexels-photo-14642651.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800', 25, 1, 4.9),
('Harvest Oatmeal Pullover', 'Relaxed pullover in a chunky-yet-light knit.', 84900, NULL, 'Tops', 'https://images.pexels.com/photos/5789005/pexels-photo-5789005.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800', 19, 0, 4.7),
('Cozy Cabin Turtleneck', 'Brushed-knit turtleneck that never itches.', 79900, 99900, 'Tops', 'https://images.pexels.com/photos/6996083/pexels-photo-6996083.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800', 30, 0, 4.6),
('High-Rise Vintage Straight Jean', 'Broken-in straight leg with a high rise and just-right stretch.', 114900, NULL, 'Bottoms', 'https://images.pexels.com/photos/19238449/pexels-photo-19238449.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800', 16, 0, 4.7),
('Downtown Denim Mini Skirt', 'Playful A-line mini in sturdy stretch denim.', 79900, NULL, 'Bottoms', 'https://images.pexels.com/photos/28166398/pexels-photo-28166398.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800', 13, 0, 4.5),
('Classic Indigo Trucker Jacket', 'The forever jacket in rinsed indigo denim with brass buttons.', 129900, NULL, 'Outerwear', 'https://images.pexels.com/photos/30526284/pexels-photo-30526284.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800', 10, 1, 4.9),
('Double-Denim Western Set', 'Cropped western jacket + matching straight jean.', 174900, 219900, 'Outerwear', 'https://images.pexels.com/photos/19238454/pexels-photo-19238454.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800', 6, 0, 4.8),
('Sienna Leather Carryall', 'Full-grain leather carryall with a hand-tied silk scarf.', 189900, 239900, 'Accessories', 'https://images.pexels.com/photos/29096397/pexels-photo-29096397.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', 8, 1, 5.0),
('Evergreen Mini Handbag', 'Jewel-box mini in deep evergreen with scarf-wrapped handles.', 144900, NULL, 'Accessories', 'https://images.pexels.com/photos/11031118/pexels-photo-11031118.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', 6, 0, 4.9);

INSERT INTO messages (name, email, subject, message, type, rating, status) VALUES
('Jenny Park', 'jenny@example.co.za', 'Sizing help', 'I am between a small and medium — does the Rosalind bodice stretch?', 'contact', NULL, 'new'),
('Rachel Kim', 'rachel@example.co.za', 'Love my order!', 'The Cloudspun sweater is the softest thing I own. Delivery to Durban was so quick!', 'feedback', 5, 'new');
