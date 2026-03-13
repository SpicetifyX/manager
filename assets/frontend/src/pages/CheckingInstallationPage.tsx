import Header from "../components/Header";
import CheckingInstallation from "../components/CheckingInstallation";
import Footer from "../components/Footer";

export default function CheckingInstallationPage() {
  return (
    <>
      <Header title="Spicetify Installer" description="Checking Existing Spicetify & Spotify Installations" />
      <CheckingInstallation />
      <Footer hidden />
    </>
  );
}
