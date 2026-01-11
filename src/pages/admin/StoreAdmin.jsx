import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag, Plus, Pencil, Trash2, X, Check, Search,
    AlertTriangle, Loader2, Save, ArrowLeft, Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { shopService } from '../../services/shopService';
import { useNotifications } from '../../context/NotificationContext';

export default function StoreAdmin() {
    const navigate = useNavigate();
    const { user, profile, profileLoading } = useAuth();
    const { showToast } = useNotifications();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'supplements',
        image: '',
        description: '',
        stock: 50,
        badge: ''
    });

    useEffect(() => {
        // Wait for profile to load
        if (profileLoading) return;

        // Security Check - Exclusivo para dueños (Admin)
        if (!profile || profile.role !== 'admin') {
            navigate('/crm/login'); // Redirect to CRM Login, NOT public shop
            return;
        }

        loadProducts();
    }, [profile, profileLoading, navigate]);

    if (profileLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-950">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await shopService.getProducts();
            setProducts(data);
        } catch (error) {
            console.error(error);
            showToast({ type: 'error', title: 'Error', message: 'Error cargando productos' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                price: product.price,
                category: product.category,
                image: product.image,
                description: product.description || '',
                stock: product.stock || 0,
                badge: product.badge || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                price: '',
                category: 'supplements',
                image: '',
                description: '',
                stock: 50,
                badge: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const productData = {
                ...formData,
                price: Number(formData.price),
                stock: Number(formData.stock)
            };

            if (editingProduct) {
                await shopService.updateProduct(editingProduct.id, productData);
                showToast({ type: 'success', title: 'Actualizado', message: 'Producto actualizado correctamente' });
            } else {
                await shopService.addProduct(productData);
                showToast({ type: 'success', title: 'Creado', message: 'Producto creado correctamente' });
            }

            await loadProducts();
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            showToast({ type: 'error', title: 'Error', message: 'No se pudo guardar el producto' });
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este producto?')) return;

        try {
            await shopService.deleteProduct(id);
            await loadProducts();
            showToast({ type: 'success', title: 'Eliminado', message: 'Producto eliminado' });
        } catch (error) {
            console.error(error);
            showToast({ type: 'error', title: 'Error', message: 'Error al eliminar' });
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 pb-24">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <span className="font-black">FitAI OPS</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black">Shop CRM</h1>
                            <p className="text-slate-400 text-sm">Portal de Administración</p>
                        </div>
                    </div>

                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold flex items-center gap-2"
                    >
                        <Plus size={18} /> Nuevo Producto
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl">
                        <div className="text-slate-400 text-xs mb-1">Total Productos</div>
                        <div className="text-2xl font-black">{products.length}</div>
                    </div>
                    <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl">
                        <div className="text-slate-400 text-xs mb-1">Stock Bajo</div>
                        <div className="text-2xl font-black text-amber-500">
                            {products.filter(p => p.stock < 10).length}
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : (
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-bold">
                                <tr>
                                    <th className="p-4">Producto</th>
                                    <th className="p-4">Categoría</th>
                                    <th className="p-4">Precio</th>
                                    <th className="p-4">Stock</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredProducts.map(product => (
                                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl">
                                                    {product.image.includes('http') ? (
                                                        <img src={product.image} className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        product.image
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold">{product.name}</div>
                                                    {product.badge && (
                                                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                                                            {product.badge}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="capitalize text-sm text-slate-400">{product.category}</span>
                                        </td>
                                        <td className="p-4 font-mono font-bold">
                                            ${product.price}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-sm ${product.stock < 10 ? 'text-red-400 font-bold' : 'text-green-400'}`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(product)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-blue-400"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-red-400"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredProducts.length === 0 && (
                            <div className="p-8 text-center text-slate-500">
                                No se encontraron productos
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h2 className="text-xl font-black">
                                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400">Nombre</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400">Categoría</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg p-2"
                                        >
                                            <option value="supplements">Suplementos</option>
                                            <option value="protein">Proteínas</option>
                                            <option value="apparel">Ropa</option>
                                            <option value="equipment">Equipamiento</option>
                                            <option value="coaching">Coaching</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400">Precio (ARS)</label>
                                        <input
                                            type="number" required
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg p-2"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400">Stock</label>
                                        <input
                                            type="number" required
                                            value={formData.stock}
                                            onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg p-2"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400">Imagen (URL o Emoji)</label>
                                    <input
                                        value={formData.image}
                                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-2"
                                        placeholder="https://... o 👕"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400">Descripción</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-2"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400">Badge (Opcional)</label>
                                    <input
                                        value={formData.badge}
                                        onChange={e => setFormData({ ...formData, badge: e.target.value })}
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-2"
                                        placeholder="Ej: Nuevo, -20%, Bestseller"
                                    />
                                </div>

                                <button
                                    disabled={formLoading}
                                    type="submit"
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-black mt-4 flex items-center justify-center gap-2"
                                >
                                    {formLoading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    Guardar Producto
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
