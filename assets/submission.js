// Public intake URL; Google credentials and responses stay outside this repository.
const PROPOSAL_ENDPOINT = 'https://hook.eu1.make.com/o2fja8rh1ftfdqvd1e9ia2kf7p9eue7g';
const pendingReceipts = new Map();
window.sendProposal = async function(data) {
  if(data.get('consent')!=='on') throw new Error('개인정보 수집 및 이용에 동의해 주세요.');
  const requestId=String(data.get('requestId')||'');
  if(!/^[a-f0-9-]{36}$/.test(requestId)) throw new Error('접수 정보를 확인하지 못했어요. 페이지를 새로 열어 주세요.');
  if(!pendingReceipts.has(requestId)) {
    const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replaceAll('-','');
    pendingReceipts.set(requestId,'MK-'+date+'-'+requestId.replaceAll('-','').slice(0,8).toUpperCase());
  }
  const receipt=pendingReceipts.get(requestId),payload=new URLSearchParams();
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
