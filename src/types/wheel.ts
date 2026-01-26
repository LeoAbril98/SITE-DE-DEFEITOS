// types.ts

// =========================
// RODA INDIVIDUAL (BANCO)
// =========================
export interface IndividualWheel {
    id: string;
    model: string;
    brand?: string;
    size: string;
    bolt_pattern: string;
    finish: string;
    wheel_offset: number;
    description: string;
    defects: string[];
    photos: string[]; // Aqui continuaremos salvando as 3 fotos
    video_url?: string; // Nova propriedade para o vídeo
}

// =========================
// GRUPO DE RODAS (FRONT)
// =========================
export interface WheelGroup {
    id: string; // chave gerada no front (model+size+bolt+finish)

    model: string;
    brand: string;
    size: string;
    boltPattern: string;
    finish: string;

    quantity: number;
    defectTags: string[];
    wheels: IndividualWheel[];
}

// =========================
// FILTROS
// =========================
export type FilterState = {
    search: string;
    model: string;
    size: string;
    boltPattern: string;
    finish: string;
    defectType: string;
};
