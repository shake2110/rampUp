import { logger } from "@/lib/logger";
import { InterviewService } from "@/services/interviews.service";
import { createServerClient } from "@/utils/supabase";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

const base_url = process.env.NEXT_PUBLIC_LIVE_URL;

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const url_id = nanoid();
    const url = `/call/${url_id}`;
    const body = await req.json();

    logger.info("create-interview request received");

    const payload = body.interviewData;

    let readableSlug = null;
    if (body.organizationName) {
      const interviewNameSlug = payload.name?.toLowerCase().replace(/\s/g, "-");
      const orgNameSlug = body.organizationName?.toLowerCase().replace(/\s/g, "-");
      readableSlug = `${orgNameSlug}-${interviewNameSlug}`;
    }

    const newInterview = await InterviewService.createInterview(
      {
        ...payload,
        url: url,
        id: url_id,
        readable_slug: readableSlug,
      },
      supabase,
    );

    logger.info("Interview created successfully");

    return NextResponse.json({ response: "Interview created successfully" }, { status: 200 });
  } catch (err: any) {
    console.error("FULL ERROR IN create-interview:", err);
    logger.error("Error creating interview:", err);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: err.message || err,
      },
      { status: 500 },
    );
  }
}
