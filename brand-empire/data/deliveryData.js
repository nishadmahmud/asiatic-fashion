// Bangladesh Districts and Areas Data for Delivery
export const districts = [
    {
        name: "Dhaka",
        areas: ["Dhanmondi", "Gulshan", "Banani", "Mirpur", "Uttara", "Mohammadpur", "Badda", "Rampura", "Motijheel", "Tejgaon"],
        deliveryTime: "1-2 days",
        deliveryCharge: 60
    },
    {
        name: "Chittagong",
        areas: ["Agrabad", "Nasirabad", "Panchlaish", "Khulshi", "Halishahar", "Chawkbazar", "Kotwali"],
        deliveryTime: "2-3 days",
        deliveryCharge: 100
    },
    {
        name: "Sylhet",
        areas: ["Zindabazar", "Ambarkhana", "Uposhohor", "Shahjalal Upashahar", "Kumarpara"],
        deliveryTime: "3-4 days",
        deliveryCharge: 120
    },
    {
        name: "Rajshahi",
        areas: ["Shaheb Bazar", "Boalia", "Motihar", "Rajpara", "Kazla"],
        deliveryTime: "3-4 days",
        deliveryCharge: 120
    },
    {
        name: "Khulna",
        areas: ["Khalishpur", "Sonadanga", "Boyra", "Daulatpur", "Khan Jahan Ali"],
        deliveryTime: "3-4 days",
        deliveryCharge: 120
    },
    {
        name: "Barisal",
        areas: ["Nathullabad", "Kashipur", "Rupatali", "Bagura Road"],
        deliveryTime: "4-5 days",
        deliveryCharge: 150
    },
    {
        name: "Rangpur",
        areas: ["Munshipara", "Dhap", "Satmatha", "Jahaj Company More"],
        deliveryTime: "4-5 days",
        deliveryCharge: 150
    },
    {
        name: "Mymensingh",
        areas: ["Charpara", "Kachari", "Ganginarpar", "Akua"],
        deliveryTime: "3-4 days",
        deliveryCharge: 130
    },
    {
        name: "Comilla",
        areas: ["Kandirpar", "Laksam", "Tomsom Bridge", "Kotbari"],
        deliveryTime: "2-3 days",
        deliveryCharge: 100
    },
    {
        name: "Gazipur",
        areas: ["Tongi", "Joydevpur", "Kaliakair", "Sreepur"],
        deliveryTime: "1-2 days",
        deliveryCharge: 70
    },
    {
        name: "Narayanganj",
        areas: ["Siddhirganj", "Fatullah", "Rupganj", "Bandar"],
        deliveryTime: "1-2 days",
        deliveryCharge: 70
    },
    {
        name: "Cox's Bazar",
        areas: ["Kolatoli", "Laboni Point", "Sugandha", "Jhilanja"],
        deliveryTime: "4-5 days",
        deliveryCharge: 180
    }
];

// Helper function to search districts/areas
export const searchLocation = (query) => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    const results = [];

    districts.forEach(district => {
        // Check if district name matches
        if (district.name.toLowerCase().includes(lowerQuery)) {
            results.push({
                type: 'district',
                name: district.name,
                ...district
            });
        }

        // Check if any area matches
        district.areas.forEach(area => {
            if (area.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'area',
                    name: `${area}, ${district.name}`,
                    area: area,
                    district: district.name,
                    deliveryTime: district.deliveryTime,
                    deliveryCharge: district.deliveryCharge
                });
            }
        });
    });

    return results.slice(0, 8); // Limit to 8 results
};
