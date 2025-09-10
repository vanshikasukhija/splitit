"use client"

import React from "react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { BarLoader } from "react-spinners";
import Link from "next/link";
import Image from "next/image";
import { useStoreUser } from "@/hooks/use-store-user";
import { usePathname } from "next/navigation";
import { Authenticated, Unauthenticated } from "convex/react";
import { Button } from "./ui/button";
import { LayoutDashboard, User } from "lucide-react";

const Header = () => {
  const { isLoading } = useStoreUser();
  const path = usePathname();

  return (
    <header className="fixed top-0 w-full border-b bg-white/95 backdrop-blur z-50 supports-[backdrop-filter]:bg-white/60">
      <nav className="mx-auto h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src = {"/logos/logo_splitit.png"}
            alt = "Splitit Logo"
            width = {200}
            height = {60}
            className="h-32 w-auto object-contain"
          />
        </Link>
      
        {/* We want the below to options to only be visible on the home page, so we had put the condition of the path to be equal to "/" only */}
          {path === "/" &&(
            <div className="hidden md:flex items-center gap-6">
              <Link
                href = "#features"
                className="text-sm font-medium hover:text-green-600 transition"
              >
                Features
              </Link>
              <Link
                href = "#how-it-works"
                className="text-sm font-medium hover:text-green-600 transition"
              >
                How It Works
              </Link>
            </div>
          )}
          <div className="flex items-center gap-4">
            <Authenticated>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="hidden md:inline-flex items-center gap-2 hover:text-green-600 hover:border-green-600 transition"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>

              {/* For smaller screens */}
                <Button
                  variant="ghost"
                  className="md:hidden w-10 h-10 p-0"
                >
                  <LayoutDashboard className="h-4 w-4" />                 
                </Button>
              </Link>
              <div className="mr-3">
                <UserButton />
              </div>
            </Authenticated>

            <Unauthenticated>
              <SignInButton>
                <Button variant={"ghost"}>Sign In</Button>
              </SignInButton>
              <SignUpButton>
                <Button className="bg-green-600 hover:bg-green-700 border-none mr-4">Get Started</Button>
              </SignUpButton>
            </Unauthenticated>
          </div>
      </nav>

      {isLoading && <BarLoader width={"100%"} color="#36d7b7" />}
    </header>
  );
};

export default Header;


// Components of nextjs:
// 1.) Server components: Run on the server (default in App Router). Can fetch data directly from DB or API without exposing secrets to client. 
// Don’t include JavaScript in the browser unless wrapped in a Client Component → lighter & faster.
// 2.) Client components: Run in the browser. Can use state, hooks, event handlers (useState, useEffect, onClick, etc.). 
// Needed for interactivity (forms, buttons, modals, charts, etc.).
// We can use hooks in server components by using the "use client" flag at the top.