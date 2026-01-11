import { jsPDF } from 'jspdf';

/**
 * Service to export detailed routine to PDF
 * @param {Object} routine - The routine object to export
 * @param {Object} userProfile - User profile for personalization
 */
export const exportRoutineToPDF = (routine, userProfile) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Helper to center text
    const centerText = (text, y) => {
        const textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
    };

    // Helper to check page break
    const checkPageBreak = (height = 10) => {
        if (yPos + height > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPos = 20;
        }
    };

    // --- HEADER ---
    doc.setFillColor(59, 130, 246); // Blue header
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(routine.name || 'Mi Rutina', margin, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (userProfile?.name) {
        doc.text(`Generado para: ${userProfile.name}`, margin, 35);
    }

    doc.text('FitAI Personal', pageWidth - margin - 30, 35);

    yPos = 55;
    doc.setTextColor(0, 0, 0);

    // --- ROUTINE INFO ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen:', margin, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const goalMap = {
        'lose_weight': 'Pérdida de Peso',
        'gain_muscle': 'Ganancia Muscular',
        'maintenance': 'Mantenimiento'
    };

    const levelMap = {
        'beginner': 'Principiante',
        'intermediate': 'Intermedio',
        'advanced': 'Avanzado'
    };

    doc.text(`Objetivo: ${goalMap[routine.goal] || routine.goal || 'General'}`, margin, yPos);
    doc.text(`Nivel: ${levelMap[routine.difficulty] || routine.difficulty || 'General'}`, pageWidth / 2, yPos);
    yPos += 15;

    // --- DAYS ---
    if (routine.days && routine.days.length > 0) {
        routine.days.forEach((day, index) => {
            checkPageBreak(40);

            // Day Header
            doc.setFillColor(243, 244, 246); // Light gray
            doc.setDrawColor(229, 231, 235);
            doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 10, 2, 2, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(31, 41, 55);
            doc.text(`Día ${index + 1}: ${day.split_name || 'Entrenamiento'}`, margin + 5, yPos + 7);

            yPos += 18;

            // Exercises Table Header
            doc.setFontSize(9);
            doc.setTextColor(107, 114, 128); // Gray 500
            doc.text('EJERCICIO', margin + 5, yPos);
            doc.text('SERIES', pageWidth - margin - 80, yPos);
            doc.text('REPS', pageWidth - margin - 50, yPos);
            doc.text('DESCANSO', pageWidth - margin - 20, yPos);

            yPos += 3;
            doc.setDrawColor(229, 231, 235);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;

            // Exercises
            if (day.exercises && day.exercises.length > 0) {
                day.exercises.forEach((ex) => {
                    checkPageBreak(15);

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.setTextColor(0, 0, 0);

                    // Exercise Name (handle long names)
                    const name = ex.name;
                    if (name.length > 40) {
                        doc.text(name.substring(0, 37) + '...', margin + 5, yPos);
                    } else {
                        doc.text(name, margin + 5, yPos);
                    }

                    doc.setFont('helvetica', 'normal');
                    // Details
                    doc.text(`${ex.sets}`, pageWidth - margin - 75, yPos);
                    doc.text(`${ex.reps}`, pageWidth - margin - 45, yPos);
                    doc.text(`${ex.rest || 60}s`, pageWidth - margin - 15, yPos);

                    // Muscle group if available
                    if (ex.muscle_group) {
                        yPos += 4;
                        doc.setFontSize(8);
                        doc.setTextColor(156, 163, 175);
                        doc.text(ex.muscle_group, margin + 5, yPos);
                        yPos += 6;
                    } else {
                        yPos += 10;
                    }

                    // Separator line
                    doc.setDrawColor(243, 244, 246);
                    doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);
                });
            } else {
                checkPageBreak(10);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(156, 163, 175);
                doc.text('Descanso / Sin ejercicios', margin + 5, yPos);
                yPos += 10;
            }

            yPos += 10; // Space between days
        });
    }

    // --- FOOTER ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Página ${i} de ${pageCount} - FitAI Personal`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`Rutina_FitAI_${routine.name?.replace(/\s+/g, '_') || 'Personal'}.pdf`);
};
