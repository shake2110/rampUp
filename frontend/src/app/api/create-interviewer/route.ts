import { INTERVIEWERS, RETELL_AGENT_GENERAL_PROMPT } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { InterviewerService } from "@/services/interviewers.service";
import { createServerClient } from "@/utils/supabase";
import { type NextRequest, NextResponse } from "next/server";
import Retell from "retell-sdk";

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function GET(res: NextRequest) {
  logger.info("create-interviewer request received");
  const supabase = await createServerClient();

  try {
    let lisaAgentId = "mock-lisa-agent";
    let bobAgentId = "mock-bob-agent";

    // Only attempt to call Retell if a key is provided
    if (process.env.RETELL_API_KEY) {
      try {
        const newModel = await retellClient.llm.create({
          model: "gpt-4o",
          general_prompt: RETELL_AGENT_GENERAL_PROMPT,
          general_tools: [
            {
              type: "end_call",
              name: "end_call_1",
              description:
                "End the call if the user uses goodbye phrases such as 'bye,' 'goodbye,' or 'have a nice day.' ",
            },
          ],
        });

        // Create Lisa
        const newFirstAgent = await retellClient.agent.create({
          response_engine: { llm_id: newModel.llm_id, type: "retell-llm" },
          voice_id: "11labs-Chloe",
          agent_name: "Lisa",
        });
        lisaAgentId = newFirstAgent.agent_id;

        // Create Bob
        const newSecondAgent = await retellClient.agent.create({
          response_engine: { llm_id: newModel.llm_id, type: "retell-llm" },
          voice_id: "11labs-Brian",
          agent_name: "Bob",
        });
        bobAgentId = newSecondAgent.agent_id;
      } catch (retellErr) {
        console.error("Retell error, falling back to mock IDs:", retellErr);
      }
    } else {
      logger.info("RETELL_API_KEY missing, using mock IDs for interviewers");
    }

    const newInterviewer = await InterviewerService.createInterviewer(
      {
        agent_id: lisaAgentId,
        ...INTERVIEWERS.LISA,
      },
      supabase,
    );

    const newSecondInterviewer = await InterviewerService.createInterviewer(
      {
        agent_id: bobAgentId,
        ...INTERVIEWERS.BOB,
      },
      supabase,
    );

    return NextResponse.json(
      {
        newInterviewer,
        newSecondInterviewer,
      },
      { status: 200 },
    );
  } catch (error: any) {
    logger.error("Error creating interviewers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create interviewers" },
      { status: 500 },
    );
  }
}
