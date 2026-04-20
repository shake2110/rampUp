import { createClient } from "@/lib/supabase";

const getClient = (clientOrId?: any) => {
  // If it's a string, it's a legacy clientId, so we use the default client
  if (typeof clientOrId === "string" || !clientOrId) {
    return createClient();
  }
  return clientOrId;
};

const getAllInterviewers = async (client?: any) => {
  const supabase = getClient(client);
  try {
    const { data: clientData, error: clientError } = await supabase.from("interviewer").select("*");

    if (clientError) {
      console.error(
        `Supabase Error [${clientError.code}]: ${clientError.message}`,
        clientError.details,
      );
      return [];
    }

    return clientData || [];
  } catch (error) {
    console.error("Service Error:", error);
    return [];
  }
};

const createInterviewer = async (payload: any, client?: any) => {
  const supabase = getClient(client);
  // Check for existing interviewer with the same name
  const { data: existingInterviewer, error: checkError } = await supabase
    .from("interviewer")
    .select("*")
    .eq("name", payload.name)
    .filter("agent_id", "eq", payload.agent_id)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    console.error("Error checking existing interviewer:", checkError);
    return null;
  }

  if (existingInterviewer) {
    console.error("An interviewer with this name already exists");
    return null;
  }

  const { error, data } = await supabase.from("interviewer").insert({ ...payload });

  if (error) {
    console.error("Error creating interviewer:", error);
    return null;
  }

  return data;
};

const getInterviewer = async (interviewerId: bigint, client?: any) => {
  const supabase = getClient(client);
  const { data: interviewerData, error: interviewerError } = await supabase
    .from("interviewer")
    .select("*")
    .eq("id", interviewerId)
    .single();

  if (interviewerError) {
    console.error("Error fetching interviewer:", interviewerError);
    return null;
  }

  return interviewerData;
};

export const InterviewerService = {
  getAllInterviewers,
  createInterviewer,
  getInterviewer,
};
