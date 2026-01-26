export function adaptWheelFromDB(row: any) {
    return {
        id: row.id,
        name: row.name,
        brand: row.brand,
        size: row.size,
        boltPattern: row.bolt_pattern,
        finish: row.finish,
        mainImage: row.main_image || "",
        totalQuantity: row.total_quantity || 1,
        generalDescription: row.general_description || "",

        defectTags: row.wheel_defects
            ? row.wheel_defects.map((d: any) => d.defect)
            : [],

        individualWheels: [], // depois a gente liga isso
    };
}
