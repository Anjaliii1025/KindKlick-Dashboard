const params = new URLSearchParams(location.search);
const domain = params.get("domain") || "";
document.getElementById("domain").textContent = domain;
document.getElementById("reason").textContent = params.get("reason") || "Blocked";
const cat = params.get("category");
if (cat) document.getElementById("category").textContent = `Category: ${cat}`;
document.getElementById("request").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "ACCESS_REQUEST", domain }, () => {
    alert("Request sent to your parent.");
  });
});
