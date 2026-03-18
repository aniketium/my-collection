// =============================================
// Data Layer — Supabase CRUD + Auth
// =============================================

const db = {
  // ---- Auth ----
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async signUp(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  onAuthChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // ---- Profile ----
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async getProfileByUsername(username) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---- Categories ----
  async getCategories(userId) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order');
    if (error) throw error;
    return data;
  },

  async addCategory(userId, category) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ user_id: userId, ...category })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCategory(categoryId) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);
    if (error) throw error;
  },

  // ---- Items ----
  async getItems(userId) {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getItem(itemId) {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();
    if (error) throw error;
    return data;
  },

  async addItem(userId, item) {
    const { data, error } = await supabase
      .from('items')
      .insert({ user_id: userId, ...item })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateItem(itemId, updates) {
    const { data, error } = await supabase
      .from('items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteItem(itemId) {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);
    if (error) throw error;
  },

  // ---- Marketplace (for_sale items across all users) ----
  async getMarketplaceItems(limit = 50) {
    const { data, error } = await supabase
      .from('items')
      .select('*, profiles(username, display_name, avatar_url)')
      .eq('for_sale', true)
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  // ---- Image Upload ----
  async uploadImage(userId, file) {
    const ext = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('item-images')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  // ---- Stats ----
  async getUserStats(userId) {
    const items = await this.getItems(userId);
    const categories = await this.getCategories(userId);
    const nonBooks = items.filter(i => i.category_slug !== 'books');
    const totalValue = nonBooks.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0);
    const usedCategories = new Set(items.map(i => i.category_slug));

    return {
      itemCount: items.length,
      totalValue,
      categoryCount: usedCategories.size,
      items,
      categories
    };
  }
};
