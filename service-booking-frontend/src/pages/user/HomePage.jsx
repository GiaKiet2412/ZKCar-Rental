import Header from "../../components/user/Header";
import ImageSlider from "../../components/user/ImageSlider";
import SearchSection from "../../components/user/SearchSection";
import UserVehicleList from "./UserVehicleList";

const HomePage = () => {
  return (
    <div className="relative">
      <Header />
      <div className="relative">
        <ImageSlider />
        <SearchSection />
      </div>

      <div className="mt-12">
        <UserVehicleList />
      </div>
    </div>
  );
};

export default HomePage;
