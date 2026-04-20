"use client";

import QuestionAnswerCard from "@/components/dashboard/interview/questionAnswerCard";
import LoaderWithText from "@/components/loaders/loader-with-text/loaderWithText";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CandidateStatus } from "@/lib/enum";
import { ResponseService } from "@/services/responses.service";
import type { Analytics, CallData } from "@/types/response";
import { CircularProgress } from "@nextui-org/react";
import axios from "axios";
import { ArrowLeft, DownloadIcon, TrashIcon } from "lucide-react";
import { marked } from "marked";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ReactAudioPlayer from "react-audio-player";
import { toast } from "sonner";

type CallProps = {
  call_id: string;
  onDeleteResponse: (deletedCallId: string) => void;
  onCandidateStatusChange: (callId: string, newStatus: string) => void;
};

function CallInfo({ call_id, onDeleteResponse, onCandidateStatusChange }: CallProps) {
  const [call, setCall] = useState<CallData>();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [isClicked, setIsClicked] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [candidateStatus, setCandidateStatus] = useState<string>("");
  const [interviewId, setInterviewId] = useState<string>("");
  const [tabSwitchCount, setTabSwitchCount] = useState<number>();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch call data and analytics
        const callResponse = await axios.post("/api/get-call", { id: call_id });
        setCall(callResponse.data.callResponse);
        setAnalytics(callResponse.data.analytics);

        // Fetch response details
        const responseDetail = await ResponseService.getResponseByCallId(call_id);
        if (responseDetail) {
          setEmail(responseDetail.email);
          setName(responseDetail.name);
          setCandidateStatus(responseDetail.candidate_status);
          setInterviewId(responseDetail.interview_id);
          setTabSwitchCount(responseDetail.tab_switch_count);

          // Handle transcript formatting
          if (responseDetail.details?.transcript) {
            const formatted = responseDetail.details.transcript
              .map(
                (m: any) =>
                  `**${m.role === "assistant" ? "AI interviewer" : responseDetail.name || "You"}:** ${m.content}`,
              )
              .join("\n\n");
            setTranscript(formatted);
          } else if (callResponse.data.callResponse?.transcript) {
            const formatted = replaceAgentAndUser(
              callResponse.data.callResponse.transcript,
              responseDetail.name,
            );
            setTranscript(formatted);
          }
        }
      } catch (error) {
        console.error("Error fetching call info:", error);
        toast.error("Failed to load call information.");
      } finally {
        setIsLoading(false);
      }
    };
    const replaceAgentAndUser = (transcriptText: string, userName: string): string => {
      const agentReplacement = "**AI interviewer:**";
      const userReplacement = `**${userName || "You"}:**`;

      let updatedTranscript = (transcriptText || "")
        .replace(/Agent:/g, agentReplacement)
        .replace(/User:/g, userReplacement);

      updatedTranscript = updatedTranscript.replace(/(?:\r\n|\r|\n)/g, "\n\n");

      return updatedTranscript;
    };

    fetchData();
  }, [call_id]);

  const onDeleteResponseClick = async () => {
    try {
      setIsClicked(true);
      const response = await ResponseService.getResponseByCallId(call_id);

      if (response) {
        const interview_id = response.interview_id;
        await ResponseService.deleteResponse(call_id);
        router.push(`/interviews/${interview_id}`);
        onDeleteResponse(call_id);
      }

      toast.success("Response deleted successfully.", {
        position: "bottom-right",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error deleting response:", error);
      toast.error("Failed to delete the response.", {
        position: "bottom-right",
        duration: 3000,
      });
    } finally {
      setIsClicked(false);
    }
  };

  return (
    <div className="h-screen z-[10] mx-2 mb-[100px] overflow-y-scroll">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[75%] w-full">
          <LoaderWithText />
        </div>
      ) : (
        <>
          <div className="bg-slate-200 rounded-2xl min-h-[120px] p-4 px-5 my-3">
            <div className="flex flex-col justify-between border-t-2">
              <div>
                <div className="flex justify-between items-center pb-4 pr-2">
                  <button
                    type="button"
                    className="inline-flex items-center text-indigo-600 hover:cursor-pointer"
                    onClick={() => {
                      router.push(`/interviews/${interviewId}`);
                    }}
                  >
                    <ArrowLeft className="mr-2" />
                    <p className="text-sm font-semibold">Back to Summary</p>
                  </button>
                  {tabSwitchCount !== undefined && tabSwitchCount > 0 && (
                    <p className="text-sm font-semibold text-red-500 bg-red-200 rounded-sm px-2 py-1">
                      Tab Switching Detected
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col justify-between gap-3 w-full">
                <div className="flex flex-row justify-between">
                  <div className="flex flex-row gap-3">
                    <Avatar>
                      <AvatarFallback>{name?.[0] ?? "A"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      {name && <p className="text-sm font-semibold px-2">{name}</p>}
                      {email && <p className="text-sm px-2">{email}</p>}
                    </div>
                  </div>
                  <div className="flex flex-row mr-2 items-center gap-3">
                    <Select
                      value={candidateStatus || ""}
                      onValueChange={async (newValue: string) => {
                        setCandidateStatus(newValue);
                        await ResponseService.updateResponse(
                          { candidate_status: newValue },
                          call_id,
                        );
                        onCandidateStatusChange(call_id, newValue);
                      }}
                    >
                      <SelectTrigger className="w-[180px] bg-slate-50 rounded-2xl">
                        <SelectValue placeholder="Not Selected" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CandidateStatus.NO_STATUS}>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2" />
                            No Status
                          </div>
                        </SelectItem>
                        <SelectItem value={CandidateStatus.NOT_SELECTED}>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                            Not Selected
                          </div>
                        </SelectItem>
                        <SelectItem value={CandidateStatus.POTENTIAL}>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
                            Potential
                          </div>
                        </SelectItem>
                        <SelectItem value={CandidateStatus.SELECTED}>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                            Selected
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button disabled={isClicked} className="bg-red-500 hover:bg-red-600 p-2">
                          <TrashIcon size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this
                            response.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-indigo-600 hover:bg-indigo-800"
                            onClick={onDeleteResponseClick}
                          >
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="flex flex-col mt-3">
                  <p className="font-semibold">Interview Recording</p>
                  <div className="flex flex-row gap-3 mt-2">
                    {call?.recording_url && <ReactAudioPlayer src={call?.recording_url} controls />}
                    <a
                      className="my-auto"
                      href={call?.recording_url}
                      download=""
                      aria-label="Download"
                    >
                      <DownloadIcon size={20} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-200 rounded-2xl min-h-[120px] p-4 px-5 my-3">
            <p className="font-semibold my-2">General Summary</p>

            {analytics?.clarity ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-2 mt-4">
                {[
                  { label: "Clarity", data: analytics.clarity },
                  { label: "Patience", data: analytics.patience },
                  { label: "Warmth", data: analytics.warmth },
                  { label: "Simplicity", data: analytics.simplicity },
                  { label: "Fluency", data: analytics.fluency },
                ].map((item: { label: string; data: any }) => (
                  <div
                    key={item.label}
                    className="flex flex-col gap-4 text-sm p-6 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg shadow-indigo-900/5 hover:shadow-indigo-900/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-lg text-indigo-900 tracking-tight">
                        {item.label}
                      </p>
                      <div className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-md shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                        {item.data?.score}
                      </div>
                    </div>
                    <div className="space-y-3 mt-1">
                      <p className="text-gray-700 font-medium leading-relaxed">
                        {item.data?.reason}
                      </p>
                      <div className="bg-indigo-50/60 p-3 rounded-xl border-l-4 border-indigo-400 text-xs italic text-gray-600 shadow-inner">
                        "{item.data?.evidence}"
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex flex-col gap-4 text-sm p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/30 transition-colors duration-500" />
                  <p className="font-bold text-xl text-indigo-100 tracking-wide">Overall Result</p>
                  <div
                    className={`text-3xl font-black tracking-tight ${analytics && analytics.overall_recommendation === "Hire" ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {analytics?.overall_recommendation?.toUpperCase() || "NO DATA"}
                  </div>
                  <p className="text-sm opacity-90 leading-relaxed font-medium relative z-10">
                    {analytics?.summary || "No summary available."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-2 mt-4">
                {analytics?.overallScore !== undefined && (
                  <div className="flex flex-col gap-3 text-sm p-4 rounded-2xl bg-slate-50">
                    <div className="flex flex-row gap-2 align-middle">
                      <CircularProgress
                        classNames={{
                          svg: "w-28 h-28 drop-shadow-md",
                          indicator: "stroke-indigo-600",
                          track: "stroke-indigo-600/10",
                          value: "text-3xl font-semibold text-indigo-600",
                        }}
                        value={analytics?.overallScore}
                        strokeWidth={4}
                        showValueLabel={true}
                        formatOptions={{ signDisplay: "never" }}
                      />
                      <p className="font-medium my-auto text-xl">Overall Hiring Score</p>
                    </div>
                    <div className="font-medium">
                      <span className="font-normal">Feedback: </span>
                      {analytics?.overallFeedback === undefined ? (
                        <Skeleton className="w-[200px] h-[20px]" />
                      ) : (
                        analytics?.overallFeedback
                      )}
                    </div>
                  </div>
                )}
                {analytics?.communication && (
                  <div className="flex flex-col gap-3 text-sm p-4 rounded-2xl bg-slate-50">
                    <div className="flex flex-row gap-2 align-middle">
                      <CircularProgress
                        classNames={{
                          svg: "w-28 h-28 drop-shadow-md",
                          indicator: "stroke-indigo-600",
                          track: "stroke-indigo-600/10",
                          value: "text-3xl font-semibold text-indigo-600",
                        }}
                        value={analytics?.communication.score}
                        maxValue={10}
                        minValue={0}
                        strokeWidth={4}
                        showValueLabel={true}
                        valueLabel={
                          <div className="flex items-baseline">
                            {analytics?.communication.score ?? 0}
                            <span className="text-xl ml-0.5">/10</span>
                          </div>
                        }
                        formatOptions={{ signDisplay: "never" }}
                      />
                      <p className="font-medium my-auto text-xl">Communication</p>
                    </div>
                    <div className="font-medium">
                      <span className="font-normal">Feedback: </span>
                      {analytics?.communication.feedback === undefined ? (
                        <Skeleton className="w-[200px] h-[20px]" />
                      ) : (
                        analytics?.communication.feedback
                      )}
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-3 text-sm p-4 rounded-2xl bg-slate-50">
                  <div className="flex flex-row gap-2 align-middle">
                    <p className="my-auto">User Sentiment: </p>
                    <div className="font-medium my-auto flex items-center gap-2">
                      {call?.call_analysis?.user_sentiment === undefined ? (
                        <Skeleton className="w-[100px] h-[20px]" />
                      ) : (
                        <>
                          {call?.call_analysis?.user_sentiment}
                          <div
                            className={`${
                              call?.call_analysis?.user_sentiment === "Neutral"
                                ? "text-yellow-500"
                                : call?.call_analysis?.user_sentiment === "Negative"
                                  ? "text-red-500"
                                  : call?.call_analysis?.user_sentiment === "Positive"
                                    ? "text-green-500"
                                    : "text-transparent"
                            } text-xl`}
                          >
                            ●
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="font-medium">
                    <span className="font-normal">Call Summary: </span>
                    {call?.call_analysis?.call_summary === undefined ? (
                      <Skeleton className="w-[200px] h-[20px]" />
                    ) : (
                      call?.call_analysis?.call_summary
                    )}
                  </div>
                  <p className="font-medium">
                    {call?.call_analysis?.call_completion_rating_reason}
                  </p>
                </div>
              </div>
            )}
          </div>
          {analytics?.questionSummaries && analytics.questionSummaries.length > 0 && (
            <div className="bg-slate-200 rounded-2xl min-h-[120px] p-4 px-5 my-3">
              <p className="font-semibold my-2 mb-4">Question Summary</p>
              <ScrollArea className="rounded-md h-72 text-sm mt-3 py-3 leading-6 whitespace-pre-line px-2">
                {analytics?.questionSummaries.map((qs, index) => (
                  <QuestionAnswerCard
                    key={qs.question}
                    questionNumber={index + 1}
                    question={qs.question}
                    answer={qs.summary}
                  />
                ))}
              </ScrollArea>
            </div>
          )}
          <div className="bg-slate-200 rounded-2xl min-h-[150px] max-h-[500px] p-4 px-5 mb-[150px]">
            <p className="font-semibold my-2 mb-4">Transcript</p>
            <ScrollArea className="rounded-2xl text-sm h-96 overflow-y-auto whitespace-pre-line px-2">
              <div
                className="text-sm p-4 rounded-2xl leading-5 bg-slate-50"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: required for markdown rendering
                dangerouslySetInnerHTML={{
                  __html: marked.parse(transcript || "") as string,
                }}
              />
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}

export default CallInfo;
