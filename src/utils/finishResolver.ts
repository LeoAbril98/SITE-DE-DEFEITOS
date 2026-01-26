// utils/finishResolver.ts

/**
 * CAMADA 1 & 2 — Extração Automática
 * Pega o código dentro dos parênteses.
 * Exemplo: "BLACK DIAMOND (BD)" -> retorna "BD"
 */
export function resolveFinishCode(finish: string): string | null {
    if (!finish) return null;

    const normalized = finish.trim();

    // Expressão Regular para encontrar o conteúdo dentro dos parênteses
    const match = normalized.match(/\(([^)]+)\)/);

    if (match && match[1]) {
        // Retorna o que está dentro (ex: BD, BZF, OVF) sempre em maiúsculo
        return match[1].toUpperCase().trim();
    }

    // Caso não existam parênteses (ex: "POLIDA"), limpa o nome e usa como código
    return normalized.toUpperCase().replace(/\s+/g, "");
}

/**
 * CAMADA 3 — código → imagem
 * Retorna o nome do arquivo final (ex: "BD.jpg")
 */
export function resolveFinishImage(finish: string): string | null {
    const code = resolveFinishCode(finish);

    // Se o código for "BRUTA ()" ou vazio, retorna null para cair no fallback da foto real
    if (!code || code === "") return null;

    return `${code}.jpg`;
}
