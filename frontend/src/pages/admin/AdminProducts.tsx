import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Star, Trash2, Sparkles, Loader2, Package } from 'lucide-react';
import { api } from '../../lib/api';

interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  is_starred: boolean;
  ingredients: string | null;
  usage_instructions: string | null;
  suitable_for: string[] | null;
  warnings: string | null;
}

export const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await api.get<Product[]>('/admin/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStar = async (product: Product) => {
    try {
      await api.put(`/admin/products/${product.id}`, {
        ...product,
        is_starred: !product.is_starred
      });
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-left text-[#26384B] mb-2 flex flex-wrap items-baseline gap-3 sm:gap-4">
            <span className="text-2xl sm:text-4xl font-semibold tracking-normal">Recommendation</span>
            <span className="text-5xl sm:text-7xl text-[#4C6072] font-medium tracking-normal opacity-80">Products</span>
          </h1>
          <p className="text-[#4C6072] text-sm">
            Manage the catalog of products that the AI can recommend to users. Star a product to prioritize it over others in the same category.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-3 bg-[#26384B] text-[#F6F4EF] rounded-xl text-sm font-medium hover:bg-[#1a2530] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#4C6072]/50" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-sm rounded-[24px] focus:outline-none focus:ring-2 focus:ring-[#26384B]/20 transition-all text-[#26384B]"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#26384B]/20 border-t-[#26384B] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ${product.is_starred ? 'ring-[#26384B]/20' : 'ring-white/50'} rounded-[32px] relative group hover:shadow-lg transition-all duration-300 flex flex-col h-full`}
            >
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-white/80 to-white/30 border border-white/60 shadow-sm flex items-center justify-center text-[#26384B]">
                    <Package className="w-6 h-6 opacity-70" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleStar(product)}
                    className={`p-2 rounded-full transition-colors ${product.is_starred ? 'bg-amber-100 text-amber-600' : 'text-[#4C6072] bg-white/50 hover:bg-white/80'}`}
                  >
                    <Star className="w-4 h-4" fill={product.is_starred ? "currentColor" : "none"} strokeWidth={1.5} />
                  </button>
                  <button 
                    onClick={() => deleteProduct(product.id)}
                    className="p-2 rounded-full text-[#4C6072] bg-white/50 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#4C6072]/70 mb-1">{product.brand || 'Unbranded'}</p>
                <h3 className="text-xl font-sans font-medium text-[#26384B] leading-tight tracking-tight mb-3 line-clamp-2">{product.name}</h3>
                
                {product.ingredients && (
                  <p className="text-xs text-[#4C6072] line-clamp-2 mb-2 leading-relaxed">
                    <span className="font-medium text-[#26384B]">Ing:</span> {product.ingredients}
                  </p>
                )}
                {product.usage_instructions && !product.ingredients && (
                  <p className="text-xs text-[#4C6072] line-clamp-2 mb-2 leading-relaxed">
                    <span className="font-medium text-[#26384B]">Use:</span> {product.usage_instructions}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/40 flex items-center justify-between">
                <span className="inline-block px-3 py-1.5 bg-white/50 border border-white/60 shadow-sm rounded-full text-[10px] font-medium tracking-wide text-[#4C6072] capitalize">
                  {product.category.replace(/_/g, ' ')}
                </span>
                {product.is_starred && (
                  <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddProductModal 
            onClose={() => setIsAddModalOpen(false)} 
            onAdded={fetchProducts} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const AddProductModal = ({ onClose, onAdded }: { onClose: () => void, onAdded: () => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'gentle_cleanser',
    usage_instructions: '',
    ingredients: '',
    warnings: ''
  });
  
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAiAssist = async () => {
    if (!formData.name) return;
    setAiLoading(true);
    
    // Simulate an AI call that parses the product name and guesses details
    // In production, this would hit an endpoint that uses Gemini to structured-parse the name.
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        brand: prev.name.includes('Cerave') ? 'Cerave' : 'The Ordinary',
        usage_instructions: "Apply to damp skin, massage gently, and rinse thoroughly.",
        ingredients: "Water, Glycerin, Ceramides",
        warnings: "Avoid direct contact with eyes."
      }));
      setAiLoading(false);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/products', {
        ...formData,
        is_starred: false
      });
      onAdded();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#26384B]/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-8 py-6 border-b border-[#26384B]/5 flex justify-between items-center bg-[#F7F7F5]">
          <h2 className="text-xl font-serif font-medium text-[#26384B]">Add Product</h2>
          <button onClick={onClose} className="text-[#4C6072] hover:text-[#26384B]">
            ✕
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4C6072]">Product Name</label>
              <div className="flex gap-4">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="flex-1 px-4 py-3 bg-[#F7F7F5] border border-[#26384B]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26384B]/20 text-[#26384B]"
                  placeholder="e.g. Cerave Hydrating Cleanser"
                />
                <button
                  type="button"
                  onClick={handleAiAssist}
                  disabled={aiLoading || !formData.name}
                  className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-medium hover:bg-indigo-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  AI Autofill
                </button>
              </div>
              <p className="text-xs text-[#4C6072]/70">Enter the name and click AI Autofill to automatically generate usage instructions and details.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4C6072]">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={e => setFormData({...formData, brand: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F7F7F5] border border-[#26384B]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26384B]/20 text-[#26384B]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4C6072]">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F7F7F5] border border-[#26384B]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26384B]/20 text-[#26384B] appearance-none"
                >
                  <option value="gentle_cleanser">Gentle Cleanser</option>
                  <option value="hydrating_cleanser">Hydrating Cleanser</option>
                  <option value="foaming_cleanser">Foaming Cleanser</option>
                  <option value="cleansing_balm">Cleansing Balm</option>
                  <option value="barrier_moisturizer">Barrier Moisturizer</option>
                  <option value="rich_night_cream">Rich Night Cream</option>
                  <option value="gel_moisturizer">Gel Moisturizer</option>
                  <option value="broad_spectrum_spf">Sunscreen (SPF)</option>
                  <option value="vitamin_c">Vitamin C</option>
                  <option value="bha_salicylic_acid">BHA / Salicylic Acid</option>
                  <option value="retinoid_type">Retinoid</option>
                  <option value="azelaic_acid">Azelaic Acid</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4C6072]">Usage Instructions</label>
              <textarea
                value={formData.usage_instructions}
                onChange={e => setFormData({...formData, usage_instructions: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 bg-[#F7F7F5] border border-[#26384B]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26384B]/20 text-[#26384B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4C6072]">Ingredients</label>
                <textarea
                  value={formData.ingredients}
                  onChange={e => setFormData({...formData, ingredients: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-3 bg-[#F7F7F5] border border-[#26384B]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26384B]/20 text-[#26384B]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4C6072]">Warnings</label>
                <textarea
                  value={formData.warnings}
                  onChange={e => setFormData({...formData, warnings: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-3 bg-[#F7F7F5] border border-[#26384B]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26384B]/20 text-[#26384B]"
                />
              </div>
            </div>
            
          </form>
        </div>

        <div className="px-8 py-6 border-t border-[#26384B]/5 bg-[#F7F7F5] flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white border border-[#26384B]/10 text-[#4C6072] rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={submitting}
            className="px-6 py-3 bg-[#26384B] text-white rounded-xl font-medium hover:bg-[#1a2530] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
