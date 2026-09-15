/* ==========================================================================
   SHIMMERWANDS SUPABASE CLOUD DATABASE CONFIGURATION & HELPER API
   ========================================================================== */

const SUPABASE_URL = 'https://xibjcvlfnaqrizbfikdz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-Ngwy0QjSxyTFPlAfw_7VA_aVX8QsMy';

let db = null;

if (typeof window.supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✨ Connected to Shimmerwands Supabase Cloud Database!");
  } catch (err) {
    console.warn("⚠️ Supabase Client init failed, using Local Storage fallback.", err);
  }
}

// Global DB helper object
window.ShimmerDB = {
  isCloudConnected() {
    return db !== null;
  },

  // --- PRODUCTS ---
  async getProducts(filters = {}) {
    if (!db) return null;
    try {
      let query = db.from('products').select('*');

      // 1. Backend Category Filter
      if (filters.category && filters.category !== 'all') {
        const rawCat = String(filters.category).toLowerCase().trim();
        let catId = 'cat_1';
        if (rawCat === 'cat_2' || rawCat === 'face' || rawCat.includes('face')) catId = 'cat_2';
        else if (rawCat === 'cat_3' || rawCat === 'eye' || rawCat.includes('eye')) catId = 'cat_3';
        else if (rawCat === 'cat_4' || rawCat === 'lip' || rawCat.includes('lip')) catId = 'cat_4';
        else catId = 'cat_1';
        query = query.eq('category_id', catId);
      }

      // 2. Backend Price Filter
      if (filters.priceFilter && filters.priceFilter !== 'all') {
        if (filters.priceFilter === 'under-500' || filters.priceFilter === 'under-50') {
          query = query.lt('price', 500);
        } else if (filters.priceFilter === '500-1000' || filters.priceFilter === '50-100') {
          query = query.gte('price', 500).lte('price', 1000);
        } else if (filters.priceFilter === 'over-1000' || filters.priceFilter === 'over-100') {
          query = query.gt('price', 1000);
        }
      }

      // 3. Backend Color / Text Search Filter
      if (filters.colorFilter && filters.colorFilter !== 'all') {
        const c = String(filters.colorFilter).toLowerCase();
        if (c === 'rose-gold') {
          query = query.or('color.ilike.%rose%,color.ilike.%gold%,name.ilike.%rose%,name.ilike.%blush%,name.ilike.%pink%');
        } else if (c === 'pink') {
          query = query.or('color.ilike.%pink%,name.ilike.%pink%,name.ilike.%coquette%,name.ilike.%bow%');
        } else if (c === 'silver') {
          query = query.or('color.ilike.%silver%,name.ilike.%silver%,name.ilike.%crystal%,name.ilike.%diamond%,name.ilike.%starlight%');
        } else if (c === 'gold') {
          query = query.or('color.ilike.%gold%,name.ilike.%champagne%,name.ilike.%gold%,name.ilike.%royal%');
        } else if (c === 'black') {
          query = query.or('color.ilike.%black%,name.ilike.%black%,name.ilike.%onyx%,name.ilike.%midnight%');
        }
      }

      // 4. Backend Sorting
      if (filters.sortBy === 'price-asc') {
        query = query.order('price', { ascending: true });
      } else if (filters.sortBy === 'price-desc') {
        query = query.order('price', { ascending: false });
      } else if (filters.sortBy === 'title-asc') {
        query = query.order('name', { ascending: true });
      } else if (filters.sortBy === 'title-desc') {
        query = query.order('name', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data.map(p => {
        const rawImgStr = p.image_url || 'assets/main_page_1.png';
        const imgList = rawImgStr.split(',').map(s => s.trim()).filter(Boolean);
        return {
          id: p.item_id,
          title: p.name,
          sub: p.description || '',
          category: p.category_id || 'sets',
          price: parseFloat(p.price) || 0,
          quantity: parseInt(p.quantity) || 0,
          color: p.color || 'Rose Gold',
          badge: p.badge || '',
          img: imgList[0] || 'assets/main_page_1.png',
          images: imgList.length > 0 ? imgList : ['assets/main_page_1.png']
        };
      });
    } catch (e) {
      console.warn("Supabase fetch products error:", e);
      return null;
    }
  },

  async saveProduct(productObj) {
    if (!db) return null;
    try {
      const imgStr = Array.isArray(productObj.images) ? productObj.images.join(', ') : (productObj.img || '');
      const rawCat = String(productObj.category || productObj.category_id || '').toLowerCase().trim();
      let catId = 'cat_1';
      if (rawCat === 'cat_2' || rawCat === 'face' || rawCat.includes('face') || rawCat.includes('sculpt')) catId = 'cat_2';
      else if (rawCat === 'cat_3' || rawCat === 'eye' || rawCat.includes('eye') || rawCat.includes('brow')) catId = 'cat_3';
      else if (rawCat === 'cat_4' || rawCat === 'lip' || rawCat.includes('lip') || rawCat.includes('detail')) catId = 'cat_4';
      else catId = 'cat_1';

      const payload = {
        item_id: String(productObj.id),
        name: productObj.title,
        description: productObj.sub || '',
        category_id: catId,
        price: parseFloat(productObj.price) || 0,
        quantity: parseInt(productObj.quantity) || 0,
        color: productObj.color || 'Rose Gold',
        badge: productObj.badge || '',
        image_url: imgStr
      };
      const { data, error } = await db.from('products').upsert(payload).select();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn("Supabase save product error:", e);
      return null;
    }
  },

  async deleteProduct(itemId) {
    if (!db) return null;
    try {
      const { error } = await db.from('products').delete().eq('item_id', String(itemId));
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Supabase delete product error:", e);
      return false;
    }
  },

  // --- ADMINS ---
  async getAdmins() {
    if (!db) return null;
    try {
      const { data, error } = await db.from('admins').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data.map(a => ({
        id: a.admin_id,
        username: a.username || '',
        passwordHash: a.password_hash || '',
        name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Admin',
        email: a.email || '',
        contact: a.contact_no || '',
        cnic: a.cnic || '',
        address: a.address || '',
        role: a.role || 'sub_admin'
      }));
    } catch (e) {
      console.warn("Supabase fetch admins error:", e);
      return null;
    }
  },

  async saveAdmin(adminObj) {
    if (!db) return null;
    try {
      const nameParts = (adminObj.name || '').trim().split(' ');
      const defaultHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
      const passHash = adminObj.passwordHash || adminObj.password_hash || defaultHash;
      const payload = {
        admin_id: String(adminObj.id),
        username: adminObj.username,
        password_hash: passHash,
        first_name: nameParts[0] || adminObj.name || 'Admin',
        last_name: nameParts.slice(1).join(' ') || '',
        email: adminObj.email,
        contact_no: adminObj.contact || '',
        cnic: adminObj.cnic || '',
        address: adminObj.address || '',
        role: adminObj.role || 'sub_admin'
      };
      const { data, error } = await db.from('admins').upsert(payload).select();
      if (error) {
        console.error("Supabase saveAdmin error:", error);
        throw error;
      }
      return data;
    } catch (e) {
      console.warn("Supabase save admin error:", e);
      return null;
    }
  },

  async deleteAdmin(adminId) {
    if (!db) return null;
    try {
      const { error } = await db.from('admins').delete().eq('admin_id', String(adminId));
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Supabase delete admin error:", e);
      return false;
    }
  },

  // --- ORDERS & INVOICES ---
  async placeOrder(orderPayload) {
    if (!db) return null;
    try {
      const custId = 'cust_' + Date.now();
      const nameParts = (orderPayload.customerName || '').split(' ');

      // 1. Create/Update Customer Record
      const customerData = {
        customer_id: custId,
        first_name: nameParts[0] || 'Customer',
        last_name: nameParts.slice(1).join(' ') || 'Guest',
        email: orderPayload.email,
        contact_no: orderPayload.phone,
        address: orderPayload.address,
        city: 'Lahore'
      };
      await db.from('customers').upsert(customerData);

      // 2. Create Order Record
      const orderData = {
        order_id: String(orderPayload.id),
        customer_id: custId,
        order_date: new Date().toISOString(),
        status: (orderPayload.status || 'Pending').toLowerCase(),
        subtotal_amount: parseFloat(orderPayload.total) || 0,
        total_amount: parseFloat(orderPayload.total) || 0,
        payment_method: 'Cash on Delivery',
        shipping_address: orderPayload.address
      };
      const { error: orderErr } = await db.from('orders').upsert(orderData);
      if (orderErr) throw orderErr;

      // 3. Create Line Items with Valid Foreign Key Item IDs
      if (orderPayload.items && orderPayload.items.length > 0) {
        const { data: dbProducts } = await db.from('products').select('item_id, name');
        
        const lineItems = orderPayload.items.map((item, idx) => {
          let validItemId = 'prod_1';
          if (dbProducts && dbProducts.length > 0) {
            const found = dbProducts.find(p => p.item_id === String(item.id) || p.name.toLowerCase() === (item.name || '').toLowerCase());
            if (found) validItemId = found.item_id;
            else if (dbProducts[idx]) validItemId = dbProducts[idx].item_id;
            else validItemId = dbProducts[0].item_id;
          }

          return {
            order_item_id: `item_${orderPayload.id}_${idx}_${Date.now()}`,
            order_id: String(orderPayload.id),
            item_id: validItemId,
            quantity: parseInt(item.qty || item.quantity || 1),
            unit_price: parseFloat(item.price) || 0,
            total_price: (parseFloat(item.price) || 0) * parseInt(item.qty || item.quantity || 1),
            custom_notes: item.name || 'Wand Item'
          };
        });
        await db.from('order_items').insert(lineItems);
      }

      // 4. Create Linked Invoice Record
      const invoiceData = {
        invoice_id: 'INV-' + String(orderPayload.id),
        order_id: String(orderPayload.id),
        invoice_date: new Date().toISOString(),
        billed_to_name: orderPayload.customerName,
        billed_to_email: orderPayload.email,
        billed_to_address: orderPayload.address,
        subtotal: parseFloat(orderPayload.total) || 0,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: parseFloat(orderPayload.total) || 0,
        status: (orderPayload.status || 'Pending') === 'Done' ? 'paid' : 'unpaid',
        extra_note: 'Thank you for shopping with Shimmerwands!'
      };
      await db.from('invoices').upsert(invoiceData);

      return true;
    } catch (e) {
      console.warn("Supabase place order error:", e);
      return false;
    }
  },

  async getOrders(filters = {}) {
    if (!db) return null;
    try {
      let query = db.from('orders').select(`
        *,
        customers (*),
        order_items (
          *,
          products (name)
        ),
        invoices (*)
      `);

      if (filters.status && filters.status !== 'all') {
        const dbStatus = String(filters.status).toLowerCase() === 'done' ? 'done' : 'pending';
        query = query.eq('status', dbStatus);
      }

      if (filters.search) {
        query = query.or(`order_id.ilike.%${filters.search}%,shipping_address.ilike.%${filters.search}%`);
      }

      query = query.order('order_date', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data.map(o => ({
        id: o.order_id,
        customerName: o.customers ? `${o.customers.first_name} ${o.customers.last_name}`.trim() : 'Customer',
        email: o.customers ? o.customers.email : '',
        phone: o.customers ? o.customers.contact_no : '',
        address: o.shipping_address,
        date: new Date(o.order_date).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        total: parseFloat(o.total_amount) || 0,
        status: o.status === 'done' ? 'Done' : 'Pending',
        items: o.order_items ? o.order_items.map(i => ({
          name: i.products ? i.products.name : (i.custom_notes || `Wand Item #${i.item_id}`),
          qty: i.quantity,
          price: parseFloat(i.unit_price)
        })) : []
      }));
    } catch (e) {
      console.warn("Supabase fetch orders error:", e);
      return null;
    }
  },

  async updateOrderStatus(orderId, newStatus) {
    if (!db) return null;
    try {
      const dbStatus = newStatus === 'Done' ? 'done' : 'pending';
      await db.from('orders').update({ status: dbStatus }).eq('order_id', String(orderId));
      await db.from('invoices').update({ status: newStatus === 'Done' ? 'paid' : 'unpaid' }).eq('order_id', String(orderId));
      return true;
    } catch (e) {
      console.warn("Supabase update order status error:", e);
      return false;
    }
  },

  async sendOrderEmail(orderPayload) {
    if (typeof sendOrderEmailNotification === 'function') {
      await sendOrderEmailNotification(orderPayload);
    }
  }
};
