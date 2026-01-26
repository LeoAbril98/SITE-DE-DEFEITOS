import { supabase } from "../lib/supabase";

export async function fetchWheels() {
    const { data, error } = await supabase
        .from("wheels")
        .select("*")
        .order("name");

    if (error) {
        console.error(error);
        throw error;
    }

    return data;
}
