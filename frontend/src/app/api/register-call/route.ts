import { logger } from "@/lib/logger";
import { InterviewerService } from "@/services/interviewers.service";
import { NextResponse } from "next/server";
import Retell from "retell-sdk";

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function POST(req: Request) {
  logger.info("register-call request received");

  try {
    if (!process.env.RETELL_API_KEY) {
      logger.error("RETELL_API_KEY is not set");
      return NextResponse.json(
        { error: "RETELL_API_KEY is not configured on the server." },
        { status: 500 },
      );
    }

    const body = await req.json();
    const interviewerId = body.interviewer_id;
    const interviewer = await InterviewerService.getInterviewer(interviewerId);

    const registerCallResponse = await retellClient.call.createWebCall({
      agent_id: interviewer?.agent_id,
      retell_llm_dynamic_variables: body.dynamic_data,
    });

    logger.info("Call registered successfully");

    return NextResponse.json({ registerCallResponse }, { status: 200 });
  } catch (error: any) {
    logger.error("register-call failed:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to register call" },
      { status: error?.status || 500 },
    );
  }
}
