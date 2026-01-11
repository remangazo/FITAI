import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag, Star, Filter, Search, Plus, Minus, X, ShoppingCart,
    Truck, Shield, CreditCard, Tag, ChevronRight, Check, Heart, ChevronLeft, Crown, Zap, Sparkles, GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav, BackButton } from '../components/Navigation';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { trainerService } from '../services/trainerService';
import { shopService } from '../services/shopService';
import { CATEGORIES } from '../data/shopConstants';

// Constantes de Tienda
const PREMIUM_DISCOUNT = 0.15; // 15% de descuento para Premium

// Categorias elegibles para descuento Trainer
const TRAINER_DISCOUNT_CATEGORIES = ['supplements', 'protein', 'apparel', 'equipment'];

const formatARS = (num) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);

export default function Shop() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const isPremium = profile?.isPremium || false;
    const isTrainer = profile?.role === 'trainer';
    const { showToast } = useNotifications?.() || { showToast: () => { } };

    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [trainerData, setTrainerData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial Fetch (Seed if empty)
    useEffect(() => {
        const fetchShopData = async () => {
            try {
                // Get products
                let fetchedProducts = await shopService.getProducts();

                // AUTOMATIC SEEDING FOR DEMO PURPOSES
                // If database is empty, seed it automatically
                if (fetchedProducts.length === 0) {
                    fetchedProducts = await shopService.seedProducts();
                    console.log("Database seeded automatically for demo.");
                }

                setProducts(fetchedProducts);
            } catch (error) {
                console.error("Error loading shop:", error);
                showToast({ type: 'error', title: 'Error', message: 'No se pudieron cargar los productos' });
            } finally {
                setLoading(false);
            }
        };

        fetchShopData();
    }, []);

    // Load trainer data if user is a trainer
    useEffect(() => {
        if (isTrainer && user) {
            trainerService.getTrainerById(user.uid).then(data => {
                setTrainerData(data);
            });
        }
    }, [isTrainer, user]);

    // Get trainer discount for eligible products
    const getTrainerDiscount = () => {
        if (!isTrainer || !trainerData) return 0;
        return trainerData.shopDiscount || 0;
    };

    // Calcular precio con descuento Premium y/o Trainer
    const getDiscountedPrice = (price, category) => {
        let finalPrice = price;

        // Apply Premium discount first
        if (isPremium) {
            finalPrice = Math.round(finalPrice * (1 - PREMIUM_DISCOUNT));
        }

        // Apply Trainer discount on eligible categories (stacks with Premium)
        const trainerDiscount = getTrainerDiscount();
        if (isTrainer && trainerDiscount > 0 && TRAINER_DISCOUNT_CATEGORIES.includes(category)) {
            finalPrice = Math.round(finalPrice * (1 - trainerDiscount));
        }

        return finalPrice;
    };

    // Check if product is eligible for trainer discount
    const isTrainerDiscountEligible = (category) => {
        return isTrainer && getTrainerDiscount() > 0 && TRAINER_DISCOUNT_CATEGORIES.includes(category);
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
        showToast({ type: 'success', title: 'Agregado', message: `${product.name} agregado al carrito` });
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, delta) => {
        setCart(cart.map(item => {
            if (item.id === productId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (getDiscountedPrice(item.price, item.category) * item.quantity), 0);
    const cartOriginalTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalSavings = cartOriginalTotal - cartTotal;
    const premiumSavings = isPremium ? cart.reduce((sum, item) => sum + (Math.round(item.price * PREMIUM_DISCOUNT) * item.quantity), 0) : 0;
    const trainerSavings = isTrainer && getTrainerDiscount() > 0
        ? cart.reduce((sum, item) => {
            if (TRAINER_DISCOUNT_CATEGORIES.includes(item.category)) {
                const priceAfterPremium = isPremium ? Math.round(item.price * (1 - PREMIUM_DISCOUNT)) : item.price;
                return sum + (Math.round(priceAfterPremium * getTrainerDiscount()) * item.quantity);
            }
            return sum;
        }, 0)
        : 0;

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24 md:pb-8">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">FITAI Store</h1>
                                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] px-2 py-0.5 rounded-full text-slate-900 font-black uppercase">
                                        Premium
                                    </span>
                                </div>
                                <p className="text-slate-400 text-sm">Suplementos, equipamiento y mÃ¡s</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 text-sm hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/20"
                        >
                            <ShoppingCart size={18} />
                            Carrito
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>

                    {/* Categories */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${selectedCategory === cat.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-900 text-slate-400 border border-white/5'
                                    }`}
                            >
                                <span>{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Premium Banner - Only for non-premium users */}
            {!isPremium && (
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Crown size={20} className="text-white" />
                            </div>
                            <div>
                                <div className="font-bold text-white">¡Hacete Premium y ahorrá hasta 15%!</div>
                                <div className="text-xs text-amber-200/60">En todos los productos de la tienda</div>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/upgrade')}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm px-4 py-2 rounded-xl hover:scale-105 transition-transform flex items-center gap-1"
                        >
                            <Zap size={14} className="fill-white" /> VER PLANES
                        </button>
                    </motion.div>
                </div>
            )}

            {/* Trust Badges */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { icon: Truck, label: 'EnvÃ­o Gratis', sublabel: '+$30.000' },
                        { icon: Shield, label: 'Calidad Premium', sublabel: 'Garantizada' },
                        { icon: CreditCard, label: 'Pago Seguro', sublabel: '100%' },
                    ].map((badge, i) => (
                        <div key={i} className="glass p-4 rounded-2xl border border-white/5 text-center">
                            <badge.icon className="mx-auto mb-2 text-blue-400" size={24} />
                            <div className="text-xs font-bold">{badge.label}</div>
                            <div className="text-[10px] text-slate-500">{badge.sublabel}</div>
                        </div>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onAdd={() => addToCart(product)}
                            onView={() => setSelectedProduct(product)}
                            isPremium={isPremium}
                            isTrainerEligible={isTrainerDiscountEligible(product.category)}
                            trainerDiscount={getTrainerDiscount()}
                            getDiscountedPrice={getDiscountedPrice}
                        />
                    ))}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-20 text-slate-600">
                        <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No se encontraron productos</p>
                    </div>
                )}
            </div>

            {/* Cart Drawer */}
            <AnimatePresence>
                {isCartOpen && (
                    <CartDrawer
                        cart={cart}
                        onClose={() => setIsCartOpen(false)}
                        onRemove={removeFromCart}
                        onUpdateQuantity={updateQuantity}
                        total={cartTotal}
                        premiumSavings={premiumSavings}
                        trainerSavings={trainerSavings}
                        isPremium={isPremium}
                        isTrainer={isTrainer}
                        trainerDiscount={getTrainerDiscount()}
                        getDiscountedPrice={getDiscountedPrice}
                    />
                )}
            </AnimatePresence>

            {/* Product Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <ProductModal
                        product={selectedProduct}
                        onClose={() => setSelectedProduct(null)}
                        onAdd={() => {
                            addToCart(selectedProduct);
                            setSelectedProduct(null);
                        }}
                    />
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
}

function ProductCard({ product, onAdd, onView, isPremium, isTrainerEligible, trainerDiscount, getDiscountedPrice }) {
    const discountedPrice = getDiscountedPrice(product.price, product.category);
    const hasDiscount = (isPremium || isTrainerEligible) && discountedPrice < product.price;

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="glass rounded-3xl border border-white/5 overflow-hidden group relative"
        >
            {/* Premium Discount Badge */}
            {isPremium && !isTrainerEligible && discountedPrice < product.price && (
                <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                    <Crown size={10} /> -15%
                </div>
            )}

            {/* Trainer Discount Badge */}
            {isTrainerEligible && (
                <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                    <GraduationCap size={10} /> -{Math.round((isPremium ? PREMIUM_DISCOUNT + trainerDiscount : trainerDiscount) * 100)}%
                </div>
            )}

            <div className="relative aspect-square bg-slate-900 flex items-center justify-center text-6xl cursor-pointer overflow-hidden" onClick={onView}>
                {product.image?.startsWith('http') ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <span>{product.image || '📦'}</span>
                )}
                {product.badge && (
                    <span className={`absolute top-3 left-3 text-[10px] font-black px-2 py-1 rounded-lg ${product.badge.includes('%')
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                        {product.badge}
                    </span>
                )}
                <button className="absolute top-3 right-3 p-2 bg-slate-800/80 rounded-full text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart size={16} />
                </button>
            </div>
            <div className="p-4">
                <div className="flex items-center gap-1 mb-1">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-yellow-400 font-bold">{product.rating}</span>
                    <span className="text-[10px] text-slate-600">({product.reviews})</span>
                </div>
                <h3 className="font-bold text-sm mb-2 line-clamp-2">{product.name}</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <span className={`text-lg font-black ${hasDiscount ? 'text-amber-400' : 'text-blue-400'}`}>
                            {formatARS(discountedPrice)}
                        </span>
                        {(product.originalPrice || hasDiscount) && (
                            <span className="text-xs text-slate-600 line-through ml-2">
                                {formatARS(product.originalPrice || product.price)}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onAdd(); }}
                        className="bg-blue-600 hover:bg-blue-500 p-2 rounded-xl transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function CartDrawer({ cart, onClose, onRemove, onUpdateQuantity, total, premiumSavings, isPremium, getDiscountedPrice }) {
    return (
        <div className="fixed inset-0 z-50">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-slate-950 border-l border-white/5 flex flex-col"
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black">Tu Carrito</h2>
                        <p className="text-xs text-slate-500">{cart.length} productos</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-slate-900">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {cart.length === 0 ? (
                        <div className="text-center py-12 text-slate-600">
                            <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
                            <p>Tu carrito estÃ¡ vacÃ­o</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="bg-slate-900 rounded-2xl p-4 flex gap-4">
                                    <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-3xl">
                                        {item.image}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm">{item.name}</h4>
                                        <p className={`font-bold ${isPremium ? 'text-amber-400' : 'text-blue-400'}`}>
                                            {formatARS(getDiscountedPrice(item.price))}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => onUpdateQuantity(item.id, -1)}
                                                className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => onUpdateQuantity(item.id, 1)}
                                                className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center"
                                            >
                                                <Plus size={12} />
                                            </button>
                                            <button
                                                onClick={() => onRemove(item.id)}
                                                className="ml-auto text-red-400 p-1"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="p-6 border-t border-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Subtotal</span>
                            <span className="font-bold">{formatARS(total)}</span>
                        </div>

                        {/* Premium Savings */}
                        {isPremium && premiumSavings > 0 && (
                            <div className="flex justify-between items-center text-amber-400 bg-amber-500/10 px-3 py-2 rounded-xl">
                                <span className="flex items-center gap-2 text-sm font-bold">
                                    <Crown size={14} /> Descuento Elite
                                </span>
                                <span className="font-black">-{formatARS(premiumSavings)}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">EnvÃ­o</span>
                            <span className="font-bold text-green-400">{total > 30000 ? 'GRATIS' : formatARS(4990)}</span>
                        </div>
                        <div className="h-px bg-white/5" />
                        <div className="flex justify-between items-center">
                            <span className="font-bold">Total</span>
                            <span className="text-2xl font-black text-blue-400">{formatARS(total + (total > 30000 ? 0 : 4990))}</span>
                        </div>
                        <button className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-colors">
                            Checkout <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

function ProductModal({ product, onClose, onAdd }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900 border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden relative z-10"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white z-20"
                >
                    <X size={20} />
                </button>

                <div className="aspect-square bg-slate-800 flex items-center justify-center text-8xl overflow-hidden">
                    {product.image?.startsWith('http') ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <span>{product.image || '📦'}</span>
                    )}
                </div>

                <div className="p-8 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        {product.badge && (
                            <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30">
                                {product.badge}
                            </span>
                        )}
                        <div className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-bold text-yellow-400">{product.rating}</span>
                            <span className="text-xs text-slate-600">({product.reviews} reviews)</span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-black">{product.name}</h2>
                    <p className="text-slate-400">{product.description}</p>

                    <div className="flex items-center justify-between pt-4">
                        <div>
                            <span className="text-3xl font-black text-blue-400">${product.price}</span>
                            {product.originalPrice && (
                                <span className="text-lg text-slate-600 line-through ml-3">${product.originalPrice}</span>
                            )}
                        </div>
                        <button
                            onClick={onAdd}
                            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-colors"
                        >
                            <ShoppingCart size={18} /> Agregar
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
