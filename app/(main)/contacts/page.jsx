"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users, User } from "lucide-react";
import CreateGroupModal from "./_components/create-group-modal";
import { set } from "date-fns";

const ContactsPage = () => {
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const { data, isLoading } = useConvexQuery(api.contacts.getAllContacts);

  const router = useRouter();

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  const { users, groups } = data || { users: [], groups: [] };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-5xl gradient-title">Contacts</h1>
        <Button onClick={() => setIsCreateGroupModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* For individual people */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <User className="mr-2 h-5 w-5"/>
            People
          </h2>

          {users.length === 0?(
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No contacts yet. Add an expense with someone to see them here.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {users.map((user) => (
                <Link key={user.id} href={`/person/${user.id}`}>
                  <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.imageUrl} />
                            <AvatarFallback>
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}          
        </div>

        
        {/* For groups */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <User className="mr-2 h-5 w-5"/>
            Groups
          </h2>

          {groups.length === 0?(
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No groups yet. Add a group to start tracking shared expenses.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {groups.map((group) => (
                <Link key={group.id} href={`/person/${group.id}`}>
                  <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-md">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-muted-foreground">{group.memberCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}         
        </div>
      </div>

        {/* Create group modal */}
        <CreateGroupModal 
          isOpen={isCreateGroupModalOpen} 
          onClose={() => setIsCreateGroupModalOpen(false)}
          onSuccess={(groupId) => router.push(`/groups/${groupId}`)}
        />
    </div>
  )
};

export default ContactsPage;



/* 

What are params?
1. In functions → params = placeholders/variables for inputs.
2. In APIs → params = values sent via URL (path params, query params).
3. In frameworks (React/Next.js, Express) → params = object with extracted values from routes.

*/


/*
This file is a client component that fetches your contacts (people + groups) from the Convex backend, shows a loading spinner while fetching, renders two lists (People and Groups), and supports opening a “Create Group” modal (also can be opened via a ?createGroup=true URL param).

Top of file — directive + imports
"use client";


Marks this file as a client component in Next.js App Router. That enables React hooks (useState, useEffect) and browser-only APIs (like window).

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";


Standard React + Next client hooks:

useState, useEffect → component state and lifecycle.

useRouter → client-side navigation (push/replace).

useSearchParams → read URL search params on client.

Link → Next.js client-side navigation component.

import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";


Convex client:

api contains auto-generated client endpoints such as api.contacts.getAllContacts.

useConvexQuery is a custom hook (wrapper around Convex client) that fetches/subscribes to a Convex query and returns { data, isLoading, ... }.

import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users, User } from "lucide-react";
import { CreateGroupModal } from "./components/create-group-modal";


UI pieces:

BarLoader — loading spinner.

Button, Card, Avatar — UI components (Tailwind + custom).

Plus, Users, User — icons.

CreateGroupModal — modal component for creating a group.

Main component — ContactsPage() (step-by-step)
export default function ContactsPage() {


Declares the component exported as the default page/component.

State + router + params
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();


State and navigation:

isCreateGroupModalOpen → controls whether the Create Group modal is visible.

router → used to navigate (push) and to replace URL (replace).

searchParams → lets you read query parameters from the current URL.

1) Data fetching (this is the main query — point 1)
  const { data, isLoading } = useConvexQuery(api.contacts.getAllContacts);


What this does (important):

Calls your Convex query api.contacts.getAllContacts (the same server-side query you showed earlier).

useConvexQuery likely:

Runs the query client-side,

Returns { data, isLoading }, and

Subscribes to real-time updates (Convex will re-run/stream updates if the server data changes).

data will be what the server returned: { users: [...], groups: [...] }.

isLoading is true while the request is pending.

This is the main data roundtrip to the backend — everything else in the component depends on this response.

2) Opening modal via URL param (effect)
  useEffect(() => {
    const createGroupParam = searchParams.get("createGroup");

    if (createGroupParam === "true") {
      setIsCreateGroupModalOpen(true);

      const url = new URL(window.location.href);
      url.searchParams.delete("createGroup");
      router.replace(url.pathname + url.search);
    }
  }, [searchParams, router]);


Purpose:

When the component mounts (or when searchParams changes), it checks the createGroup query param.

If ?createGroup=true is present it:

Opens the Create Group modal.

Removes the createGroup param from the URL using router.replace(...) so the modal state isn’t encoded permanently in history.

Notes & behavior:

searchParams.get() returns a string or null. The code compares to "true" explicitly.

new URL(window.location.href) is safe because this is a client component.

router.replace(...) replaces the current history entry (so the user doesn’t get an extra history entry when param is removed).

3) Loading UI
  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }


If the Convex query is still loading, render a centered loading bar and stop — no main UI yet.

4) Safe destructuring of fetched data
  const { users, groups } = data || { users: [], groups: [] };


If data is undefined for any reason, this line defaults to empty arrays so the UI doesn’t crash.

5) Page header + Create Group button
  <div className="flex ...">
    <h1 className="text-5xl gradient-title">Contacts</h1>
    <Button onClick={() => setIsCreateGroupModalOpen(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Create Group
    </Button>
  </div>


Renders title and a button:

Clicking the button opens the modal by setting state.

Plus icon for visual cue.

6) Layout: two columns grid (People and Groups)
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


Tailwind grid that collapses to one column on small screens and two columns on medium+.

7) Left column — Individual contacts (People)
  <h2>People</h2>
  {users.length === 0 ? (
    <Card> No contacts yet... </Card>
  ) : (
    <div>
      {users.map((user) => (
        <Link key={user.id} href={`/person/${user.id}`}>
          <Card> ... Avatar, name, email ... </Card>
        </Link>
      ))}
    </div>
  )}


Behavior explained:

If users is empty, show a friendly empty state message.

Otherwise map over users and create a Link for each:

key={user.id} — React list key (stable unique id).

href={/person/${user.id}} — client-side navigation to that person's page.

The card shows:

AvatarImage src={user.imageUrl} — if image exists it shows it.

AvatarFallback {user.name.charAt(0)} — fallback to first letter (small edge case: if name missing, charAt(0) could be undefined; more on that below).

user.name and user.email displayed.

8) Right column — Groups
  <h2>Groups</h2>
  {groups.length === 0 ? (
    <Card> No groups yet... </Card>
  ) : (
    <div>
      {groups.map((group) => (
        <Link key={group.id} href={`/groups/${group.id}`}>
          <Card> ... group name + memberCount ... </Card>
        </Link>
      ))}
    </div>
  )}


Very similar to People:

Empty state message if groups empty.

Otherwise map groups into cards that link to /groups/${group.id} and show group.name and group.memberCount.

9) CreateGroupModal usage (controlled modal)
  <CreateGroupModal
    isOpen={isCreateGroupModalOpen}
    onClose={() => setIsCreateGroupModalOpen(false)}
    onSuccess={(groupId) => {
      router.push(`/groups/${groupId}`);
    }}
  />


Controlled modal component:

isOpen controlled by parent state.

onClose sets open state to false.

onSuccess receives the created groupId and navigates to the new group page with router.push(...).

This wiring means the modal itself just handles the create flow and reports success back to this page.

*/

