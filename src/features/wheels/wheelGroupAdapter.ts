import { IndividualWheel, WheelGroup } from "../../types/wheel";

export function groupWheels(rows: IndividualWheel[]): WheelGroup[] {
    const map = new Map<string, WheelGroup>();

    rows.forEach((row) => {
        // Chave de agrupamento: modelo, marca, aro, furação e acabamento
        const key = [
            row.model,
            row.brand,
            row.size,
            row.bolt_pattern,
            row.finish,
        ].join("|");

        // Cria o grupo se ainda não existir
        if (!map.has(key)) {
            map.set(key, {
                id: key,
                model: row.model,
                brand: row.brand || "",
                size: row.size,
                boltPattern: row.bolt_pattern,
                finish: row.finish,
                quantity: 0,
                defectTags: [],
                wheels: [],
            });
        }

        const group = map.get(key)!;

        // ✅ Preserva TODOS os campos da roda (inclusive video_url)
        const wheel: IndividualWheel = {
            ...row,
            defects: row.defects ?? [],
            photos: row.photos ?? [],
        };

        group.wheels.push(wheel);
        group.quantity += 1;

        // Coleta defeitos únicos do grupo
        wheel.defects.forEach((defect) => {
            if (!group.defectTags.includes(defect)) {
                group.defectTags.push(defect);
            }
        });
    });

    return Array.from(map.values());
}
