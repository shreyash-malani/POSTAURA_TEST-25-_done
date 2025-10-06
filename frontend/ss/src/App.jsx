import React, { useState } from "react";
import axios from "axios";

const INSTAGRAM_BACKEND = import.meta.env.VITE_BACKEND_URL;
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const TWITTER_BACKEND = "http://localhost:4001";

export default function App() {
  const [multiVideos, setMultiVideos] = useState([
    { file: null, caption: "", scheduledTime: "", ig: true, tw: true },
  ]);
  const [status, setStatus] = useState("");

  const handleFileChange = (idx, file) => {
    const newData = [...multiVideos];
    newData[idx].file = file;
    setMultiVideos(newData);
  };
  const handleCaptionChange = (idx, caption) => {
    const newData = [...multiVideos];
    newData[idx].caption = caption;
    setMultiVideos(newData);
  };
  const handleTimeChange = (idx, t) => {
    const newData = [...multiVideos];
    newData[idx].scheduledTime = t;
    setMultiVideos(newData);
  };
  const handleCheckboxChange = (idx, platform) => {
    const newData = [...multiVideos];
    newData[idx][platform] = !newData[idx][platform];
    setMultiVideos(newData);
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || "Cloudinary upload failed");
    }
    const data = await res.json();
    return data.secure_url;
  };

  const scheduleVideo = async (idx) => {
  const video = multiVideos[idx];
  if (!video.file || !video.scheduledTime) {
    alert("Select file and time");
    return;
  }
  setStatus(`Scheduling video ${video.file.name} ...`);
  try {
    const videoUrl = await uploadToCloudinary(video.file);

    if (video.ig) {
      await axios.post(`${INSTAGRAM_BACKEND}/api/instagram/schedule`, {
        filePath: videoUrl,
        caption: video.caption,
        scheduledTime: video.scheduledTime,
        platforms: ["instagram"],
      });
    }

    if (video.tw) {
      await axios.post(`${TWITTER_BACKEND}/schedule-tweet`, {
        text: video.caption,
        videoUrl: videoUrl,  // <-- use videoUrl here, not filePath
        scheduleTime: video.scheduledTime,
      });
    }

    setStatus(`Scheduled ${video.file.name} successfully!`);

    if (idx === multiVideos.length - 1) {
      setMultiVideos([
        ...multiVideos,
        { file: null, caption: "", scheduledTime: "", ig: true, tw: true },
      ]);
    }
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
};


  return (
    <div style={{ padding: 24 }}>
      <h1>Social Media Manager</h1>
      <h3>Multiple Videos</h3>
      {multiVideos.map((v, idx) => (
        <div key={idx} style={{ marginBottom: 16, border: "1px solid #ccc", padding: 8 }}>
          <input type="file" accept="video/*" onChange={(e) => handleFileChange(idx, e.target.files[0])} />
          {v.file && <span style={{ marginLeft: 8 }}>{v.file.name}</span>}
          <input type="text" placeholder="Caption" value={v.caption} onChange={(e) => handleCaptionChange(idx, e.target.value)} />
          <input type="datetime-local" value={v.scheduledTime} onChange={(e) => handleTimeChange(idx, e.target.value)} />
          <div>
            <label>
              <input type="checkbox" checked={v.ig} onChange={() => handleCheckboxChange(idx, "ig")} />
              Instagram
            </label>
            <label style={{ marginLeft: 8 }}>
              <input type="checkbox" checked={v.tw} onChange={() => handleCheckboxChange(idx, "tw")} />
              Twitter
            </label>
          </div>
          <button onClick={() => scheduleVideo(idx)}>Schedule This Video</button>
        </div>
      ))}
      <pre>{status}</pre>
    </div>
  );
}
