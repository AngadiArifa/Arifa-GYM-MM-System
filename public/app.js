let members = [], plans = [], trainers = [], editing = null, currentType = null;
const $ = (id) => document.getElementById(id);
const today = new Date().toISOString().slice(0,10);
$("today").textContent = new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});

document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.view)));
function showView(view) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  $(view).classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  const titles = {dashboard:"Dashboard Overview",members:"Member Directory",plans:"Membership Plans",subscriptions:"Subscriptions",trainers:"Trainer Management",assignments:"Trainer Assignments"};
  $("pageTitle").textContent = titles[view];
  if(view === "dashboard") loadDashboard();
  if(view === "members") loadMembers();
  if(view === "plans") loadPlans();
  if(view === "subscriptions") loadSubscriptions();
  if(view === "trainers") loadTrainers();
  if(view === "assignments") loadAssignments();
}
async function api(url, options={}) {
  const response = await fetch(url,{headers:{"Content-Type":"application/json"},...options});
  const data = await response.json();
  if(!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
function toast(message){$("toast").textContent=message;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2600)}
function esc(value){return String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function badge(value){let cls=String(value).toLowerCase();if(cls==="paid"||cls==="active"||cls==="current")cls="";else if(cls==="pending")cls="pending";else cls="expired";return `<span class="badge ${cls}">${esc(value)}</span>`}
async function loadDashboard(){try{let d=await api("/api/dashboard");$("statMembers").textContent=d.members;$("statPlans").textContent=d.plans;$("statActive").textContent=d.activeSubscriptions;$("statExpired").textContent=d.expiredSubscriptions}catch(e){toast(e.message)}}
async function loadMembers(){try{members=await api("/api/members");$("memberTable").querySelector("tbody").innerHTML=members.map(m=>`<tr><td>#${m.member_id}</td><td><span class="person">${esc(m.name)}</span></td><td>${esc(m.email)}</td><td>${esc(m.phone)}</td><td>${date(m.join_date)}</td><td>${badge(m.status)}</td><td><button class="action" onclick="editRecord('member',${m.member_id})">Edit</button><button class="action delete" onclick="removeRecord('members',${m.member_id},loadMembers)">Delete</button></td></tr>`).join("")||emptyRow(7)}catch(e){toast(e.message)}}
async function loadPlans(){try{plans=await api("/api/plans");$("planTable").querySelector("tbody").innerHTML=plans.map(p=>`<tr><td>#${p.plan_id}</td><td class="person">${esc(p.plan_name)}</td><td>${p.duration_months} months</td><td>₹${Number(p.fee).toLocaleString("en-IN")}</td><td>${esc(p.description)}</td><td><button class="action" onclick="editRecord('plan',${p.plan_id})">Edit</button><button class="action delete" onclick="removeRecord('plans',${p.plan_id},loadPlans)">Delete</button></td></tr>`).join("")||emptyRow(6);$("planCards").innerHTML=plans.map(p=>`<article class="plan-card"><span class="duration">${p.duration_months} MONTH${p.duration_months>1?"S":""}</span><h3>${esc(p.plan_name)}</h3><strong>₹${Number(p.fee).toLocaleString("en-IN")}</strong><p>${esc(p.description||"Gym membership access.")}</p></article>`).join("")}catch(e){toast(e.message)}}
async function loadSubscriptions(){try{let rows=await api("/api/subscriptions");$("subscriptionTable").querySelector("tbody").innerHTML=rows.map(s=>`<tr><td>#${s.subscription_id}</td><td class="person">${esc(s.member_name)}</td><td>${esc(s.plan_name)}</td><td>${date(s.start_date)}</td><td>${date(s.end_date)}</td><td>${badge(s.payment_status)}</td><td>${badge(s.membership_status)}</td><td><button class="action" onclick="editRecord('subscription',${s.subscription_id})">Edit</button><button class="action delete" onclick="removeRecord('subscriptions',${s.subscription_id},loadSubscriptions)">Delete</button></td></tr>`).join("")||emptyRow(8)}catch(e){toast(e.message)}}
async function loadTrainers(){try{trainers=await api("/api/trainers");$("trainerTable").querySelector("tbody").innerHTML=trainers.map(t=>`<tr><td>#${t.trainer_id}</td><td class="person">${esc(t.trainer_name)}</td><td>${esc(t.specialty)}</td><td>${esc(t.phone)}</td></tr>`).join("")||emptyRow(4)}catch(e){toast(e.message)}}
async function loadAssignments(){try{let rows=await api("/api/assignments");$("assignmentTable").querySelector("tbody").innerHTML=rows.map(a=>`<tr><td>#${a.assignment_id}</td><td class="person">${esc(a.member_name)}</td><td>${esc(a.trainer_name)}</td><td>${date(a.assigned_date)}</td><td><button class="action delete" onclick="removeRecord('assignments',${a.assignment_id},loadAssignments)">Remove</button></td></tr>`).join("")||emptyRow(5)}catch(e){toast(e.message)}}
function emptyRow(n){return `<tr><td colspan="${n}" style="text-align:center;color:#9aa7a1;padding:28px">No records found. Add your first record.</td></tr>`}
function date(v){return v?new Date(v).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):""}
function filterTable(id,q){$(id).querySelectorAll("tbody tr").forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q.toLowerCase())?"":"none")}
function field(name,label,type="text",value="",opts=null,full=false){let control;if(type==="select")control=`<select name="${name}" required>${opts.map(o=>`<option value="${esc(o.value)}" ${String(value)===String(o.value)?"selected":""}>${esc(o.label)}</option>`).join("")}</select>`;else if(type==="textarea")control=`<textarea name="${name}">${esc(value)}</textarea>`;else control=`<input name="${name}" type="${type}" value="${esc(value)}" ${type==="number"?"min='0' step='any'":""} required>`;return `<div class="field ${full?"full":""}"><label>${label}</label>${control}</div>`}
function openModal(type,record=null){currentType=type;editing=record;let title={member:"Member",plan:"Membership Plan",subscription:"Subscription",trainer:"Trainer",assignment:"Trainer Assignment"}[type];$("modalTitle").textContent=(record?"Edit ":"Add ")+title;let f="";const m=record||{};
  if(type==="member")f=field("name","Full Name","text",m.name)+field("email","Email Address","email",m.email)+field("phone","Phone Number","tel",m.phone)+field("join_date","Join Date","date",m.join_date?String(m.join_date).slice(0,10):today)+field("status","Member Status","select",m.status||"Active",["Active","Inactive","On Hold"].map(x=>({value:x,label:x})));
  if(type==="plan")f=field("plan_name","Plan Name","text",m.plan_name)+field("duration_months","Duration (months)","number",m.duration_months||1)+field("fee","Fee (₹)","number",m.fee||"")+field("description","Description","textarea",m.description,null,true);
  if(type==="subscription")f=field("member_id","Member","select",m.member_id||"",members.map(x=>({value:x.member_id,label:x.name})),true)+field("plan_id","Membership Plan","select",m.plan_id||"",plans.map(x=>({value:x.plan_id,label:x.plan_name+" — ₹"+x.fee})),true)+field("start_date","Start Date","date",m.start_date?String(m.start_date).slice(0,10):today)+field("end_date","Expiry Date","date",m.end_date?String(m.end_date).slice(0,10):"")+field("payment_status","Payment Status","select",m.payment_status||"Pending",["Pending","Paid","Failed"].map(x=>({value:x,label:x})),true);
  if(type==="trainer")f=field("trainer_name","Trainer Name","text")+field("specialty","Specialty","text")+field("phone","Phone Number","tel");
  if(type==="assignment")f=field("member_id","Select Member","select","",members.map(x=>({value:x.member_id,label:x.name})),true)+field("trainer_id","Select Trainer","select","",trainers.map(x=>({value:x.trainer_id,label:x.trainer_name})),true)+field("assigned_date","Assigned Date","date",today);
  $("formFields").innerHTML=f;$("modalBackdrop").classList.remove("hidden")}
