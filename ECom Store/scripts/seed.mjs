// Seed script for Sarah's Boutique — run with: node scripts/seed.mjs
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
});

const IMG = {
  floralMidi: "https://images.pexels.com/photos/2859118/pexels-photo-2859118.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  gingham: "https://images.pexels.com/photos/6181955/pexels-photo-6181955.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  polkaSwing: "https://images.pexels.com/photos/35027340/pexels-photo-35027340.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  noirSlip: "https://images.pexels.com/photos/27288209/pexels-photo-27288209.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  gardenMaxi: "https://images.pexels.com/photos/27857608/pexels-photo-27857608.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  cityMuse: "https://images.pexels.com/photos/19300110/pexels-photo-19300110.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  goldenPrint: "https://images.pexels.com/photos/934698/pexels-photo-934698.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  twilight: "https://images.pexels.com/photos/27288210/pexels-photo-27288210.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  cloudKnit: "https://images.pexels.com/photos/14642651/pexels-photo-14642651.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  oatmeal: "https://images.pexels.com/photos/5789005/pexels-photo-5789005.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  cardigan: "https://images.pexels.com/photos/14641596/pexels-photo-14641596.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  turtleneck: "https://images.pexels.com/photos/6996083/pexels-photo-6996083.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  straightJean: "https://images.pexels.com/photos/19238449/pexels-photo-19238449.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  trucker: "https://images.pexels.com/photos/30526284/pexels-photo-30526284.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  denimMini: "https://images.pexels.com/photos/28166398/pexels-photo-28166398.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  doubleDenim: "https://images.pexels.com/photos/19238454/pexels-photo-19238454.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  denimShirt: "https://images.pexels.com/photos/35784925/pexels-photo-35784925.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  carryall: "https://images.pexels.com/photos/29096397/pexels-photo-29096397.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  miniBag: "https://images.pexels.com/photos/11031118/pexels-photo-11031118.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  giftSet: "https://images.pexels.com/photos/322207/pexels-photo-322207.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
};

