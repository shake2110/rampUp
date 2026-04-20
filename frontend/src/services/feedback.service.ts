import type { FeedbackData } from "@/types/response";
import { createClient } from "@/lib/supabase";

const getClient = (client?: any) => {
  return client || createClient();
};

const submitFeedback = async (feedbackData: FeedbackData, client?: any) => {
  const supabase = getClient(client);
  const { error, data } = await supabase.from("feedback").insert(feedbackData).select();

  if (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }

  return data;
};

export const FeedbackService = {
  submitFeedback,
};
