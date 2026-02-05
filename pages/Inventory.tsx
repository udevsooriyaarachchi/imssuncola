import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Product } from '../types';
import { Plus, Edit2, Trash2, Search, Sparkles, X, Tag, Layers, Package } from 'lucide-react';
import { generateProductDescription } from '../services/geminiService';

type ViewMode = 'PRODUCTS' | 'CATEGORIES' | 'BRANDS';

const Inventory: React.FC = () => {
  const { products, categories, brands, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory, addBrand, deleteBrand } = useData();
  const [viewMode, setViewMode] = useState<ViewMode>('PRODUCTS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Product State
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  
  // Cat/Brand State
  const [newItemName, setNewItemName] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Handlers
  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) deleteProduct(id);
  };

  const handleGenerateDesc = async () => {
    if (!currentProduct.name) return alert('Please enter a product name first.');
    setAiLoading(true);
    const desc = await generateProductDescription(currentProduct.name);
    setCurrentProduct(prev => ({ ...prev, description: desc }));
    setAiLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewMode === 'PRODUCTS') {
      if (!currentProduct.name || !currentProduct.price || !currentProduct.sku) return;
      if (currentProduct.id) {
        updateProduct(currentProduct as Product);
      } else {
        addProduct({
          ...currentProduct,
          id: crypto.randomUUID(),
          stock: currentProduct.stock || 0,
          cost: currentProduct.cost || 0
        } as Product);
      }
      setIsModalOpen(false);
      setCurrentProduct({});
    } else if (viewMode === 'CATEGORIES') {
      if (newItemName) {
        addCategory(newItemName);
        setNewItemName('');
      }
    } else {
      if (newItemName) {
        addBrand(newItemName);
        setNewItemName('');
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Inventory</h2>
           <p className="text-gray-500 mt-1">Manage stock, categories, and brands.</p>
        </div>
        
        {viewMode === 'PRODUCTS' && (
          <button 
            onClick={() => { setCurrentProduct({}); setIsModalOpen(true); }}
            className="flex items-center px-5 py-3 bg-[#007AFF] text-white rounded-full font-semibold shadow-md shadow-blue-200 hover:opacity-90 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Product
          </button>
        )}
      </div>

      {/* iOS Segmented Control */}
      <div className="bg-gray-200/50 p-1.5 rounded-2xl inline-flex w-full md:w-auto">
        <button 
          onClick={() => setViewMode('PRODUCTS')}
          className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'PRODUCTS' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Products
        </button>
        <button 
          onClick={() => setViewMode('CATEGORIES')}
          className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'CATEGORIES' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Categories
        </button>
        <button 
          onClick={() => setViewMode('BRANDS')}
          className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'BRANDS' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Brands
        </button>
      </div>

      {viewMode === 'PRODUCTS' ? (
        <>
          <div className="bg-[#E5E5EA] p-1.5 rounded-[18px] max-w-md">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          <div className="bg-white rounded-[24px] shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                  <tr>
                    <th className="p-5 pl-8">Product Name</th>
                    <th className="p-5">SKU</th>
                    <th className="p-5">Category/Brand</th>
                    <th className="p-5">Price / Cost</th>
                    <th className="p-5">Stock</th>
                    <th className="p-5 pr-8 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="p-5 pl-8">
                        <div className="font-bold text-gray-900 text-base">{product.name}</div>
                        <div className="text-sm text-gray-400 mt-0.5 truncate max-w-xs font-medium">{product.description}</div>
                      </td>
                      <td className="p-5 font-mono text-sm text-gray-500">{product.sku}</td>
                      <td className="p-5 text-sm text-gray-600">
                        <div className="flex flex-col">
                           <span>{product.category || '-'}</span>
                           <span className="text-xs text-gray-400">{product.brand || '-'}</span>
                        </div>
                      </td>
                      <td className="p-5 text-gray-900">
                        <div className="font-medium">${product.price.toFixed(2)}</div>
                        <div className="text-xs text-gray-400">Cost: ${product.cost?.toFixed(2) || '0.00'}</div>
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {product.stock} Units
                        </span>
                      </td>
                      <td className="p-5 pr-8 text-right space-x-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(product)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-8 rounded-[32px] shadow-sm max-w-2xl">
           <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
             {viewMode === 'CATEGORIES' ? <Layers className="mr-2" /> : <Tag className="mr-2" />}
             Manage {viewMode === 'CATEGORIES' ? 'Categories' : 'Brands'}
           </h3>
           
           <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
              <input 
                type="text" 
                placeholder={`New ${viewMode === 'CATEGORIES' ? 'Category' : 'Brand'} Name`}
                className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-[#007AFF] focus:bg-white"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
              />
              <button className="px-6 py-3 bg-[#007AFF] text-white rounded-xl font-bold hover:bg-blue-600 transition-colors">Add</button>
           </form>

           <div className="space-y-2">
             {(viewMode === 'CATEGORIES' ? categories : brands).map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                   <span className="font-bold text-gray-700">{item.name}</span>
                   <button 
                     onClick={() => viewMode === 'CATEGORIES' ? deleteCategory(item.id) : deleteBrand(item.id)}
                     className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
             ))}
             {(viewMode === 'CATEGORIES' ? categories : brands).length === 0 && (
               <p className="text-gray-400 text-center py-4">No items found.</p>
             )}
           </div>
        </div>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">{currentProduct.id ? 'Edit' : 'New'} Product</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">SKU</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                      value={currentProduct.sku || ''}
                      onChange={e => setCurrentProduct({...currentProduct, sku: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                      value={currentProduct.name || ''}
                      onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                    />
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
                    <select 
                       className="w-full px-4 py-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium appearance-none"
                       value={currentProduct.category || ''}
                       onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}
                    >
                       <option value="">Select...</option>
                       {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Brand</label>
                    <select 
                       className="w-full px-4 py-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium appearance-none"
                       value={currentProduct.brand || ''}
                       onChange={e => setCurrentProduct({...currentProduct, brand: e.target.value})}
                    >
                       <option value="">Select...</option>
                       {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                 </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                <div className="relative">
                  <textarea 
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium h-20 resize-none"
                    value={currentProduct.description || ''}
                    onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})}
                  />
                  <button 
                    type="button" 
                    onClick={handleGenerateDesc}
                    disabled={aiLoading}
                    className="absolute bottom-3 right-3 p-2 bg-white shadow-sm rounded-lg text-indigo-600 hover:text-indigo-800 hover:shadow-md transition-all"
                    title="Generate with AI"
                  >
                    <Sparkles className={`w-5 h-5 ${aiLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Price ($)</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                    value={currentProduct.price || ''}
                    onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cost ($)</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                    value={currentProduct.cost || ''}
                    onChange={e => setCurrentProduct({...currentProduct, cost: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Stock (Manual)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                    value={currentProduct.stock !== undefined ? currentProduct.stock : ''}
                    onChange={e => setCurrentProduct({...currentProduct, stock: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-full font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-[#007AFF] text-white rounded-full font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;