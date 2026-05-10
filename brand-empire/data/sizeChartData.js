// Size Chart Data for different product categories

export const sizeChartData = {
    shirts: {
        name: "Shirts / T-Shirts",
        columns: ["Size", "Chest (in)", "Front Length (in)", "Across Shoulder (in)"],
        columnsCm: ["Size", "Chest (cm)", "Front Length (cm)", "Across Shoulder (cm)"],
        rows: [
            { size: "S", chest: 38, frontLength: 27.5, shoulder: 16.5 },
            { size: "M", chest: 40, frontLength: 28.5, shoulder: 17 },
            { size: "L", chest: 42, frontLength: 29.5, shoulder: 17.5 },
            { size: "XL", chest: 44, frontLength: 30.5, shoulder: 18 },
            { size: "XXL", chest: 46, frontLength: 31.5, shoulder: 18.5 },
        ],
        howToMeasure: [
            { part: "Chest", instruction: "Measure around the fullest part of your chest, keeping the tape horizontal." },
            { part: "Front Length", instruction: "Measure from the highest point of the shoulder to the bottom hem." },
            { part: "Across Shoulder", instruction: "Measure from one shoulder edge to the other across the back." },
        ]
    },
    pants: {
        name: "Pants / Jeans / Trousers",
        columns: ["Size", "Waist (in)", "Hip (in)", "Inseam (in)"],
        columnsCm: ["Size", "Waist (cm)", "Hip (cm)", "Inseam (cm)"],
        rows: [
            { size: "28", waist: 28, hip: 36, inseam: 30 },
            { size: "30", waist: 30, hip: 38, inseam: 31 },
            { size: "32", waist: 32, hip: 40, inseam: 32 },
            { size: "34", waist: 34, hip: 42, inseam: 32 },
            { size: "36", waist: 36, hip: 44, inseam: 33 },
            { size: "38", waist: 38, hip: 46, inseam: 33 },
        ],
        howToMeasure: [
            { part: "Waist", instruction: "Measure around your natural waistline, keeping the tape comfortably loose." },
            { part: "Hip", instruction: "Measure around the fullest part of your hips." },
            { part: "Inseam", instruction: "Measure from the crotch seam to the bottom of the leg." },
        ]
    },
    footwear: {
        name: "Footwear",
        columns: ["UK Size", "US Size", "EU Size", "Foot Length (in)"],
        columnsCm: ["UK Size", "US Size", "EU Size", "Foot Length (cm)"],
        rows: [
            { size: "6", uk: 6, us: 7, eu: 39, footLength: 9.6 },
            { size: "7", uk: 7, us: 8, eu: 40, footLength: 9.9 },
            { size: "8", uk: 8, us: 9, eu: 41, footLength: 10.2 },
            { size: "9", uk: 9, us: 10, eu: 42, footLength: 10.5 },
            { size: "10", uk: 10, us: 11, eu: 43, footLength: 10.8 },
            { size: "11", uk: 11, us: 12, eu: 44, footLength: 11.1 },
        ],
        howToMeasure: [
            { part: "Foot Length", instruction: "Place your foot on a piece of paper and trace around it. Measure from the heel to the longest toe." },
        ]
    },
    dresses: {
        name: "Dresses / Skirts",
        columns: ["Size", "Bust (in)", "Waist (in)", "Hip (in)"],
        columnsCm: ["Size", "Bust (cm)", "Waist (cm)", "Hip (cm)"],
        rows: [
            { size: "XS", bust: 32, waist: 26, hip: 35 },
            { size: "S", bust: 34, waist: 28, hip: 37 },
            { size: "M", bust: 36, waist: 30, hip: 39 },
            { size: "L", bust: 38, waist: 32, hip: 41 },
            { size: "XL", bust: 40, waist: 34, hip: 43 },
        ],
        howToMeasure: [
            { part: "Bust", instruction: "Measure around the fullest part of your bust." },
            { part: "Waist", instruction: "Measure around your natural waistline." },
            { part: "Hip", instruction: "Measure around the fullest part of your hips." },
        ]
    },
    generic: {
        name: "General Sizing",
        columns: ["Size", "Chest (in)", "Waist (in)", "Hip (in)"],
        columnsCm: ["Size", "Chest (cm)", "Waist (cm)", "Hip (cm)"],
        rows: [
            { size: "S", chest: 36, waist: 30, hip: 38 },
            { size: "M", chest: 40, waist: 34, hip: 42 },
            { size: "L", chest: 44, waist: 38, hip: 46 },
            { size: "XL", chest: 48, waist: 42, hip: 50 },
        ],
        howToMeasure: [
            { part: "Chest", instruction: "Measure around the fullest part of your chest." },
            { part: "Waist", instruction: "Measure around your natural waistline." },
            { part: "Hip", instruction: "Measure around the fullest part of your hips." },
        ]
    }
};

// Helper function to convert inches to cm
export const inchesToCm = (inches) => {
    return (inches * 2.54).toFixed(1);
};

// Helper function to detect product type from name/category
export const detectProductType = (productName, categoryName = "", subcategoryName = "") => {
    const searchText = `${productName} ${categoryName} ${subcategoryName}`.toLowerCase();

    // Shirts detection
    if (/shirt|tshirt|t-shirt|polo|formal|casual shirt|sweat\s?shirt/.test(searchText)) {
        return "shirts";
    }

    // Pants detection
    if (/jeans|trouser|pant|chino|short|jogger|cargo/.test(searchText)) {
        return "pants";
    }

    // Footwear detection
    if (/shoe|sneaker|boot|sandal|slipper|loafer|flip\s?flop/.test(searchText)) {
        return "footwear";
    }

    // Dresses detection
    if (/dress|gown|skirt|kurti|kurta|saree|lehenga/.test(searchText)) {
        return "dresses";
    }

    // Default to generic
    return "generic";
};