const PRODUCTS = [
  { name: "Rosalind Floral Midi Dress", description: "Our signature garden-party midi in breathable cotton voile with a smocked bodice and twirl-approved skirt. Sarah's personal favorite for spring weddings.", priceCents: 8900, compareAtCents: 12000, category: "Dresses", imageUrl: IMG.floralMidi, stock: 14, featured: true, rating: 4.9, reviewCount: 46 },
  { name: "Gingham Picnic Sundress", description: "A sun-chasing sleeveless sundress with a flattering square neckline and pockets (yes, pockets!). Pairs perfectly with a straw hat and sandals.", priceCents: 6800, compareAtCents: null, category: "Dresses", imageUrl: IMG.gingham, stock: 22, featured: true, rating: 4.8, reviewCount: 31 },
  { name: "Vintage Polka Dot Swing Dress", description: "Channel retro charm in this fit-and-flare swing dress with a nipped waist and full skirt. A boutique bestseller three seasons running.", priceCents: 7900, compareAtCents: null, category: "Dresses", imageUrl: IMG.polkaSwing, stock: 9, featured: false, rating: 4.7, reviewCount: 28 },
  { name: "Noir Evening Slip Dress", description: "Effortlessly elegant bias-cut slip dress in lustrous black satin. Dress it up with heels or down with a denim jacket — it never misses.", priceCents: 9800, compareAtCents: 12800, category: "Dresses", imageUrl: IMG.noirSlip, stock: 7, featured: true, rating: 4.9, reviewCount: 52 },
  { name: "Blossom Garden Maxi", description: "A dreamy floor-length maxi with flutter sleeves and a flowing silhouette. Made for golden-hour photos and slow summer evenings.", priceCents: 9400, compareAtCents: null, category: "Dresses", imageUrl: IMG.gardenMaxi, stock: 11, featured: false, rating: 4.6, reviewCount: 19 },
  { name: "City Muse Polka Dress", description: "Polka dots meet city polish. A structured midi with a modest neckline and swishy hem that works from office to dinner.", priceCents: 8400, compareAtCents: null, category: "Dresses", imageUrl: IMG.cityMuse, stock: 5, featured: false, rating: 4.7, reviewCount: 22 },
  { name: "Golden Hour Printed Dress", description: "A warm, artful print on soft crepe with a relaxed fit and side slit. Throw on and go — instant put-together.", priceCents: 7600, compareAtCents: null, category: "Dresses", imageUrl: IMG.goldenPrint, stock: 18, featured: false, rating: 4.5, reviewCount: 14 },
  { name: "Twilight Satin Dress", description: "After-dark glamour in deep-hued satin with delicate straps and a cowl back. Limited holiday run — when it's gone, it's gone.", priceCents: 10800, compareAtCents: null, category: "Dresses", imageUrl: IMG.twilight, stock: 4, featured: false, rating: 5.0, reviewCount: 9 },
  { name: "Cloudspun Cream Knit Sweater", description: "Spun from an ultra-soft knit that feels like a hug. A cozy neutral that layers over everything from slip skirts to straight-leg jeans.", priceCents: 6400, compareAtCents: null, category: "Tops", imageUrl: IMG.cloudKnit, stock: 25, featured: true, rating: 4.9, reviewCount: 61 },
  { name: "Harvest Oatmeal Pullover", description: "A relaxed oatmeal pullover in a chunky-yet-light knit. The sweater our regulars buy in every color.", priceCents: 5800, compareAtCents: null, category: "Tops", imageUrl: IMG.oatmeal, stock: 19, featured: false, rating: 4.7, reviewCount: 33 },
  { name: "Heirloom Button Cardigan", description: "A heritage-inspired cardigan with horn-style buttons and patch pockets. Soft, structured, and endlessly giftable.", priceCents: 7200, compareAtCents: null, category: "Tops", imageUrl: IMG.cardigan, stock: 12, featured: false, rating: 4.8, reviewCount: 25 },
  { name: "Cozy Cabin Turtleneck", description: "Our bestselling turtleneck in a brushed knit that never itches. Stay warm without the bulk.", priceCents: 5400, compareAtCents: 6800, category: "Tops", imageUrl: IMG.turtleneck, stock: 30, featured: false, rating: 4.6, reviewCount: 40 },
  { name: "High-Rise Vintage Straight Jean", description: "A perfectly broken-in straight leg with a high rise and just-right stretch. Cut for real bodies, sizes XS–XL.", priceCents: 7800, compareAtCents: null, category: "Bottoms", imageUrl: IMG.straightJean, stock: 16, featured: false, rating: 4.7, reviewCount: 37 },
  { name: "Classic Indigo Trucker Jacket", description: "The forever jacket in rinsed indigo denim with brass buttons. Softens beautifully with every wear.", priceCents: 8800, compareAtCents: null, category: "Outerwear", imageUrl: IMG.trucker, stock: 10, featured: true, rating: 4.9, reviewCount: 44 },
  { name: "Downtown Denim Mini Skirt", description: "A playful A-line mini in sturdy stretch denim. Style with tights and boots or bare legs and sneakers.", priceCents: 5200, compareAtCents: null, category: "Bottoms", imageUrl: IMG.denimMini, stock: 13, featured: false, rating: 4.5, reviewCount: 16 },
  { name: "Double-Denim Western Set", description: "A head-to-toe denim moment: cropped western jacket + matching straight jean. Wear together or split up.", priceCents: 11800, compareAtCents: 14800, category: "Outerwear", imageUrl: IMG.doubleDenim, stock: 6, featured: false, rating: 4.8, reviewCount: 12 },
  { name: "Riviera Relaxed Denim Shirt", description: "An easy, slouchy chambray shirt that works open over tanks or tucked into skirts. Pre-washed for softness.", priceCents: 6200, compareAtCents: null, category: "Tops", imageUrl: IMG.denimShirt, stock: 20, featured: false, rating: 4.6, reviewCount: 18 },
  { name: "Sienna Leather Carryall", description: "Full-grain leather carryall with a hand-tied silk scarf. Fits a 13\" laptop, water bottle, and all the little extras.", priceCents: 12800, compareAtCents: 16000, category: "Accessories", imageUrl: IMG.carryall, stock: 8, featured: true, rating: 5.0, reviewCount: 27 },
  { name: "Evergreen Mini Handbag", description: "A jewel-box mini in deep evergreen with scarf-wrapped handles. Small bag, big compliment energy.", priceCents: 9800, compareAtCents: null, category: "Accessories", imageUrl: IMG.miniBag, stock: 6, featured: false, rating: 4.9, reviewCount: 15 },
  { name: "Weekender Leather Gift Set", description: "Our curated travel set: leather weekender, card case, and canvas pouch in a keepsake boutique box. The ultimate gift.", priceCents: 14800, compareAtCents: null, category: "Accessories", imageUrl: IMG.giftSet, stock: 5, featured: false, rating: 4.9, reviewCount: 11 },
];