function closeModal(){$("modalBackdrop").classList.add("hidden");$("recordForm").reset();editing=null}
function backdropClose(e){if(e.target.id==="modalBackdrop")closeModal()}
async function editRecord(type,id){try{if(type==="member"){await loadMembers();openModal(type,members.find(x=>x.member_id===id))}else if(type==="plan"){await loadPlans();openModal(type,plans.find(x=>x.plan_id===id))}else if(type==="subscription"){await Promise.all([loadMembers(),loadPlans()]);let rows=await api("/api/subscriptions");openModal(type,rows.find(x=>x.subscription_id===id))}}catch(e){toast(e.message)}}
async function removeRecord(path,id,reload){if(!confirm("Are you sure you want to delete this record?"))return;try{await api(`/api/${path}/${id}`,{method:"DELETE"});toast("Record deleted.");reload()}catch(e){toast(e.message)}}
$("recordForm").addEventListener("submit",async e=>{e.preventDefault();let data=Object.fromEntries(new FormData(e.target).entries());try{
  if(currentType==="member")await api(editing?`/api/members/${editing.member_id}`:"/api/members",{method:editing?"PUT":"POST",body:JSON.stringify(data)});
  if(currentType==="plan")await api(editing?`/api/plans/${editing.plan_id}`:"/api/plans",{method:editing?"PUT":"POST",body:JSON.stringify(data)});
  if(currentType==="subscription")await api(editing?`/api/subscriptions/${editing.subscription_id}`:"/api/subscriptions",{method:editing?"PUT":"POST",body:JSON.stringify(data)});
  if(currentType==="trainer")await api("/api/trainers",{method:"POST",body:JSON.stringify(data)});
  if(currentType==="assignment")await api("/api/assignments",{method:"POST",body:JSON.stringify(data)});
  closeModal();toast("Saved successfully.");({member:loadMembers,plan:loadPlans,subscription:loadSubscriptions,trainer:loadTrainers,assignment:loadAssignments}[currentType])();
}catch(err){toast(err.message)}});
function prepareModal(type){if(type==="subscription")Promise.all([loadMembers(),loadPlans()]).then(()=>openModal(type));else if(type==="assignment")Promise.all([loadMembers(),loadTrainers()]).then(()=>openModal(type));else openModal(type)}
// Make inline Add buttons load the related dropdown data before opening forms.
loadDashboard();
