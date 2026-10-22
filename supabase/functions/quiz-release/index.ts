// ============================================================================
// SUPABASE EDGE FUNCTION: quiz-release
// ============================================================================
// Purpose: Secure server-side release or withholding of quiz scores
//          by authorized faculty members.
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

    const { quiz_id, publish } = await req.json();

    if (!quiz_id) {
      return new Response(JSON.stringify({ error: "quiz_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update quiz release state in database
    const { data: updatedQuiz, error: updateError } = await supabaseClient
      .from("quizzes")
      .update({
        results_published: Boolean(publish),
        updated_at: new Date().toISOString(),
      })
      .eq("id", quiz_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        quiz_id,
        results_published: Boolean(publish),
        message: publish
          ? "Quiz scores and answer feedback released to students."
          : "Quiz scores withheld from students.",
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
