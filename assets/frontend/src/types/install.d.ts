import React from "react";

export type StepStatus = "pending" | "active" | "complete" | "error";

export interface InstallStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: StepStatus;
  details?: string;
}
