// GitHub Pages preview only. No request, upload, storage or Google connection.
let previewSequence=0;
window.sendProposal=async function(){
  await new Promise(resolve=>setTimeout(resolve,500));
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format().replaceAll('-','');
  return {receipt:'MK-'+day+'-'+String(++previewSequence).padStart(4,'0')};
};
