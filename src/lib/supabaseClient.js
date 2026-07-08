import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fwdtlsifokuwgogypwnw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_y8PU97baK_Sj-s7JLBkQ6w_YnLCLty2";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
