"use client";

import { APIProvider } from "@vis.gl/react-google-maps";

export function MapsAPIProvider({ children }: any) {
  return <APIProvider apiKey={"AIzaSyBPCFOdqXKtxmGWhzKfS0Kzv1jwQIWawG4"}>{children}</APIProvider>;
}

//testing api key - AIzaSyCi7e3FMADhQYOlwO0CjoAS4SeWGuhwXz8
