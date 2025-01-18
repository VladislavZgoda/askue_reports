import Header from "~/components/Header";
import Siderbar from "~/components/Siderbar";
import Footer from "~/components/Footer";

export default function MainLayout(props: TransSubs) {
  return (
    <>
      <Header />
      <Siderbar {...props} />
      <Footer />
    </>
  );
}
