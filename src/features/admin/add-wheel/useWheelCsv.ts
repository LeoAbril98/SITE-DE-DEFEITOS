import { useEffect, useState } from "react";
import Papa from "papaparse";
import { WheelCSV } from "./types";

export function useWheelCsv() {
    const [wheels, setWheels] = useState<WheelCSV[]>([]);
    const [models, setModels] = useState<string[]>([]);

    useEffect(() => {
        fetch("/wheels.csv")
            .then((res) => res.text())
            .then((csvText) => {
                const parsed = Papa.parse(csvText, {
                    header: true,
                    delimiter: ";",
                    skipEmptyLines: true,
                    transformHeader: (h) =>
                        h
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .toLowerCase(),
                });

                const data = (parsed.data as any[])
                    .map((row) => ({
                        modelo: row.modelo,
                        aro: row.aro,
                        furacao: row.furacao || row["furac�o"],
                        offset: row.offset,
                        acabamento: row.acabamento,
                    }))
                    .filter((r) => r.modelo && r.aro && r.furacao);

                setWheels(data);
                setModels([...new Set(data.map((d) => d.modelo))]);
            });
    }, []);

    return { wheels, models };
}
