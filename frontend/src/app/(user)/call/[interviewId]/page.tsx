"use client";

import BrowserCall from "@/components/call/BrowserCall";
import LoaderWithText from "@/components/loaders/loader-with-text/loaderWithText";
import { useInterviews } from "@/contexts/interviews.context";
import type { Interview } from "@/types/interview";
import { ArrowUpRightSquareIcon } from "lucide-react";
import Image from "next/image";
import { use, useEffect, useState } from "react";

type Props = {
  params: Promise<{
    interviewId: string;
  }>;
  searchParams?: Promise<{
    type?: string;
  }>;
};

type PopupProps = {
  title: string;
  description: string;
  image: string;
};

function PopupLoader() {
  return (
    <div className="bg-white rounded-md absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 md:w-[80%] w-[90%] z-50">
      <div className="h-[88vh] flex justify-center items-center rounded-lg border-2 border-b-4 border-r-4 border-black font-bold transition-all dark:border-white">
        <div className="relative flex flex-col items-center justify-center h-full">
          <LoaderWithText />
        </div>
      </div>
      <a
        className="flex flex-row justify-center items-center mt-3 gap-2"
        href="https://rampup.co/"
        target="_blank"
        rel="noreferrer"
      >
        <div className="text-center text-md font-semibold">
          Powered by{" "}
          <span className="font-bold">
            Ramp<span className="text-indigo-600">UP</span>
          </span>
        </div>
        <ArrowUpRightSquareIcon className="h-5 w-5 text-indigo-500" />
      </a>
    </div>
  );
}

function PopUpMessage({ title, description, image }: PopupProps) {
  return (
    <div className="bg-white rounded-md absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 md:w-[80%] w-[90%] z-50">
      <div className="h-[88vh] flex flex-col items-center justify-center rounded-lg border-2 border-b-4 border-r-4 border-black font-bold transition-all dark:border-white">
        <div className="flex flex-col items-center justify-center">
          <Image src={image} alt="Graphic" width={200} height={200} className="mb-4" />
          <h1 className="text-lg font-bold mb-2 text-center px-4">{title}</h1>
          <p className="text-gray-600 font-normal px-4 text-center">{description}</p>
        </div>
      </div>
    </div>
  );
}

function InterviewInterface({ params }: Props) {
  const resolvedParams = use(params);
  const [interview, setInterview] = useState<Interview>();
  const [isActive, setIsActive] = useState(true);
  const { getInterviewById } = useInterviews();
  const [interviewNotFound, setInterviewNotFound] = useState(false);

  useEffect(() => {
    if (interview) {
      setIsActive(interview?.is_active === true);
    }
  }, [interview]);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await getInterviewById(resolvedParams.interviewId);
        if (response) {
          setInterview(response);
          document.title = response.name || "Teaching Assessment";
        } else {
          setInterviewNotFound(true);
        }
      } catch (error) {
        console.error(error);
        setInterviewNotFound(true);
      }
    };

    fetchInterview();
  }, [getInterviewById, resolvedParams.interviewId]);

  return (
    <div>
      <div className="hidden md:block mx-auto">
        {!interview ? (
          interviewNotFound ? (
            <PopUpMessage
              title="Invalid URL"
              description="The interview link you're trying to access is invalid. Please check the URL and try again."
              image="/invalid-url.png"
            />
          ) : (
            <PopupLoader />
          )
        ) : !isActive ? (
          <PopUpMessage
            title="Assessment Unavailable"
            description="We are not currently accepting responses. Please contact the sender for more information."
            image="/closed.png"
          />
        ) : (
          <BrowserCall interview={interview} />
        )}
      </div>
      <div className="md:hidden flex flex-col items-center justify-center my-auto">
        <div className="mt-48 px-3">
          <p className="text-center my-5 text-md font-semibold">{interview?.name}</p>
          <p className="text-center text-gray-600 my-5">
            Please use a PC to complete the teaching assessment. Apologies for any inconvenience.
          </p>
        </div>
        <div className="text-center text-md font-semibold mr-2 my-5">
          Powered by{" "}
          <a
            className="font-bold underline"
            href="https://rampup.co"
            target="_blank"
            rel="noreferrer"
          >
            Ramp<span className="text-indigo-600">UP</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default InterviewInterface;
