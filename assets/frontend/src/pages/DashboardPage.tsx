import Dashboard from "../components/Dashboard";
import { useOutletContext } from "react-router-dom";

export default function DashboardPage({ installStatus }: { installStatus: any }) {
  // We don't actually need the dirty states here as it's handled by Marketplace pages,
  // but we can use them if needed in the future.
  return <Dashboard installStatus={installStatus} />;
}
