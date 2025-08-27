import Header from "~/components/Header";
import Siderbar from "~/components/Siderbar";
import Footer from "~/components/Footer";

export default function MainLayout(props: SubstationSearchParams) {
  return (
    <>
      <Header />
      <Siderbar {...props} />
      <Footer />
    </>
  );
}