async function main() {
  const client = await pool.connect();
  try {
    console.log("Truncating tables...");
    await client.query("TRUNCATE users, products, orders, order_items, cart_items, messages, reviews RESTART IDENTITY CASCADE");

    console.log("Seeding users...");
    const adminHash = await bcrypt.hash("admin123", 10);
    const custHash = await bcrypt.hash("password123", 10);
    const staffHash = await bcrypt.hash("staff123", 10);

    const usersRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role, phone, address, city, zip)
       VALUES
        ('Sarah Mitchell', 'admin@sarahsboutique.com', $1, 'admin', '(555) 014-2288', '212 Rosewater Lane', 'Maplewood', '04055'),
        ('Grace Mitchell', 'grace@sarahsboutique.com', $2, 'admin', '(555) 014-2290', '212 Rosewater Lane', 'Maplewood', '04055'),
        ('Emma Sullivan', 'emma@example.com', $3, 'customer', '(555) 201-8890', '48 Birch Street', 'Portland', '04101'),
        ('Olivia Bennett', 'olivia@example.com', $3, 'customer', '(555) 332-1174', '9 Harbor View Ave', 'Portland', '04102'),
        ('Sophia Carter', 'sophia@example.com', $3, 'customer', '(555) 410-6632', '77 Elm Court', 'Brunswick', '04011'),
        ('Ava Reynolds', 'ava@example.com', $3, 'customer', '(555) 902-4418', '15 Meadowbrook Rd', 'Freeport', '04032'),
        ('Mia Thompson', 'mia@example.com', $3, 'customer', '(555) 118-2077', '303 Ocean Bluff Dr', 'Yarmouth', '04096')
       RETURNING id, email`,
      [adminHash, staffHash, custHash]
    );
    const userByEmail = Object.fromEntries(usersRes.rows.map((r) => [r.email, r.id]));

    console.log("Seeding products...");
    const productIds = [];
    for (const p of PRODUCTS) {
      const r = await client.query(
        `INSERT INTO products (name, description, price_cents, compare_at_cents, category, image_url, stock, sizes, featured, is_active, rating, review_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'XS,S,M,L,XL',$8,true,$9,$10) RETURNING id`,
        [p.name, p.description, p.priceCents, p.compareAtCents, p.category, p.imageUrl, p.stock, p.featured, p.rating, p.reviewCount]
      );
      productIds.push({ id: r.rows[0].id, ...p });
    }
    const P = (i) => productIds[i]; // 0-based index into PRODUCTS

    console.log("Seeding orders...");
    const now = Date.now();
    const day = 86400000;
    // [daysAgo, customerEmail, status, [[productIdx, qty, size], ...], city]
    const ORDER_PLAN = [
      [0, "emma@example.com", "processing", [[0, 1, "M"], [8, 1, "S"]]],
      [1, "olivia@example.com", "pending", [[3, 1, "S"]]],
      [2, "sophia@example.com", "shipped", [[13, 1, "M"], [12, 1, "M"]]],
      [3, "ava@example.com", "delivered", [[1, 2, "M"], [11, 1, "L"]]],
      [4, "mia@example.com", "delivered", [[17, 1, "OS"]]],
      [5, "emma@example.com", "delivered", [[5, 1, "S"], [14, 1, "M"]]],
      [6, "olivia@example.com", "delivered", [[9, 1, "M"]]],
      [8, "sophia@example.com", "delivered", [[2, 1, "L"], [18, 1, "OS"]]],
      [9, "ava@example.com", "cancelled", [[7, 1, "S"]]],
      [10, "mia@example.com", "delivered", [[10, 1, "M"], [16, 1, "M"]]],
      [11, "emma@example.com", "delivered", [[19, 1, "OS"]]],
      [12, "olivia@example.com", "delivered", [[4, 1, "M"], [6, 1, "M"]]],
      [13, "sophia@example.com", "shipped", [[15, 1, "M"]]],
      [13, "ava@example.com", "processing", [[8, 2, "M"]]],
    ];

    const ADDR = {
      "emma@example.com": ["Emma Sullivan", "48 Birch Street", "Portland", "04101"],
      "olivia@example.com": ["Olivia Bennett", "9 Harbor View Ave", "Portland", "04102"],
      "sophia@example.com": ["Sophia Carter", "77 Elm Court", "Brunswick", "04011"],
      "ava@example.com": ["Ava Reynolds", "15 Meadowbrook Rd", "Freeport", "04032"],
      "mia@example.com": ["Mia Thompson", "303 Ocean Bluff Dr", "Yarmouth", "04096"],
    };

    for (let i = 0; i < ORDER_PLAN.length; i++) {
      const [daysAgo, email, status, items] = ORDER_PLAN[i];
      let subtotal = 0;
      for (const [pi, qty] of items) subtotal += P(pi).priceCents * qty;
      const shipping = subtotal >= 7500 ? 0 : 695;
      const tax = Math.round(subtotal * 0.08);
      const total = subtotal + shipping + tax;
      const [sName, sAddr, sCity, sZip] = ADDR[email];
      const created = new Date(now - daysAgo * day - Math.floor(Math.random() * 8) * 3600000);
      const tracking = `SB-${created.getTime().toString(36).toUpperCase().slice(-6)}${20 + i}`;
      const oRes = await client.query(
        `INSERT INTO orders (user_id, status, total_cents, subtotal_cents, shipping_cents, tax_cents, shipping_name, shipping_address, shipping_city, shipping_zip, customer_email, payment_method, payment_status, tracking_number, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'card','paid',$12,$13) RETURNING id`,
        [userByEmail[email], status, total, subtotal, shipping, tax, sName, sAddr, sCity, sZip, email, tracking, created]
      );
      const orderId = oRes.rows[0].id;
      for (const [pi, qty, size] of items) {
        const prod = P(pi);
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price_cents, size)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [orderId, prod.id, prod.name, prod.imageUrl, qty, prod.priceCents, size]
        );
      }
    }

    console.log("Seeding messages...");
    await client.query(
      `INSERT INTO messages (name, email, subject, message, type, status, rating, created_at) VALUES
       ('Jenny Park', 'jenny@example.com', 'Sizing help for the Rosalind dress', 'Hi! I am between a small and medium — does the smocked bodice run stretchy? I am 5''5\" and usually a size 6. Thank you!', 'contact', 'new', NULL, NOW() - INTERVAL '4 hours'),
       ('Rachel Kim', 'rachel@example.com', 'Love my order!', 'Just received the Cloudspun sweater and it is the softest thing I own. Shipping was so fast too. You have a customer for life!', 'feedback', 'new', 5, NOW() - INTERVAL '1 day'),
       ('Hannah Lee', 'hannah@example.com', 'Return question', 'Hello, I ordered the Twilight Satin Dress but need to exchange for a larger size. What is the exchange window? Thanks!', 'contact', 'read', NULL, NOW() - INTERVAL '2 days'),
       ('Priya Nair', 'priya@example.com', 'Beautiful packaging', 'The hand-written thank you note in my package made my day. The Sienna carryall is gorgeous and great quality.', 'feedback', 'replied', 5, NOW() - INTERVAL '3 days'),
       ('Megan Ross', 'megan@example.com', 'Restock request', 'Will the Noir Evening Slip Dress be restocked in size XS? I missed it last time. Please let me know!', 'contact', 'new', NULL, NOW() - INTERVAL '5 days'),
       ('Laura Bennett', 'laura@example.com', 'In-store pickup?', 'Do you offer pickup at the Maplewood store for online orders? I live nearby and would love that option.', 'contact', 'read', NULL, NOW() - INTERVAL '6 days'),
       ('Dana Cole', 'dana@example.com', 'Five stars', 'Ordered jeans and a cardigan — both fit true to size and the quality is excellent for the price. Highly recommend!', 'feedback', 'replied', 5, NOW() - INTERVAL '8 days')`
    );

    console.log("Seeding reviews...");
    const REVIEWS = [
      [0, "Emma Sullivan", 5, "Wore this to a garden wedding and got compliments all night. The fit is perfect and the fabric breathes beautifully."],
      [0, "Olivia Bennett", 5, "True to size, gorgeous print, and it has pockets! My new favorite dress."],
      [3, "Sophia Carter", 5, "So elegant. The satin feels expensive and the cut is incredibly flattering."],
      [3, "Ava Reynolds", 4, "Lovely dress, runs slightly long on me (5'3\") but a quick hem fixed it."],
      [8, "Mia Thompson", 5, "The softest sweater I have ever owned. I live in it. Bought a second one for my sister."],
      [8, "Emma Sullivan", 5, "Cozy without being bulky. Washes well too — no pilling after three washes."],
      [13, "Olivia Bennett", 5, "Perfect trucker. Great weight denim, beautiful color, fits like it was made for me."],
      [17, "Sophia Carter", 5, "The carryall is stunning in person — the leather smells amazing and the scarf detail is so chic."],
      [1, "Ava Reynolds", 5, "Adorable sundress! Light, comfy, and the square neckline is so flattering."],
      [12, "Mia Thompson", 4, "Great jeans, very comfortable. Wish there were more washes!"],
    ];
    for (const [pi, uname, rating, comment] of REVIEWS) {
      await client.query(
        `INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES ($1, NULL, $2, $3, $4)`,
        [P(pi).id, uname, rating, comment]
      );
    }

    console.log("Seed complete!");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
