"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth.context";
import { cn } from "@/lib/utils";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

function Navbar() {
  const { user, signOut, organizationId } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 top-0 bg-slate-100 z-[50] h-16 border-b-2 border-black">
      <div className="flex items-center justify-between h-full px-8 mx-auto max-w-7xl">
        <div className="flex flex-row gap-3 justify-center items-center">
          <Link href={"/dashboard"} className="flex items-center gap-2">
            <p className="px-2 py-1 text-2xl font-black text-black tracking-tighter uppercase">
              RAMP<span className="text-indigo-600">UP</span>
              <span className="ml-1 px-1.5 py-0.5 bg-black text-white text-[8px] rounded uppercase vertical-align-middle">
                Beta
              </span>
            </p>
          </Link>
          <div className="h-6 w-[2px] bg-black rotate-12 mx-2 hidden md:block" />
          <div className="hidden md:block">
            <div className="px-3 py-1 bg-white border-2 border-black font-black text-[10px] uppercase tracking-tighter shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {organizationId ? "Org Workspace" : "Personal Space"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 p-1 pr-3 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                <Avatar className="h-8 w-8 border-2 border-black rounded-none">
                  <AvatarFallback className="bg-indigo-600 text-white font-bold text-xs rounded-none">
                    {user.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", isMenuOpen && "rotate-180")}
                />
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMenuOpen(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setIsMenuOpen(false);
                      }
                    }}
                    role="button"
                    tabIndex={-1}
                    aria-label="Close menu"
                  />
                  <div className="absolute right-0 mt-3 w-64 bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-50 overflow-hidden">
                    <div className="p-4 bg-indigo-50 border-b-2 border-black">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">
                        Authenticated As
                      </p>
                      <p className="text-sm font-bold truncate text-black">{user.email}</p>
                    </div>

                    <div className="p-2">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-bold hover:bg-indigo-50 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          signOut();
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors border-t-2 border-slate-100 mt-1"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
