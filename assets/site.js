const $=selector=>document.querySelector(selector);
const form=$('#proposal');
form.addEventListener('submit',event=>event.preventDefault());
$('#policyToggle').onclick=()=>{const open=$('#policy').hidden;$('#policy').hidden=!open;$('#policyToggle').setAttribute('aria-expanded',String(open));$('#policyToggle').textContent=open?'접기':'내용 보기';};
