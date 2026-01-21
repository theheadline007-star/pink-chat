
// 🔑 SUPABASE CONFIG (later fill)
const supabaseUrl = "https://oxpmzsabnpdkwtsazgzk.supabase.co";
const supabaseKey = "sb_publishable_h0_-0CyBrbdOzfcqIKIdQw_hTI0ApHX";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 🔹 URL PARAMS
const params = new URLSearchParams(window.location.search);
const adminToken = params.get("token");
const adminCode = params.get("admin");

// 🔹 GLOBAL
let adminData = null;
let clientData = null;

// ================= ADMIN SIDE =================
async function initAdmin() {
  if (!adminToken) {
    document.body.innerHTML = "Access Denied";
    return;
  }

  const { data } = await supabase
    .from("admins")
    .select("*")
    .eq("secret_token", adminToken)
    .single();

  if (!data) {
    document.body.innerHTML = "Invalid Admin Link";
    return;
  }

  adminData = data;
  document.getElementById("adminHeader").innerText =
    "Admin: " + data.name;

  loadAdminClients();
}

async function loadAdminClients() {
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("admin_id", adminData.id)
    .eq("blocked", false);

  const box = document.getElementById("clients");
  box.innerHTML = "";

  data.forEach(c => {
    const div = document.createElement("div");
    div.innerText = c.name;
    div.onclick = () => openAdminChat(c);
    box.appendChild(div);
  });
}

function openAdminChat(client) {
  clientData = client;
  document.getElementById("adminChat").classList.remove("hidden");
  loadMessages();
}

async function sendAdminMsg() {
  const text = document.getElementById("msg").value;
  if (!text) return;

  await supabase.from("messages").insert([{
    admin_id: adminData.id,
    client_id: clientData.id,
    sender: "admin",
    message: text
  }]);

  document.getElementById("msg").value = "";
  loadMessages();
}

// ================= CLIENT SIDE =================
async function clientLogin() {
  const name = document.getElementById("name").value;
  if (!name || !adminCode) {
    alert("Invalid link");
    return;
  }

  const unique = name + "_" + Math.floor(Math.random() * 10000);

  const { data } = await supabase
    .from("clients")
    .insert([{
      name: name,
      unique_id: unique,
      admin_id: adminCode
    }])
    .select()
    .single();

  clientData = data;
  localStorage.setItem("client_id", data.id);

  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("chatBox").classList.remove("hidden");

  loadClientAdminName();
  loadMessages();
}

async function loadClientAdminName() {
  const { data } = await supabase
    .from("admins")
    .select("name")
    .eq("id", clientData.admin_id)
    .single();

  document.getElementById("clientHeader").innerText =
    "Chat with Admin: " + data.name;
}

// ================= SHARED =================
async function loadMessages() {
  if (!clientData) return;

  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("client_id", clientData.id)
    .order("created_at");

  const box = document.getElementById("messages");
  box.innerHTML = "";

  data.forEach(m => {
    const div = document.createElement("div");
    div.innerText = m.sender + ": " + m.message;
    box.appendChild(div);
  });
}

async function sendMsg() {
  const text = document.getElementById("msg").value;
  if (!text) return;

  await supabase.from("messages").insert([{
    admin_id: clientData.admin_id,
    client_id: clientData.id,
    sender: "client",
    message: text
  }]);

  document.getElementById("msg").value = "";
  loadMessages();
}

function showContact() {
  alert("Contact Admin");
}

// ================= INIT =================
if (window.location.pathname.includes("admin.html")) {
  initAdmin();
}
