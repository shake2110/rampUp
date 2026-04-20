const { createClient } = require("@supabase/supabase-js");

// Try loading next config or just require to see if it blows up
try {
  const service = require("./src/services/interviews.service.ts");
} catch(e) {
  console.log("Error loading service:", e);
}
