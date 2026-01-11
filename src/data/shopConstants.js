// Shop Constants - Clean UTF-8 version
export const CATEGORIES = [
    { id: 'all', label: 'Todos', icon: '🔥' },
    { id: 'supplements', label: 'Suplementos', icon: '💊' },
    { id: 'protein', label: 'Proteinas', icon: '🥤' },
    { id: 'apparel', label: 'Ropa', icon: '👕' },
    { id: 'equipment', label: 'Equipamiento', icon: '🏋️' },
    { id: 'coaching', label: 'Coaching', icon: '🎯' },
];

// Precios en Pesos Argentinos (ARS)
export const PRODUCTS = [
    // Suplementos
    { id: 1, name: 'Whey Protein Isolate', category: 'protein', price: 45990, rating: 4.9, reviews: 234, image: '🥤', badge: 'Bestseller', description: 'Proteina de suero aislada de maxima pureza. 27g de proteina por servicio.', stock: 50 },
    { id: 2, name: 'Creatina Monohidrato', category: 'supplements', price: 27990, rating: 4.8, reviews: 189, image: '💊', badge: 'Premium', description: 'Creatina micronizada para maxima absorcion. 5g por servicio.', stock: 75 },
    { id: 3, name: 'Pre-Workout Elite', category: 'supplements', price: 35990, originalPrice: 44990, rating: 4.7, reviews: 156, image: '⚡', badge: '-20%', description: 'Formula avanzada con citrulina, beta-alanina y cafeina.', stock: 30 },
    { id: 4, name: 'BCAA 2:1:1', category: 'supplements', price: 31990, rating: 4.6, reviews: 98, image: '💧', description: 'Aminoacidos de cadena ramificada para recuperacion optima.', stock: 45 },
    { id: 5, name: 'Mass Gainer 3000', category: 'protein', price: 52990, rating: 4.5, reviews: 67, image: '🍫', description: 'Ganador de masa con 1200 calorias por servicio.', stock: 25 },
    { id: 6, name: 'Caseina Premium', category: 'protein', price: 41990, rating: 4.8, reviews: 112, image: '🌙', badge: 'Night Recovery', description: 'Proteina de liberacion lenta para recuperacion nocturna.', stock: 40 },

    // Ropa
    { id: 7, name: 'Camiseta FITAI Pro', category: 'apparel', price: 18990, rating: 4.9, reviews: 203, image: '👕', badge: 'Nueva', description: 'Camiseta tecnica con tecnologia DryFit.', stock: 100 },
    { id: 8, name: 'Shorts Training Elite', category: 'apparel', price: 22990, rating: 4.7, reviews: 87, image: '🩳', description: 'Shorts con bolsillos laterales y tejido transpirable.', stock: 60 },
    { id: 9, name: 'Sudadera Oversize', category: 'apparel', price: 34990, rating: 4.8, reviews: 134, image: '🧥', description: 'Sudadera premium para tus dias de recovery.', stock: 35 },
    { id: 10, name: 'Calcetines Performance', category: 'apparel', price: 8990, rating: 4.6, reviews: 56, image: '🧦', description: 'Pack de 3 pares con compresion media.', stock: 150 },

    // Equipamiento
    { id: 11, name: 'Bandas de Resistencia Pro', category: 'equipment', price: 15990, rating: 4.8, reviews: 178, image: '🏋️', badge: 'Top Ventas', description: 'Set de 5 bandas con diferentes resistencias.', stock: 80 },
    { id: 12, name: 'Foam Roller Premium', category: 'equipment', price: 19990, rating: 4.7, reviews: 92, image: '🔴', description: 'Rodillo de espuma para liberacion miofascial.', stock: 55 },
    { id: 13, name: 'Guantes Training', category: 'equipment', price: 12990, rating: 4.5, reviews: 123, image: '🧤', description: 'Guantes con palma antideslizante.', stock: 90 },
    { id: 14, name: 'Cinturon Lumbar', category: 'equipment', price: 38990, rating: 4.9, reviews: 201, image: '🔗', badge: 'Pro Choice', description: 'Cinturon de cuero para levantamientos pesados.', stock: 30 },
    { id: 15, name: 'Munequeras Power', category: 'equipment', price: 9990, rating: 4.6, reviews: 78, image: '✊', description: 'Soporte de muneca para press y pesos libres.', stock: 120 },

    // Coaching
    { id: 16, name: 'Plan Mensual FITAI PRO', category: 'coaching', price: 9990, rating: 5.0, reviews: 312, image: '🎯', badge: 'Suscripcion', description: 'Rutinas y dietas personalizadas con IA + soporte.', stock: 999 },
    { id: 17, name: 'Asesoria 1:1 (4 semanas)', category: 'coaching', price: 89990, rating: 4.9, reviews: 45, image: '🏆', badge: 'VIP', description: 'Coaching personalizado con un entrenador experto.', stock: 10 },
    { id: 18, name: 'Curso: Nutricion Avanzada', category: 'coaching', price: 49990, originalPrice: 69990, rating: 4.8, reviews: 89, image: '📚', badge: '-28%', description: 'Domina la nutricion deportiva con este curso completo.', stock: 999 },
];
