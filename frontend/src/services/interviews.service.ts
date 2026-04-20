import { createClient } from "@/lib/supabase";

const getClient = (client?: any) => {
  return client || createClient();
};

const getAllInterviews = async (userId: string, organizationId: string, client?: any) => {
  const supabase = getClient(client);
  try {
    const { data: clientData, error: clientError } = await supabase
      .from("interview")
      .select("*")
      .or(`organization_id.eq.${organizationId},user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (clientError) {
      throw clientError;
    }

    return [...(clientData || [])];
  } catch (error) {
    console.error("Error fetching all interviews:", error);
    return [];
  }
};

const getInterviewById = async (id: string, client?: any) => {
  const supabase = getClient(client);
  try {
    const { data, error } = await supabase
      .from("interview")
      .select("*")
      .or(`id.eq.${id},readable_slug.eq.${id}`);

    if (error) {
      throw error;
    }
    return data ? data[0] : null;
  } catch (error) {
    console.error(`Error fetching interview ${id}:`, error);
    return null;
  }
};

const updateInterview = async (payload: any, id: string, client?: any) => {
  const supabase = getClient(client);
  const { error, data } = await supabase
    .from("interview")
    .update({ ...payload })
    .eq("id", id);

  if (error) {
    console.error(`Error updating interview ${id}:`, error);
    return null;
  }

  return data;
};

const deleteInterview = async (id: string, client?: any) => {
  const supabase = getClient(client);
  const { error, data } = await supabase.from("interview").delete().eq("id", id);
  if (error) {
    console.error(`Error deleting interview ${id}:`, error);
    return null;
  }

  return data;
};

const getAllRespondents = async (interviewId: string, client?: any) => {
  const supabase = getClient(client);
  try {
    const { data, error } = await supabase
      .from("interview")
      .select("respondents")
      .eq("interview_id", interviewId);

    if (error) {
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error(`Error fetching respondents for ${interviewId}:`, error);
    return [];
  }
};

const createInterview = async (payload: any, client?: any) => {
  const supabase = getClient(client);
  const { error, data } = await supabase.from("interview").insert({ ...payload });

  if (error) {
    console.error("Error creating interview:", error);
    throw error;
  }

  return data;
};

const deactivateInterviewsByOrgId = async (organizationId: string, client?: any) => {
  const supabase = getClient(client);
  try {
    const { error } = await supabase
      .from("interview")
      .update({ is_active: false })
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    if (error) {
      console.error("Failed to deactivate interviews:", error);
    }
  } catch (error) {
    console.error("Unexpected error disabling interviews:", error);
  }
};

export const InterviewService = {
  getAllInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
  getAllRespondents,
  createInterview,
  deactivateInterviewsByOrgId,
};
