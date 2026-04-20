"use client";

import { useAuth } from "@/contexts/auth.context";
import { InterviewService } from "@/services/interviews.service";
import type { Interview } from "@/types/interview";
import React, { useState, useContext, type ReactNode, useEffect, useCallback } from "react";

interface InterviewContextProps {
  interviews: Interview[];
  setInterviews: React.Dispatch<React.SetStateAction<Interview[]>>;
  getInterviewById: (interviewId: string) => Interview | null | any;
  interviewsLoading: boolean;
  setInterviewsLoading: (interviewsLoading: boolean) => void;
  fetchInterviews: () => void;
}

export const InterviewContext = React.createContext<InterviewContextProps>({
  interviews: [],
  setInterviews: () => {},
  getInterviewById: () => null,
  setInterviewsLoading: () => undefined,
  interviewsLoading: false,
  fetchInterviews: () => {},
});

interface InterviewProviderProps {
  children: ReactNode;
}

export function InterviewProvider({ children }: InterviewProviderProps) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const { user, organizationId } = useAuth();
  const [interviewsLoading, setInterviewsLoading] = useState(false);

  const fetchInterviews = useCallback(async () => {
    try {
      setInterviewsLoading(true);
      const response = await InterviewService.getAllInterviews(
        user?.id as string,
        organizationId as string,
      );
      setInterviewsLoading(false);
      setInterviews(response);
    } catch (error) {
      console.error(error);
    }
    setInterviewsLoading(false);
  }, [user?.id, organizationId]);

  const getInterviewById = useCallback(async (interviewId: string) => {
    const response = await InterviewService.getInterviewById(interviewId);
    return response;
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (organizationId || user?.id) {
      fetchInterviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, user?.id]);

  return (
    <InterviewContext.Provider
      value={{
        interviews,
        setInterviews,
        getInterviewById,
        interviewsLoading,
        setInterviewsLoading,
        fetchInterviews,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export const useInterviews = () => {
  const value = useContext(InterviewContext);

  return value;
};
