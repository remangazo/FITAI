/**
 * usePremium Hook
 * 
 * Hook centralizado para verificar estado Premium y límites del usuario.
 * Controla acceso a funcionalidades y descuentos en tienda.
 */

import { useAuth } from '../context/AuthContext';

// Categorías de productos con descuento Premium
const DISCOUNTABLE_CATEGORIES = [
    'supplements',      // Suplementos
    'accessories',      // Accesorios (straps, cinturones, etc.)
    'apparel',          // Ropa deportiva
    'nutrition'         // Productos de nutrición
];

// Categorías SIN descuento (margen bajo o marcas premium)
const NO_DISCOUNT_CATEGORIES = [
    'equipment',        // Equipamiento pesado (barras, discos)
    'machines',         // Máquinas
    'branded'           // Productos de marca premium
];

// Límites para usuarios Free
const FREE_LIMITS = {
    routineGenerationsPerMonth: 1,
    maxActiveRoutines: 1,
    historyDays: 14,
    hasFullAICoach: false,
    hasCustomDiet: false,
    hasExportPDF: false,
    storeDiscount: 0,
    freeShippingMinimum: null  // Sin envío gratis
};

// Beneficios Premium
const PREMIUM_BENEFITS = {
    routineGenerationsPerMonth: Infinity,
    maxActiveRoutines: 5,
    historyDays: Infinity,
    hasFullAICoach: true,
    hasCustomDiet: true,
    hasExportPDF: true,
    storeDiscount: 0.10,        // 10% descuento
    freeShippingMinimum: 30     // Envío gratis en compras +$30
};

export const usePremium = () => {
    const { profile } = useAuth();

    // Estado Premium
    const isPremium = profile?.isPremium === true;
    const premiumSince = profile?.premiumSince?.toDate?.() || null;
    const premiumUntil = profile?.premiumUntil?.toDate?.() || null;
    const subscriptionType = profile?.subscriptionType || null;

    // Obtener límites según estado
    const limits = isPremium ? PREMIUM_BENEFITS : FREE_LIMITS;

    // Uso mensual actual (solo relevante para Free)
    const currentMonthUsage = profile?.monthlyUsage || {
        routineGenerations: 0,
        resetDate: null
    };

    /**
     * Verificar si puede generar una rutina
     */
    const canGenerateRoutine = () => {
        if (isPremium) return true;
        return currentMonthUsage.routineGenerations < FREE_LIMITS.routineGenerationsPerMonth;
    };

    /**
     * Obtener rutinas restantes este mes
     */
    const getRoutinesRemaining = () => {
        if (isPremium) return Infinity;
        return Math.max(0, FREE_LIMITS.routineGenerationsPerMonth - currentMonthUsage.routineGenerations);
    };

    /**
     * Verificar si puede acceder al AI Coach completo
     */
    const canAccessFullAICoach = () => isPremium;

    /**
     * Verificar si puede exportar a PDF
     */
    const canExportPDF = () => isPremium;

    /**
     * Calcular descuento para un producto
     * @param {Object} product - { category, price, isBranded }
     * @returns {number} Porcentaje de descuento (0 a 1)
     */
    const getProductDiscount = (product) => {
        if (!isPremium) return 0;

        // Verificar si la categoría tiene descuento
        if (NO_DISCOUNT_CATEGORIES.includes(product?.category)) return 0;
        if (product?.isBranded) return 0;

        if (DISCOUNTABLE_CATEGORIES.includes(product?.category)) {
            return PREMIUM_BENEFITS.storeDiscount;
        }

        return 0;
    };

    /**
     * Calcular precio con descuento Premium
     */
    const getPremiumPrice = (product) => {
        const discount = getProductDiscount(product);
        return {
            originalPrice: product.price,
            finalPrice: product.price * (1 - discount),
            discount: discount,
            saved: product.price * discount
        };
    };

    /**
     * Verificar si califica para envío gratis
     */
    const hasFreeShipping = (cartTotal) => {
        if (!isPremium) return false;
        return cartTotal >= PREMIUM_BENEFITS.freeShippingMinimum;
    };

    /**
     * Calcular cuánto falta para envío gratis
     */
    const amountForFreeShipping = (cartTotal) => {
        if (!isPremium) return null;
        const remaining = PREMIUM_BENEFITS.freeShippingMinimum - cartTotal;
        return remaining > 0 ? remaining : 0;
    };

    /**
     * Obtener días de historial disponibles
     */
    const getHistoryDaysLimit = () => limits.historyDays;

    return {
        // Estado
        isPremium,
        premiumSince,
        premiumUntil,
        subscriptionType,
        limits,

        // Funcionalidades
        canGenerateRoutine,
        getRoutinesRemaining,
        canAccessFullAICoach,
        canExportPDF,
        getHistoryDaysLimit,

        // Tienda
        getProductDiscount,
        getPremiumPrice,
        hasFreeShipping,
        amountForFreeShipping,

        // Constantes exportadas para referencia
        DISCOUNTABLE_CATEGORIES,
        NO_DISCOUNT_CATEGORIES
    };
};

export default usePremium;
