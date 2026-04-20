const axios = require("axios");
async function run() {
  try {
    const res = await axios.post("http://localhost:3000/api/tutor/interact", {
      callId: "123", 
      userMessage: "hi",
      interviewId: "123"
    });
    console.log(res.data);
  } catch (err) {
    console.error("HTTP Exception:", err.response ? err.response.data : err.message);
  }
}
run();
