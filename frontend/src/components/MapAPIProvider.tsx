"use client";

import { APIProvider } from "@vis.gl/react-google-maps";

type Props = {
  apiKey: string;
  children: React.ReactNode;
};

export function MapsAPIProvider({ apiKey, children }: Props) {
  return (
    <APIProvider apiKey={apiKey} version="beta" libraries={["places"]}>
      {children}
    </APIProvider>
  );
}
