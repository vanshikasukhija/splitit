import { useQuery, useMutation } from "convex/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// Custom Hook for Quering
export const useConvexQuery = (query, ...args) => {
  const result = useQuery(query, ...args);
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use effect to handle the state changes based on the query result
  useEffect(() => {
    if (result === undefined) {
      setIsLoading(true);
    } else {
      try {
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  }, [result]);

  return {
    data,
    isLoading,
    error,
  };
};

// Custom Hook for Mutation
export const useConvexMutation = (mutation) => {
  const mutationFn = useMutation(mutation);
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (...args) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await mutationFn(...args);
      setData(response);
      return response;
    } catch (err) {
      setError(err);
      toast.error(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, data, isLoading, error };
};

/*
import { useQuery, useMutation } from "convex/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
-> useQuery → Convex hook to fetch data from a backend query function (auto re-runs when data changes). It subscribes to a Convex query and gives real-time results (it returns undefined while loading).
-> useMutation → Convex hook to call mutation functions (write/update/delete). It gives you a function to call a Convex mutation.
-> useState, useEffect → React hooks for local state management and side effects.
-> toast → from Sonner library, shows nice pop-up notifications for errors.


Hook 1 — useConvexQuery:
export const useConvexQuery = (query, ...args) => {
-> Exports a custom hook named useConvexQuery. OR Defines a custom hook that wraps Convex’s useQuery.
-> Accepts:
    -> query → the Convex query function to call.
    -> ...args → optional arguments to pass to that query.


const result = useQuery(query, ...args);
-> Calls Convex’s useQuery.
-> result will be:
    -> undefined while Convex is fetching/subscribing or while data is laoding,
    -> the returned data once available, and will update reactively if the server data changes.


const [data, setData] = useState(undefined);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);
-> Local states to control:
    -> data: holds the final query data.
    -> isLoading: boolean flag (initial true) whether the query is loading.
    -> error: stores any error encountered.


Handle Query Result:
useEffect(() => {
  if (result === undefined) {
    setIsLoading(true);
  } else {
    try {
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }
}, [result]);
-> useEffect runs whenever result changes.
    -> If result === undefined → query is still loading → isLoading = true.
    -> Else:
        -> setData(result) → save the returned data.
        -> setError(null) → clear previous errors, ie., Reset error to null.
        -> If something goes wrong while processing result, catch it → set error + show a toast notification.
        -> Finally, set isLoading = false.
->This converts Convex’s raw useQuery output into a small, predictable local state shape { data, isLoading, error }.

Return Values:
  return {
    data,
    isLoading,
    error,
  };
};
-> The hook returns a simple object your components can destructure.


Hook 2 — useConvexMutation:
export const useConvexMutation = (mutation) => {
-> A wrapper for Convex’s useMutation. Accepts:
    -> mutation → the mutation function (e.g., addContact).


const mutationFn = useMutation(mutation);
-> mutationFn is the callable function returned by Convex’s useMutation. Call it to run/perform the mutation.


const [data, setData] = useState(undefined);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
-> Local state for mutation result, loading flag, and error. States for:
    -> data: mutation result.
    -> isLoading: whether mutation is in progress.
    -> error: stores any mutation errors.


Mutation Executor:
const mutate = async (...args) => {
  setIsLoading(true);
  setError(null);
-> mutate is a wrapper around mutationFn. It sets isLoading to true and clears previous errors before running.


  try {
    const response = await mutationFn(...args);
    setData(response);
    return response;
  } catch (err) {
    setError(err);
    toast.error(err.message);
    throw err;
  } finally {
    setIsLoading(false);
  }
};
-> await mutationFn(...args) → executes the actual Convex mutation with any passed arguments.
-> On success:
    -> Stores response in data.
    -> Returns response for caller.
-> On error:
    -> Saves error in state.
    -> Displays toast notification.
    -> Rethrows error so the caller can handle it.
-> finally ensures loading stops at the end.


Return Values:
  return { mutate, data, isLoading, error };
};
-> Exposes:
    -> mutate: the wrapped mutation function.
    -> data: result of the mutation.
    -> isLoading: whether mutation is running.
    -> error: any error. 

*/
