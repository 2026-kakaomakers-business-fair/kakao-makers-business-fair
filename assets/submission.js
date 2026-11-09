// Public intake URL; Google credentials and responses stay outside this repository.
const PROPOSAL_ENDPOINT = 'https://hook.eu1.make.com/o2fja8rh1ftfdqvd1e9ia2kf7p9eue7g';
const pendingReceipts = new Map();

const MAX_ATTACHMENT_BYTES=3*1024*1024;
const UPLOAD_ENDPOINT='https://hook.eu1.make.com/mvikopuztsbz9gsta2gvmhncw06zq87s';
const uploadedFiles=new WeakMap();
async function fileBase64(file){
  if(!file.size||file.size>MAX_ATTACHMENT_BYTES)throw new Error('첨부파일은 내용이 있는 3MB 이하의 파일을 선택해 주세요.');
  const ext=file.name.split('.').pop().toLowerCase();
  const bytes=new Uint8Array(await file.slice(0,8).arrayBuffer());
  const signature=[...bytes].join(',');
  const valid=ext==='pdf'?signature.startsWith('37,80,68,70,45'):ext==='png'?signature==='137,80,78,71,13,10,26,10':/^(jpg|jpeg)$/.test(ext)?signature.startsWith('255,216,255'):ext==='pptx'?signature.startsWith('80,75'):ext==='ppt'?signature==='208,207,17,224,161,177,26,225':false;
  if(!valid)throw new Error(file.name+': 파일의 실제 형식과 확장자를 확인해 주세요.');
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result).split(',')[1]);
    reader.onerror=()=>reject(new Error(file.name+': 파일을 읽지 못했어요. 다시 선택해 주세요.'));
    reader.readAsDataURL(file);
  });
}
async function uploadAttachment(file,requestId,receipt){
  const previous=uploadedFiles.get(file);
  if(previous&&previous.requestId===requestId)return previous.id;
  const base64=await fileBase64(file);
  const payload=new FormData();
  payload.set('filename',file.name.replace(/[\\/\u0000-\u001f]/g,'_').slice(-180));
  payload.set('base64',base64);payload.set('requestId',requestId);payload.set('receipt',receipt);payload.set('consent','true');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
  try{
    const response=await fetch(UPLOAD_ENDPOINT,{method:'POST',body:payload,credentials:'omit',signal:controller.signal});
    if(!response.ok)throw new Error(file.name+': 첨부파일을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    let saved;
    try{saved=await response.json();}catch{throw new Error(file.name+': 파일 저장 완료를 확인하지 못했어요.');}
    if(saved.ok!==true||saved.receipt!==receipt||!/^[\w-]{10,}$/.test(saved.fileId||''))throw new Error(file.name+': 첨부파일 저장 결과를 확인하지 못했어요.');
    uploadedFiles.set(file,{requestId,id:saved.fileId});return saved.fileId;
  }catch(error){
    if(error.name==='AbortError'||error instanceof TypeError)throw new Error(file.name+': 파일 전송이 지연되고 있어요. 입력 내용과 선택한 파일은 유지됩니다.');
    throw error;
  }finally{clearTimeout(timer);}
}

window.sendProposal = async function(data,files=[]) {
  if(data.get('consent')!=='on') throw new Error('개인정보 수집 및 이용에 동의해 주세요.');
  const requestId=String(data.get('requestId')||'');
  if(!/^[a-f0-9-]{36}$/.test(requestId)) throw new Error('접수 정보를 확인하지 못했어요. 페이지를 새로 열어 주세요.');
  if(!pendingReceipts.has(requestId)) {
    const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replaceAll('-','');
    pendingReceipts.set(requestId,'MK-'+date+'-'+requestId.replaceAll('-','').slice(0,8).toUpperCase());
  }
  const receipt=pendingReceipts.get(requestId),payload=new URLSearchParams();
  if(files.length>3)throw new Error('파일은 최대 3개까지 첨부할 수 있어요.');
  const ids=[];
  for(const file of files)ids.push(await uploadAttachment(file,requestId,receipt));
  payload.set('attachmentLinks',ids.map(id=>'https://drive.google.com/file/d/'+id+'/view').join('\n'));
  for(const name of ['company','contact','phone','email','category','other','product','features','proposalType','link']) payload.set(name,String(data.get(name)||'').trim());
  payload.set('requestId',requestId);payload.set('consent','true');payload.set('receipt',receipt);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
  try {
    const response=await fetch(PROPOSAL_ENDPOINT,{method:'POST',body:payload,credentials:'omit',signal:controller.signal});
    if(!response.ok) throw new Error('접수 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
    let result;
    try {result=await response.json();}
    catch {throw new Error('저장 완료를 확인하지 못했어요. 입력 내용과 개인정보 동의를 확인해 주세요.');}
    if(result.ok!==true||result.receipt!==receipt) throw new Error('저장 결과를 확인하지 못했어요. 입력 내용은 유지됩니다.');
    pendingReceipts.delete(requestId);
    return result;
  } catch(error) {
    if(error.name==='AbortError'||error instanceof TypeError) throw new Error('연결이 지연되어 저장 여부를 확인하지 못했어요. 중복 접수를 피하려면 담당자에게 접수번호 '+receipt+'로 확인해 주세요. 입력 내용은 유지됩니다.');
    throw error;
  } finally {clearTimeout(timer);}
};
