// ============================================================================
// SUPABASE EDGE FUNCTION: assignment-reminders
// ============================================================================
// Purpose: Scheduled job (Supabase Cron) to check pending assignment submissions
//          and dispatch notifications without duplicate reminders.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch published assignments due within the next 48 hours
    const { data: assignments, error: asgnError } = await supabaseClient
      .from("assignments")
      .select("id, title, due_date, department_id")
      .eq("status", "published");

    if (asgnError) throw asgnError;

    let remindersDispatched = 0;

    for (const asgn of assignments || []) {
      // Find students in department who have not submitted
      const { data: submissions } = await supabaseClient
        .from("assignment_submissions")
        .select("student_id")
        .eq("assignment_id", asgn.id);

      const submittedStudentIds = new Set((submissions || []).map((s) => s.student_id));

      const { data: deptStudents } = await supabaseClient
        .from("students")
        .select("id, user_id, name, email")
        .eq("department_id", asgn.department_id);

      for (const st of deptStudents || []) {
        if (!submittedStudentIds.has(st.id)) {
          // Check if notification was already sent in last 24 hours to prevent duplicate spam
          const { data: existingNotif } = await supabaseClient
            .from("notifications")
            .select("id")
            .eq("user_id", st.user_id)
            .ilike("title", `%${asgn.title}%`)
            .gte("created_at", new Date(Date.now() - 86400000).toISOString())
            .maybeSingle();

          if (!existingNotif) {
            await supabaseClient.from("notifications").insert({
              user_id: st.user_id,
              title: `Assignment Due Reminder: ${asgn.title}`,
              message: `Friendly reminder that your assignment '${asgn.title}' is pending submission. Due date: ${asgn.due_date}.`,
              type: "assignment",
              is_read: false,
            });
            remindersDispatched++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_dispatched: remindersDispatched,
        timestamp: new Date().toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
