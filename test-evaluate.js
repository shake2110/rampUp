const axios = require("axios");
async function run() {
  try {
    const res = await axios.post("http://localhost:3000/api/tutor/evaluate", {
      callId: "999"
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("HTTP Exception:", err.response ? err.response.data : err.message);
  }
}
run();
