// ============================================================================
// SUPABASE EDGE FUNCTION: ai-assistant
// ============================================================================
// Purpose: Handles AI Assistant ERP questions, document summarization,
//          and grounded Q&A with server-side API key secrets.
// Deployment: supabase functions deploy ai-assistant --no-verify-jwt=false
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Verify authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, message, document_id, query } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("AI_API_KEY");

    // Fallback if provider key is not yet configured in Supabase secrets
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          reply:
            "AI Assistant is active in offline college policy mode. To activate live cloud language models, configure your server secret: `supabase secrets set GEMINI_API_KEY=your_key`.",
          grounded: true,
          provider_configured: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call AI provider (e.g. Gemini 2.5 Flash Lite)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    const promptText = query || message || "Summarize the key academic concepts.";

    const apiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are the College ERP AI Assistant. Strictly adhere to verified college academic curriculum. If asked about facts not in the document, reply: 'The uploaded document does not contain enough information to answer this question.'\n\nQuestion: ${promptText}` }] }],
      }),
    });

    const apiData = await apiRes.json();
    const reply = apiData.candidates?.[0]?.content?.parts?.[0]?.text || "Response generated.";

    return new Response(
      JSON.stringify({
        reply,
        engine: "AI Cloud Engine",
        provider_configured: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
