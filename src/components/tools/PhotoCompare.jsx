import React, { useState } from 'react';
import { ImagePlus, SlidersHorizontal } from 'lucide-react';

const PhotoCompare = () => {
    const [leftImage, setLeftImage] = useState(null);
    const [rightImage, setRightImage] = useState(null);
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);

    const handleImageUpload = (e, side) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (side === 'left') setLeftImage(reader.result);
                else setRightImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrag = (e) => {
        if (!isDragging) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPos(percent);
    };

    return (
        <div className="bg-slate-900 rounded-3xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <SlidersHorizontal className="text-purple-400" /> Comparador de Progreso
            </h2>

            {/* Upload Area */}
            <div className="flex gap-4 mb-6">
                {[
                    { label: 'ANTES', side: 'left', img: leftImage },
                    { label: 'AHORA', side: 'right', img: rightImage }
                ].map(({ label, side, img }) => (
                    <div key={side} className="flex-1">
                        <label className="block bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-600 hover:border-slate-500 rounded-xl aspect-[3/4] cursor-pointer flex flex-col items-center justify-center transition-colors relative overflow-hidden group">
                            {img ? (
                                <img src={img} alt={label} className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <ImagePlus className="text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold text-slate-400">{label}</span>
                                </>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, side)} />
                            {img && <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">CAMBIAR</div>}
                        </label>
                    </div>
                ))}
            </div>

            {/* Comparison Slider */}
            {leftImage && rightImage ? (
                <div
                    className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden cursor-ew-resize select-none touch-none"
                    onMouseMove={handleDrag}
                    onTouchMove={handleDrag}
                    onMouseDown={() => setIsDragging(true)}
                    onTouchStart={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onTouchEnd={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                >
                    {/* Background Image (Right/After) */}
                    <img src={rightImage} alt="After" className="absolute inset-0 w-full h-full object-cover" />

                    {/* Foreground Image (Left/Before) - Clipped */}
                    <div
                        className="absolute inset-0 overflow-hidden border-r-2 border-white/80"
                        style={{ width: `${sliderPos}%` }}
                    >
                        <img src={leftImage} alt="Before" className="absolute inset-0 w-full h-full object-cover max-w-none" style={{ width: '100vw' }} />
                        {/* Note: max-w-none and width 100vw (or container width) is key for sync. 
                           Ideally calculated based on container ref. 
                           For simplified responsive: object-cover on both usually aligns if aspect ratio matches. 
                           If images differ, alignment breaks. 
                           Fix: Force images to fit container. */}
                    </div>

                    {/* Slider Handle */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center z-10 pointer-events-none"
                        style={{ left: `calc(${sliderPos}% - 16px)` }}
                    >
                        <SlidersHorizontal size={16} className="text-slate-900" />
                    </div>

                    {/* Labels overlay */}
                    <div className="absolute top-4 left-4 bg-black/50 px-2 py-1 rounded text-xs font-bold text-white pointer-events-none">ANTES</div>
                    <div className="absolute top-4 right-4 bg-black/50 px-2 py-1 rounded text-xs font-bold text-white pointer-events-none">AHORA</div>
                </div>
            ) : (
                <div className="bg-slate-800/50 rounded-2xl p-8 text-center text-slate-500 text-sm">
                    Sube dos fotos para habilitar el comparador deslizante.
                </div>
            )}
        </div>
    );
};

export default PhotoCompare;
