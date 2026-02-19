import Footer from "../components/Footer";
import Header from "../components/Header";

export default function InstallPage() {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <Header title="Spicetify Installer" description="Select Install to Continue" />
      {/* <InstallWizard installStatus={installStatus} isInstalling={installing} updateStepStatus={updateStepStatus} steps={steps} /> */}
      <Footer>
        {/* <button
          onClick={installSpicetify}
          disabled={installing || installCompleted}
          className={`flex items-center gap-2 rounded px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
            installing
              ? "cursor-not-allowed bg-[#a02950] text-white"
              : installCompleted
                ? "cursor-not-allowed bg-[#2a2a2a] text-white"
                : "bg-[#d63c6a] text-white hover:bg-[#c52c5a] active:bg-[#b51c4a]"
          }`}
        >
          <FaDownload />
          {installing ? "Installing..." : installCompleted ? "Complete!" : "Install Spicetify"}
        </button> */}
      </Footer>
    </div>
  );
}
