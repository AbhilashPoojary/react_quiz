import axios from "axios";

const Util = {
  uploadImage: async (
    file,
    setPicLoading,
    setProfilePic,
    setProfilePicPublicId,
    onSuccess,
    onError
  ) => {
    if (!file) {
      setPicLoading(false);
      setProfilePic("");
      setProfilePicPublicId("");
      return;
    }

    setPicLoading(true);

    if (
      file.type === "image/jpeg" ||
      file.type === "image/jpg" ||
      file.type === "image/png" ||
      file.type === "image/webp"
    ) {
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
        setProfilePicPublicId(res.data.public_id);
        setPicLoading(false);
        onSuccess?.();
      } catch (error) {
        console.log(error);
        setPicLoading(false);
        onError?.("Profile pic upload failed");
      }
    } else {
      setPicLoading(false);
      onError?.("Please select a valid image file");
    }
  },
};

export default Util;
