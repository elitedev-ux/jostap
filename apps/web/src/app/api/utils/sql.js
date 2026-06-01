import { hasSupabase } from "./supabase.js";

const NullishQueryFunction = () => {
  throw new Error(
    "Direct SQL queries have been removed. Use the Supabase client helpers instead.",
  );
};
NullishQueryFunction.transaction = () => {
  throw new Error(
    "Direct SQL transactions have been removed. Use the Supabase client helpers instead.",
  );
};
const sql = NullishQueryFunction;

export function hasDatabase() {
  return hasSupabase();
}

export default sql;
