import Spinner from "./Spinner";

export default function CheckingInstallation() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden">
      <div className="flex flex-col items-center space-y-3 px-6 text-center">
        <Spinner className="h-12 w-12" />
        <h2 className="text-sm font-medium text-white">Checking Installation Status</h2>
        <p className="text-xs text-[#999999]">Please wait...</p>
      </div>
    </div>
  );
}
