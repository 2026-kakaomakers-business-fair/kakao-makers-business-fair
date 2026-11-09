const $=selector=>document.querySelector(selector);
const form=$('#proposal');
let submitting=false,requestId=crypto.randomUUID();

let selectedFiles=[];
function renderFiles(){
  const list=$('#fileList');list.replaceChildren();
  selectedFiles.forEach((file,index)=>{
    const row=document.createElement('li'),name=document.createElement('span'),remove=document.createElement('button');
    name.textContent=file.name+' · '+(file.size/1024/1024).toFixed(1)+'MB';
    remove.type='button';remove.textContent='×';remove.disabled=submitting;remove.setAttribute('aria-label',file.name+' 삭제');
    remove.onclick=()=>{if(submitting)return;selectedFiles.splice(index,1);renderFiles();};
    row.append(name,remove);list.append(row);
  });
}
function addFiles(files){
  if(submitting)return;$('#fileError').textContent='';
  for(const file of files){
    if(selectedFiles.some(item=>item.name===file.name&&item.size===file.size&&item.lastModified===file.lastModified))continue;
    if(selectedFiles.length>=3){$('#fileError').textContent='파일은 최대 3개까지 첨부할 수 있어요.';break;}
    if(!/\.(pdf|ppt|pptx|jpe?g|png)$/i.test(file.name)){$('#fileError').textContent='PDF, PPT, PPTX, JPG, PNG 파일을 선택해 주세요.';continue;}
    if(!file.size||file.size>3*1024*1024){$('#fileError').textContent='첨부파일은 내용이 있는 3MB 이하의 파일을 선택해 주세요.';continue;}
    selectedFiles.push(file);
  }
  renderFiles();$('#files').value='';
}
$('#filePicker').onclick=()=>{if(!submitting)$('#files').click();};
$('#files').onchange=event=>addFiles(event.target.files);
$('#dropzone').ondragover=event=>event.preventDefault();
$('#dropzone').ondrop=event=>{event.preventDefault();addFiles(event.dataTransfer.files);};

form.addEventListener('change',()=>{
  const other=$('#category').value==='기타';
  $('#other').classList.toggle('hidden',!other);$('#other').required=other;
});
$('#features').addEventListener('input',event=>$('#charCount').textContent=event.target.value.length);
$('#phone').addEventListener('input',event=>{
  const digits=event.target.value.replace(/\D/g,'').slice(0,11);
  event.target.value=digits.length>7?digits.slice(0,3)+'-'+digits.slice(3,7)+'-'+digits.slice(7):digits.length>3?digits.slice(0,3)+'-'+digits.slice(3):digits;
});
$('#policyToggle').onclick=()=>{
  const open=$('#policy').hidden;$('#policy').hidden=!open;
  $('#policyToggle').setAttribute('aria-expanded',String(open));$('#policyToggle').textContent=open?'접기':'내용 보기';
};
form.addEventListener('submit',async event=>{
  event.preventDefault();if(submitting)return;$('#formError').textContent='';
  for(const input of form.querySelectorAll('input,textarea')) if(input.type!=='checkbox'&&input.type!=='file')input.value=input.value.trim();
  if(!form.checkValidity()){
    $('#formError').textContent='필수 항목과 입력 형식을 확인해 주세요. 연락처는 010-0000-0000 형식으로 작성해 주세요.';
    form.reportValidity();return;
  }
  const data=new FormData(form);
  if(data.get('link')&&!/^https?:\/\//i.test(data.get('link'))){
    $('#formError').textContent='자료 링크는 https:// 또는 http://로 시작해야 해요.';$('#link').focus();return;
  }
  data.set('requestId',requestId);if(data.get('category')!=='기타')data.set('other','');
  submitting=true;$('#filePicker').disabled=true;renderFiles();$('#submitButton').disabled=true;$('#submitButton').textContent='제안을 안전하게 보내고 있어요…';
  try {
    const result=await window.sendProposal(data,[...selectedFiles]);
    $('#receiptId').textContent=result.receipt;$('#receiptCompany').textContent=data.get('company');$('#receiptProduct').textContent=data.get('product');
    form.reset();selectedFiles=[];renderFiles();$('#application').hidden=true;$('#success').hidden=false;
    $('#successHeading').focus({preventScroll:true});$('#apply').scrollIntoView({behavior:'smooth',block:'start'});
    requestId=crypto.randomUUID();
  }catch(error){$('#formError').textContent=error.message||'접수하지 못했어요. 입력하신 내용은 유지됩니다.';$('#formError').focus();}
  finally{submitting=false;$('#filePicker').disabled=false;renderFiles();$('#submitButton').disabled=false;$('#submitButton').textContent='제안 제출하기';}
});
$('#another').onclick=()=>{
  form.reset();selectedFiles=[];renderFiles();$('#fileError').textContent='';$('#other').classList.add('hidden');$('#other').required=false;$('#charCount').textContent='0';
  $('#policy').hidden=true;$('#policyToggle').textContent='내용 보기';$('#policyToggle').setAttribute('aria-expanded','false');
  $('#formError').textContent='';$('#success').hidden=true;$('#application').hidden=false;$('#company').focus();
};
