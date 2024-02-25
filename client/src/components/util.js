import axios from "axios";

const Util = {
  uploadImage: async (file, setPicLoading, toast, setProfilePic) => {
    setPicLoading(true);
    if (file === undefined) {
      toast.error("Please select an image", {
        position: "top-right",
        autoClose: 8000,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }
    if (
      file.type === "image/jpeg" ||
      file.type === "image/jpg" ||
      file.type === "image/png"
    ) {
      //pic upload
      const data = new FormData();
      data.append("file", file);
      data.append("api_key", "719368821484965");
      data.append("upload_preset", "chat-app");
      data.append("cloud_name", "dk0sqc1u9");
      try {
        const res = await axios.post(
          "https://api.cloudinary.com/v1_1/dk0sqc1u9/image/upload",
          data
        );

        setProfilePic(res.data.url);
        console.log(res.data.url);
        setPicLoading(false);
        toast.success("image uploaded successfully", {
          position: "top-right",
          autoClose: 3000,
          pauseOnHover: true,
          draggable: true,
        });
      } catch (error) {
        console.log(error);
        setPicLoading(false);
      }
    } else {
      toast.error("Please select a image", {
        position: "top-right",
        autoClose: 3000,
        pauseOnHover: true,
        draggable: true,
      });
    }
  },
};

export default Util;
