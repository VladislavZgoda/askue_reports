import Header from "~/components/Header";
import Siderbar from "~/components/Siderbar";
import Footer from "~/components/Footer";

const MainLayout = (props) => {
  return (
    <>
      <Header />
      <Siderbar {...props} />
      <Footer />
    </>
  );
};

export default MainLayout;
